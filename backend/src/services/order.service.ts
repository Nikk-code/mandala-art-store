import { createHash } from 'crypto';
import {
  generateGuestAccessToken,
  hashGuestAccessToken,
  verifyGuestAccessToken,
} from '../utils/guest-token';
import { prisma } from '../db/prisma';
import { PrismaClient, OrderStatus, type Coupon } from '@prisma/client';
import {
  orderRepository,
  type OrderRepository,
  type OrderWithDetails,
  type AdminOrderRecord,
} from '../repositories/order.repository';
import { NotFoundError, BadRequestError, ConflictError } from '../errors';
import {
  validateCreateOrderRequest,
  validateUpdateOrderRequest,
} from '../utils/checkout-validation';
import { generateOrderNumber } from '../utils/order-number';
import { validateUuid } from '../utils/catalog-validation';
import {
  normalizeCouponCode,
  calculateDiscountAmount,
  validateCouponEligibility,
} from '../utils/coupon-validation';
import {
  validateAdminOrderListQuery,
  validateUpdateOrderStatusInput,
} from '../utils/order-admin-validation';
import { resolveEffectivePaymentStatus } from '../utils/payment-status';
import type {
  CreateOrderRequest,
  UpdateCheckoutOrderRequest,
  OrderResponseDto,
  OrderDetailsDto,
  OrderItemSnapshotDto,
  OrderHistoryResponseDto,
  OrderHistoryItemDto,
} from '../types/checkout';
import type {
  AdminOrderListItemDto,
  AdminOrderDetailsDto,
  PaginatedAdminOrdersResponse,
} from '../types/admin';

interface IdempotencyEntry {
  response: OrderResponseDto;
  payloadHash: string;
  createdAt: number;
}

/**
 * Computes a deterministic SHA-256 hash of a normalized CreateOrderRequest payload.
 */
export function computePayloadHash(req: CreateOrderRequest): string {
  const canonical = {
    customer: {
      email: req.customer.email.trim().toLowerCase(),
      fullName: req.customer.fullName.trim(),
      phone: req.customer.phone.trim(),
    },
    shippingAddress: {
      addressLine1: req.shippingAddress.addressLine1.trim(),
      addressLine2: req.shippingAddress.addressLine2
        ? req.shippingAddress.addressLine2.trim()
        : null,
      city: req.shippingAddress.city.trim(),
      state: req.shippingAddress.state.trim(),
      postalCode: req.shippingAddress.postalCode.trim(),
      country: req.shippingAddress.country ? req.shippingAddress.country.trim() : 'India',
    },
    items: [...req.items]
      .sort((a, b) => a.productId.localeCompare(b.productId))
      .map(i => ({ productId: i.productId.trim(), quantity: i.quantity })),
    couponCode: req.couponCode ? normalizeCouponCode(req.couponCode) : null,
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

export class OrderService {
  private readonly repository: OrderRepository;
  private readonly prismaClient: PrismaClient;
  private readonly idempotencyCache = new Map<string, IdempotencyEntry>();
  private readonly inFlightRequests = new Map<string, Promise<OrderResponseDto>>();
  private readonly IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(repository: OrderRepository = orderRepository, prismaClient: PrismaClient = prisma) {
    this.repository = repository;
    this.prismaClient = prismaClient;
  }

  /**
   * Cleans up expired idempotency entries to prevent memory leaks.
   */
  private cleanupIdempotencyCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.idempotencyCache.entries()) {
      if (now - entry.createdAt > this.IDEMPOTENCY_TTL_MS) {
        this.idempotencyCache.delete(key);
      }
    }
  }

  /**
   * Creates an order atomically:
   * 1. Validates customer, shipping address, and items server-side.
   * 2. Checks idempotency cache to prevent duplicate order creation.
   * 3. Fetches authoritative products and categories from database.
   * 4. Validates product active status, category active status, and availability.
   * 5. Atomically reserves/decrements stock for IN_STOCK products inside transaction.
   * 6. Calculates authoritative integer-paise financial totals (subtotal, total).
   * 7. Creates Order, OrderItem snapshots, and pending Payment record in a single transaction.
   * 8. Returns sanitized public OrderResponseDto.
   */
  async createOrder(
    rawRequest: CreateOrderRequest,
    idempotencyKey?: string | null,
    userId?: string | null
  ): Promise<OrderResponseDto> {
    // 1. Strict Server-Side Validation
    const validatedRequest = validateCreateOrderRequest(rawRequest);

    // 2. Handle Idempotency / Duplicate Submission Protection
    const cleanKey = idempotencyKey?.trim();
    let scopedKey: string | null = null;
    let payloadHash: string | null = null;

    if (cleanKey) {
      this.cleanupIdempotencyCache();
      scopedKey = userId
        ? `user:${userId.trim()}:${cleanKey}`
        : `guest:${validatedRequest.customer.email.trim().toLowerCase()}:${cleanKey}`;
      payloadHash = computePayloadHash(validatedRequest);

      // Check if already completed
      const cached = this.idempotencyCache.get(scopedKey);
      if (cached && Date.now() - cached.createdAt <= this.IDEMPOTENCY_TTL_MS) {
        if (cached.payloadHash !== payloadHash) {
          throw new ConflictError('Idempotency key reuse with mismatched request payload.');
        }
        return cached.response;
      }

      // Check if identical request is currently in flight
      const inFlight = this.inFlightRequests.get(scopedKey);
      if (inFlight) {
        return inFlight;
      }
    }

    // Generate guest access token for unauthenticated checkouts
    const isGuest = !userId;
    const guestAccessToken = isGuest ? generateGuestAccessToken() : null;
    const guestAccessTokenHash = guestAccessToken ? hashGuestAccessToken(guestAccessToken) : null;

    const orderPromise = this.executeCreateOrderTransaction(
      validatedRequest,
      userId ?? null,
      guestAccessTokenHash
    );

    if (scopedKey) {
      this.inFlightRequests.set(scopedKey, orderPromise);
    }

    try {
      const result = await orderPromise;
      if (guestAccessToken) {
        result.guestAccessToken = guestAccessToken;
      }
      if (scopedKey && payloadHash) {
        this.idempotencyCache.set(scopedKey, {
          response: result,
          payloadHash,
          createdAt: Date.now(),
        });
      }
      return result;
    } finally {
      if (scopedKey) {
        this.inFlightRequests.delete(scopedKey);
      }
    }
  }

  private async executeCreateOrderTransaction(
    request: CreateOrderRequest,
    userId: string | null,
    guestAccessTokenHash?: string | null
  ): Promise<OrderResponseDto> {
    const createdOrder = await this.prismaClient.$transaction(async tx => {
      let authoritativeSubtotal = 0;
      const orderItemSnapshots: Array<{
        productId: string | null;
        productName: string;
        productSku: string;
        unitPrice: number;
        quantity: number;
        total: number;
      }> = [];

      // Process each item with authoritative database state
      for (const item of request.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });

        // Product existence check
        if (!product) {
          throw new NotFoundError(`Product with ID "${item.productId}" was not found.`);
        }

        // Product active check
        if (!product.isActive) {
          throw new BadRequestError(`Product "${product.name}" is no longer available.`);
        }

        // Category active check
        if (!product.category || !product.category.isActive) {
          throw new BadRequestError(`Category for product "${product.name}" is inactive.`);
        }

        // Availability and Inventory rules
        if (product.availability === 'SOLD_OUT') {
          throw new ConflictError(`Product "${product.name}" is sold out and cannot be purchased.`);
        }

        if (product.availability === 'IN_STOCK') {
          // Check stock before decrementing
          if (product.stockQuantity < item.quantity) {
            throw new ConflictError(
              `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, requested: ${item.quantity}.`
            );
          }

          // Atomic conditional update to guard against race conditions
          const updateResult = await tx.product.updateMany({
            where: {
              id: product.id,
              isActive: true,
              availability: 'IN_STOCK',
              stockQuantity: { gte: item.quantity },
            },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });

          if (updateResult.count === 0) {
            throw new ConflictError(
              `Unable to reserve stock for "${product.name}". The item may have just sold out.`
            );
          }

          // Automatically transition to SOLD_OUT if inventory reached 0
          await tx.product.updateMany({
            where: {
              id: product.id,
              stockQuantity: 0,
              availability: 'IN_STOCK',
            },
            data: {
              availability: 'SOLD_OUT',
            },
          });
        } else if (product.availability === 'MADE_TO_ORDER') {
          // MADE_TO_ORDER does not track/decrement physical stockQuantity
        }

        // Authoritative pricing calculation (all values in integer paise)
        const itemTotal = product.price * item.quantity;
        authoritativeSubtotal += itemTotal;

        orderItemSnapshots.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          unitPrice: product.price,
          quantity: item.quantity,
          total: itemTotal,
        });
      }

      // Authoritative Coupon Validation & Discount Calculation
      let appliedCouponId: string | null = null;
      let appliedCouponCode: string | null = null;
      let discountAmount = 0;

      if (request.couponCode) {
        const normalizedCode = normalizeCouponCode(request.couponCode);

        // Find coupon by code
        const rawCoupon = await tx.coupon.findUnique({
          where: { code: normalizedCode },
        });

        if (!rawCoupon) {
          throw new NotFoundError(`Coupon code "${normalizedCode}" was not found.`);
        }

        // Lock the coupon row using PostgreSQL FOR UPDATE
        const rows = await tx.$queryRaw<Coupon[]>`
          SELECT * FROM "coupons"
          WHERE "id" = ${rawCoupon.id}::uuid
          FOR UPDATE
        `;
        const lockedCoupon = rows[0];

        if (!lockedCoupon) {
          throw new NotFoundError(`Coupon "${normalizedCode}" was not found.`);
        }

        // Validate active status, date validity, and minimum order subtotal
        validateCouponEligibility(lockedCoupon, authoritativeSubtotal);

        // Canonical Capacity Rule:
        // Occupied Slots = timesUsed + active, unexpired PENDING_PAYMENT reservations (15 min window)
        if (lockedCoupon.usageLimit !== null) {
          const reservationRows = await tx.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*)::bigint AS count FROM "orders"
            WHERE "coupon_id" = ${lockedCoupon.id}::uuid
              AND "status" = 'PENDING_PAYMENT'
              AND "created_at" >= (NOW() - INTERVAL '15 minutes')
          `;
          const pendingCount = Number(reservationRows[0]?.count ?? 0);
          const occupiedSlots = lockedCoupon.timesUsed + pendingCount;

          if (occupiedSlots >= lockedCoupon.usageLimit) {
            throw new ConflictError(
              `Coupon "${lockedCoupon.code}" has reached its maximum usage limit.`
            );
          }
        }

        // Authoritative integer paise discount calculation with Razorpay payable floor (>= 100 paise)
        discountAmount = calculateDiscountAmount(authoritativeSubtotal, lockedCoupon);
        appliedCouponId = lockedCoupon.id;
        appliedCouponCode = lockedCoupon.code;
      }

      // Financial calculations (all in integer paise)
      const shippingFee = 0;
      const taxAmount = 0;
      const authoritativeTotal = authoritativeSubtotal - discountAmount + shippingFee + taxAmount;

      // Unique Order Number Generation
      const orderNumber = generateOrderNumber();

      // Persist Order + OrderItems + Payment inside transaction
      const order = await this.repository.createOrderTransaction(tx, {
        orderNumber,
        userId,
        customerEmail: request.customer.email,
        customerPhone: request.customer.phone,
        guestAccessTokenHash: guestAccessTokenHash ?? null,
        subtotal: authoritativeSubtotal,
        discountAmount,
        shippingFee,
        taxAmount,
        total: authoritativeTotal,
        couponId: appliedCouponId,
        couponCode: appliedCouponCode,
        shippingRecipientName: request.customer.fullName,
        shippingPhone: request.customer.phone,
        shippingAddressLine1: request.shippingAddress.addressLine1,
        shippingAddressLine2: request.shippingAddress.addressLine2 ?? null,
        shippingCity: request.shippingAddress.city,
        shippingState: request.shippingAddress.state,
        shippingPostalCode: request.shippingAddress.postalCode,
        shippingCountry: request.shippingAddress.country ?? 'India',
        items: orderItemSnapshots,
        payment: {
          amount: authoritativeTotal,
          currency: 'INR',
          provider: 'razorpay',
        },
      });

      return order;
    });

    return this.mapToOrderResponseDto(createdOrder);
  }

  /**
   * Authorizes access to an order.
   * - If the order belongs to a registered customer (userId is not null), only that authenticated customer may access it.
   * - If the order is a guest order (userId is null), the caller MUST supply a valid guestAccessToken matching the stored hash.
   * - Never permits email-based fallback or cross-order token reuse.
   */
  private authorizeOrderAccess(
    order: { id: string; userId: string | null; guestAccessTokenHash?: string | null },
    requestUser?: { id: string; email: string } | null,
    guestAccessToken?: string | null
  ): void {
    if (order.userId) {
      if (!requestUser || requestUser.id !== order.userId) {
        throw new NotFoundError(`Order with ID "${order.id}" was not found.`);
      }
    } else {
      if (
        !guestAccessToken ||
        !verifyGuestAccessToken(order.guestAccessTokenHash, guestAccessToken)
      ) {
        throw new NotFoundError(`Order with ID "${order.id}" was not found.`);
      }
    }
  }

  /**
   * Updates contact, shipping address, and/or coupon on an existing PENDING_PAYMENT order.
   * Reuses the same order and maintains reserved inventory without double reservation or 1-of-1 lockout.
   */
  async updatePendingOrder(
    orderId: string,
    rawRequest: UpdateCheckoutOrderRequest,
    requestUser?: { id: string; email: string } | null,
    guestAccessToken?: string | null
  ): Promise<OrderResponseDto> {
    validateUuid(orderId, 'orderId');
    const validatedRequest = validateUpdateOrderRequest(rawRequest);

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID "${orderId}" was not found.`);
    }

    // Strict Authorization Check: requires user ownership or valid guest access token
    this.authorizeOrderAccess(order, requestUser, guestAccessToken);

    // State validation
    if (order.status !== 'PENDING_PAYMENT') {
      throw new ConflictError(
        `Cannot modify order: current order status is "${order.status}", but updates require PENDING_PAYMENT.`
      );
    }

    const hasCapturedPayment = order.payments?.some(
      p => p.status === 'CAPTURED' || p.status === 'AUTHORIZED'
    );
    if (hasCapturedPayment) {
      throw new ConflictError(
        'Cannot modify order: payment has already been authorized or captured.'
      );
    }

    const updatedOrder = await this.prismaClient.$transaction(async tx => {
      // Serialize with concurrent payment capture and expiration via row lock
      if (typeof tx.$queryRaw === 'function') {
        await tx.$queryRaw`
          SELECT "id" FROM "orders"
          WHERE "id" = ${order.id}::uuid
          FOR UPDATE
        `;
      }

      const freshOrder =
        (typeof tx.order.findUnique === 'function'
          ? await tx.order.findUnique({
              where: { id: order.id },
              include: { payments: true },
            })
          : null) ?? order;

      if (!freshOrder || freshOrder.status !== 'PENDING_PAYMENT') {
        throw new ConflictError(
          `Cannot modify order: current order status is "${freshOrder?.status ?? 'UNKNOWN'}", but updates require PENDING_PAYMENT.`
        );
      }

      const hasCaptured = freshOrder.payments?.some(
        p => p.status === 'CAPTURED' || p.status === 'AUTHORIZED'
      );
      if (hasCaptured) {
        throw new ConflictError(
          'Cannot modify order: payment has already been authorized or captured.'
        );
      }
      // Update customer & shipping details
      const customerEmail = validatedRequest.customer?.email ?? order.customerEmail;
      const customerPhone = validatedRequest.customer?.phone ?? order.customerPhone;
      const shippingRecipientName =
        validatedRequest.customer?.fullName ?? order.shippingRecipientName;
      const shippingPhone = validatedRequest.customer?.phone ?? order.shippingPhone;
      const shippingAddressLine1 =
        validatedRequest.shippingAddress?.addressLine1 ?? order.shippingAddressLine1;
      const shippingAddressLine2 =
        validatedRequest.shippingAddress?.addressLine2 !== undefined
          ? validatedRequest.shippingAddress.addressLine2
          : order.shippingAddressLine2;
      const shippingCity = validatedRequest.shippingAddress?.city ?? order.shippingCity;
      const shippingState = validatedRequest.shippingAddress?.state ?? order.shippingState;
      const shippingPostalCode =
        validatedRequest.shippingAddress?.postalCode ?? order.shippingPostalCode;
      const shippingCountry = validatedRequest.shippingAddress?.country ?? order.shippingCountry;

      // Handle coupon update under row lock
      let appliedCouponId: string | null = order.couponId;
      let appliedCouponCode: string | null = order.couponCode;
      let discountAmount = order.discountAmount;

      if (validatedRequest.couponCode !== undefined) {
        if (validatedRequest.couponCode === null) {
          appliedCouponId = null;
          appliedCouponCode = null;
          discountAmount = 0;
        } else {
          const normalizedCode = normalizeCouponCode(validatedRequest.couponCode);
          const rawCoupon = await tx.coupon.findUnique({
            where: { code: normalizedCode },
          });

          if (!rawCoupon) {
            throw new NotFoundError(`Coupon code "${normalizedCode}" was not found.`);
          }

          const rows = await tx.$queryRaw<Coupon[]>`
            SELECT * FROM "coupons"
            WHERE "id" = ${rawCoupon.id}::uuid
            FOR UPDATE
          `;
          const lockedCoupon = rows[0];

          if (!lockedCoupon) {
            throw new NotFoundError(`Coupon "${normalizedCode}" was not found.`);
          }

          validateCouponEligibility(lockedCoupon, order.subtotal);

          if (lockedCoupon.usageLimit !== null) {
            // Count other active reservations (excluding this order itself)
            const reservationRows = await tx.$queryRaw<[{ count: bigint }]>`
              SELECT COUNT(*)::bigint AS count FROM "orders"
              WHERE "coupon_id" = ${lockedCoupon.id}::uuid
                AND "status" = 'PENDING_PAYMENT'
                AND "id" != ${order.id}::uuid
                AND "created_at" >= (NOW() - INTERVAL '15 minutes')
            `;
            const otherPendingCount = Number(reservationRows[0]?.count ?? 0);
            const occupiedSlots = lockedCoupon.timesUsed + otherPendingCount;

            if (occupiedSlots >= lockedCoupon.usageLimit) {
              throw new ConflictError(
                `Coupon "${lockedCoupon.code}" has reached its maximum usage limit.`
              );
            }
          }

          discountAmount = calculateDiscountAmount(order.subtotal, lockedCoupon);
          appliedCouponId = lockedCoupon.id;
          appliedCouponCode = lockedCoupon.code;
        }
      }

      const newTotal = order.subtotal - discountAmount + order.shippingFee + order.taxAmount;

      // Persist order update
      const savedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          customerEmail,
          customerPhone,
          shippingRecipientName,
          shippingPhone,
          shippingAddressLine1,
          shippingAddressLine2,
          shippingCity,
          shippingState,
          shippingPostalCode,
          shippingCountry,
          couponId: appliedCouponId,
          couponCode: appliedCouponCode,
          discountAmount,
          total: newTotal,
        },
        include: {
          items: true,
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Update pending payment amount if total changed
      if (savedOrder.payments && savedOrder.payments.length > 0) {
        await tx.payment.updateMany({
          where: {
            orderId: order.id,
            status: 'PENDING',
          },
          data: {
            amount: newTotal,
            providerOrderId: null, // Reset provider order id to force new Razorpay order generation with updated amount
          },
        });
      }

      return savedOrder;
    });

    return this.mapToOrderResponseDto(updatedOrder);
  }

  /**
   * Cancels an unpaid PENDING_PAYMENT order and immediately restores reserved inventory.
   */
  async cancelPendingOrder(
    orderId: string,
    requestUser?: { id: string; email: string } | null,
    guestAccessToken?: string | null,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    validateUuid(orderId, 'orderId');

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID "${orderId}" was not found.`);
    }

    // Strict Authorization Check: requires user ownership or valid guest access token
    this.authorizeOrderAccess(order, requestUser, guestAccessToken);

    if (order.status === 'CANCELLED') {
      return { success: true, message: 'Order is already cancelled.' };
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new ConflictError(
        `Cannot cancel order: current order status is "${order.status}", but cancellation requires PENDING_PAYMENT.`
      );
    }

    const cancellationReason = reason
      ? `[CANCELLED_BY_CUSTOMER] ${reason}`
      : '[CANCELLED_BY_CUSTOMER] Order was cancelled by customer. Reserved stock released.';

    const result = await this.repository.cancelOrderAndRestoreStock(order.id, cancellationReason);

    if (!result.cancelled) {
      throw new ConflictError('Order could not be cancelled. It may have already been processed.');
    }

    return {
      success: true,
      message: `Order "${order.orderNumber}" cancelled successfully and reserved inventory was restored.`,
    };
  }

  /**
   * Retrieves an order for checkout recovery, authorized for the owning user or matching guest access token.
   */
  async getPendingOrderForCheckout(
    orderId: string,
    requestUser?: { id: string; email: string } | null,
    guestAccessToken?: string | null
  ): Promise<OrderResponseDto> {
    validateUuid(orderId, 'orderId');

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID "${orderId}" was not found.`);
    }

    // Strict Authorization Check: requires user ownership or valid guest access token
    this.authorizeOrderAccess(order, requestUser, guestAccessToken);

    return this.mapToOrderResponseDto(order);
  }

  /**
   * Retrieves a single customer order by ID after authenticating user ownership.
   */
  async getOrderById(orderId: string, userId: string): Promise<OrderDetailsDto> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!orderId || typeof orderId !== 'string' || !uuidRegex.test(orderId.trim())) {
      throw new BadRequestError('Invalid or missing orderId parameter.');
    }

    if (!userId || typeof userId !== 'string' || !uuidRegex.test(userId.trim())) {
      throw new BadRequestError('Invalid or missing userId parameter.');
    }

    const cleanOrderId = orderId.trim();
    const cleanUserId = userId.trim();

    const order = await this.repository.findById(cleanOrderId);
    if (!order) {
      throw new NotFoundError(`Order with ID "${cleanOrderId}" was not found.`);
    }

    // Strict Authorization: Avoid resource enumeration by returning NotFoundError if order is a guest order or belongs to another customer
    if (!order.userId || order.userId !== cleanUserId) {
      throw new NotFoundError(`Order with ID "${cleanOrderId}" was not found.`);
    }

    const baseDto = this.mapToOrderResponseDto(order);
    const payment = order.payments && order.payments.length > 0 ? order.payments[0] : null;
    const payments = order.payments?.map(p => ({
      id: p.id,
      provider: p.provider,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      failureReason: p.failureReason,
    }));

    return {
      ...baseDto,
      paidAt: payment?.paidAt ? payment.paidAt.toISOString() : null,
      payments,
    };
  }

  /**
   * Retrieves paginated order history for the authenticated customer.
   */
  async getOrderHistory(userId: string, page = 1, pageSize = 10): Promise<OrderHistoryResponseDto> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || typeof userId !== 'string' || !uuidRegex.test(userId.trim())) {
      throw new BadRequestError('Invalid or missing userId parameter.');
    }

    const cleanUserId = userId.trim();
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 50 ? pageSize : 10;

    const { orders, total } = await this.repository.findByUserId(cleanUserId, {
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });

    const mappedOrders: OrderHistoryItemDto[] = orders.map(order => {
      const items: OrderItemSnapshotDto[] = (order.items || []).map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.total,
      }));

      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.payments?.[0]?.status ?? 'PENDING',
        total: order.total,
        currency: 'INR',
        itemCount,
        items,
        createdAt: order.createdAt.toISOString(),
      };
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);

    return {
      orders: mappedOrders,
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages,
      },
    };
  }

  private mapToOrderResponseDto(order: OrderWithDetails): OrderResponseDto {
    const itemsDto: OrderItemSnapshotDto[] = (order.items || []).map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: item.total,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payments?.[0]?.status ?? 'PENDING',
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      couponCode: order.couponCode ?? null,
      shippingFee: order.shippingFee,
      taxAmount: order.taxAmount,
      total: order.total,
      currency: 'INR',
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: {
        recipientName: order.shippingRecipientName,
        phone: order.shippingPhone,
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
      items: itemsDto,
      createdAt: order.createdAt.toISOString(),
    };
  }

  // ============================================================================
  // ADMINISTRATIVE ORDER MANAGEMENT METHODS
  // ============================================================================

  /**
   * Retrieves paginated orders for administration with search, status filters, payment filters, and date ranges.
   */
  async getAdminOrders(rawQuery: Record<string, unknown>): Promise<PaginatedAdminOrdersResponse> {
    const validatedQuery = validateAdminOrderListQuery(rawQuery);

    const { orders, total } = await this.repository.findAdminOrders(
      {
        search: validatedQuery.search,
        status: validatedQuery.status,
        paymentStatus: validatedQuery.paymentStatus,
        from: validatedQuery.from,
        to: validatedQuery.to,
      },
      {
        skip: (validatedQuery.page! - 1) * validatedQuery.pageSize!,
        take: validatedQuery.pageSize!,
        sort: validatedQuery.sort,
      }
    );

    const totalPages = total === 0 ? 0 : Math.ceil(total / validatedQuery.pageSize!);

    return {
      items: orders.map(order => this.mapToAdminOrderListItemDto(order)),
      pagination: {
        page: validatedQuery.page!,
        pageSize: validatedQuery.pageSize!,
        totalItems: total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves complete order details for administration without customer ownership restriction.
   * Safely handles guest checkout orders and registered patron profiles.
   */
  async getAdminOrderById(orderId: string): Promise<AdminOrderDetailsDto> {
    const cleanOrderId = validateUuid(orderId, 'Order ID');

    const order = await this.repository.findAdminOrderById(cleanOrderId);
    if (!order) {
      throw new NotFoundError(`Order with ID "${cleanOrderId}" was not found.`);
    }

    return this.mapToAdminOrderDetailsDto(order);
  }

  /**
   * Authoritatively updates order fulfillment status by an administrator.
   * Enforces:
   * 1. Target status must be one of: PROCESSING, SHIPPED, DELIVERED.
   * 2. Allowed transitions:
   *    - CONFIRMED -> PROCESSING
   *    - PROCESSING -> SHIPPED (requires trackingNumber & courierName)
   *    - SHIPPED -> DELIVERED
   * 3. Order must possess verified CAPTURED payment evidence.
   * 4. Conditional database update to prevent lost updates or stale writes under concurrency.
   */
  async updateOrderStatusByAdmin(
    orderId: string,
    rawInput: unknown
  ): Promise<AdminOrderDetailsDto> {
    const cleanOrderId = validateUuid(orderId, 'Order ID');
    const validatedInput = validateUpdateOrderStatusInput(rawInput);

    // Initial read to inspect current domain state and payment evidence
    const currentOrder = await this.repository.findAdminOrderById(cleanOrderId);
    if (!currentOrder) {
      throw new NotFoundError(`Order with ID "${cleanOrderId}" was not found.`);
    }

    // 1. Payment Verification Check: Order must possess verified CAPTURED payment evidence
    const hasCapturedPayment = currentOrder.payments?.some(p => p.status === 'CAPTURED');
    if (!hasCapturedPayment) {
      throw new ConflictError(
        `Cannot advance order "${currentOrder.orderNumber}". Only orders with verified CAPTURED payment can be fulfilled.`
      );
    }

    // 2. Strict State Transition Validation
    const expectedCurrentStatus = this.determineExpectedCurrentStatus(
      currentOrder.status,
      validatedInput.status
    );

    // 3. Concurrency-Guarded Conditional Update
    const updatedOrder = await this.repository.updateOrderStatusConditionally(
      cleanOrderId,
      expectedCurrentStatus,
      validatedInput.status,
      {
        trackingNumber: validatedInput.trackingNumber,
        courierName: validatedInput.courierName,
      }
    );

    if (!updatedOrder) {
      throw new ConflictError(
        'Order status could not be updated due to a concurrent state modification. Please refresh and retry.'
      );
    }

    return this.mapToAdminOrderDetailsDto(updatedOrder);
  }

  private determineExpectedCurrentStatus(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus
  ): OrderStatus {
    switch (targetStatus) {
      case OrderStatus.PROCESSING:
        if (currentStatus !== OrderStatus.CONFIRMED) {
          throw new ConflictError(
            `Invalid status transition. Orders can only transition to PROCESSING from CONFIRMED (current status is "${currentStatus}").`
          );
        }
        return OrderStatus.CONFIRMED;

      case OrderStatus.SHIPPED:
        if (currentStatus !== OrderStatus.PROCESSING) {
          throw new ConflictError(
            `Invalid status transition. Orders can only transition to SHIPPED from PROCESSING (current status is "${currentStatus}").`
          );
        }
        return OrderStatus.PROCESSING;

      case OrderStatus.DELIVERED:
        if (currentStatus !== OrderStatus.SHIPPED) {
          throw new ConflictError(
            `Invalid status transition. Orders can only transition to DELIVERED from SHIPPED (current status is "${currentStatus}").`
          );
        }
        return OrderStatus.SHIPPED;

      default:
        throw new BadRequestError(`Unsupported target status "${targetStatus}".`);
    }
  }

  private mapToAdminOrderListItemDto(order: AdminOrderRecord): AdminOrderListItemDto {
    const itemCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
    const paymentStatus = resolveEffectivePaymentStatus(order.payments);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingRecipientName: order.shippingRecipientName,
      isGuest: order.userId === null,
      userId: order.userId,
      status: order.status,
      paymentStatus,
      total: order.total,
      itemCount,
      trackingNumber: order.trackingNumber,
      courierName: order.courierName,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private mapToAdminOrderDetailsDto(order: AdminOrderRecord): AdminOrderDetailsDto {
    const paymentStatus = resolveEffectivePaymentStatus(order.payments);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingFee: order.shippingFee,
      taxAmount: order.taxAmount,
      total: order.total,
      currency: 'INR',
      couponCode: order.couponCode,
      customer: {
        userId: order.userId,
        email: order.customerEmail,
        phone: order.customerPhone,
        isGuest: order.userId === null,
        registeredName: order.user ? `${order.user.firstName} ${order.user.lastName}` : null,
      },
      shippingAddress: {
        recipientName: order.shippingRecipientName,
        phone: order.shippingPhone,
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
      items: (order.items || []).map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.total,
      })),
      payments: (order.payments || []).map(payment => ({
        id: payment.id,
        provider: payment.provider,
        providerOrderId: payment.providerOrderId,
        providerPaymentId: payment.providerPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt.toISOString(),
      })),
      fulfillment: {
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        customerNotes: order.customerNotes,
      },
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}

export const orderService = new OrderService();
