import { prisma } from '../db/prisma';
import {
  orderRepository,
  type OrderRepository,
  type OrderWithDetails,
} from '../repositories/order.repository';
import { NotFoundError, BadRequestError, ConflictError } from '../errors';
import { validateCreateOrderRequest } from '../utils/checkout-validation';
import { generateOrderNumber } from '../utils/order-number';
import type {
  CreateOrderRequest,
  OrderResponseDto,
  OrderDetailsDto,
  OrderItemSnapshotDto,
  OrderHistoryResponseDto,
  OrderHistoryItemDto,
} from '../types/checkout';

interface IdempotencyEntry {
  response: OrderResponseDto;
  createdAt: number;
}

export class OrderService {
  private readonly repository: OrderRepository;
  private readonly idempotencyCache = new Map<string, IdempotencyEntry>();
  private readonly inFlightRequests = new Map<string, Promise<OrderResponseDto>>();
  private readonly IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(repository: OrderRepository = orderRepository) {
    this.repository = repository;
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
    if (cleanKey) {
      this.cleanupIdempotencyCache();

      // Check if already completed
      const cached = this.idempotencyCache.get(cleanKey);
      if (cached && Date.now() - cached.createdAt <= this.IDEMPOTENCY_TTL_MS) {
        return cached.response;
      }

      // Check if identical request is currently in flight
      const inFlight = this.inFlightRequests.get(cleanKey);
      if (inFlight) {
        return inFlight;
      }
    }

    const orderPromise = this.executeCreateOrderTransaction(validatedRequest, userId ?? null);

    if (cleanKey) {
      this.inFlightRequests.set(cleanKey, orderPromise);
    }

    try {
      const result = await orderPromise;
      if (cleanKey) {
        this.idempotencyCache.set(cleanKey, {
          response: result,
          createdAt: Date.now(),
        });
      }
      return result;
    } finally {
      if (cleanKey) {
        this.inFlightRequests.delete(cleanKey);
      }
    }
  }

  private async executeCreateOrderTransaction(
    request: CreateOrderRequest,
    userId: string | null
  ): Promise<OrderResponseDto> {
    const createdOrder = await prisma.$transaction(async tx => {
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

      // Financial calculations (all in integer paise)
      const discountAmount = 0;
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
        subtotal: authoritativeSubtotal,
        discountAmount,
        shippingFee,
        taxAmount,
        total: authoritativeTotal,
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
}

export const orderService = new OrderService();
