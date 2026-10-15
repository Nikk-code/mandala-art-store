import { prisma } from '../db/prisma';
import type { Prisma, OrderStatus, PaymentStatus, Coupon } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { buildPaymentStatusPrismaFilter } from '../utils/payment-status';

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payments: true;
  };
}>;

export type AdminOrderRecord = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payments: true;
    user: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
  };
}>;

export interface FindAdminOrdersFilters {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  from?: string;
  to?: string;
}

export interface FindAdminOrdersOptions {
  skip: number;
  take: number;
  sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';
}

export interface CreateOrderData {
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerPhone: string;
  subtotal: number;
  discountAmount?: number;
  shippingFee?: number;
  taxAmount?: number;
  total: number;
  couponId?: string | null;
  couponCode?: string | null;
  shippingRecipientName: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry?: string;
  items: Array<{
    productId: string | null;
    productName: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }>;
  payment: {
    amount: number;
    currency?: string;
    provider?: string;
  };
}

export class OrderRepository {
  private readonly prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prismaClient = prismaClient;
  }

  async findById(id: string): Promise<OrderWithDetails | null> {
    return this.prismaClient.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderWithDetails | null> {
    return this.prismaClient.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  /**
   * Retrieves paginated orders for a specific user ID sorted newest first.
   */
  async findByUserId(
    userId: string,
    options: { skip: number; take: number }
  ): Promise<{ orders: OrderWithDetails[]; total: number }> {
    const [orders, total] = await Promise.all([
      this.prismaClient.order.findMany({
        where: { userId },
        include: {
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prismaClient.order.count({
        where: { userId },
      }),
    ]);

    return { orders, total };
  }

  /**
   * Creates an order, its snapshot line items, and a pending payment record atomically within a transaction.
   */
  async createOrderTransaction(
    tx: Prisma.TransactionClient,
    data: CreateOrderData
  ): Promise<OrderWithDetails> {
    const order = await tx.order.create({
      data: {
        orderNumber: data.orderNumber,
        userId: data.userId ?? null,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        status: 'PENDING_PAYMENT',
        subtotal: data.subtotal,
        discountAmount: data.discountAmount ?? 0,
        shippingFee: data.shippingFee ?? 0,
        taxAmount: data.taxAmount ?? 0,
        total: data.total,
        couponId: data.couponId ?? null,
        couponCode: data.couponCode ?? null,
        shippingRecipientName: data.shippingRecipientName,
        shippingPhone: data.shippingPhone,
        shippingAddressLine1: data.shippingAddressLine1,
        shippingAddressLine2: data.shippingAddressLine2 ?? null,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountry: data.shippingCountry ?? 'India',
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.total,
          })),
        },
        payments: {
          create: {
            amount: data.payment.amount,
            currency: data.payment.currency ?? 'INR',
            provider: data.payment.provider ?? 'razorpay',
            status: 'PENDING',
          },
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    return order;
  }

  /**
   * Updates the provider order ID on an existing payment record.
   */
  async updatePaymentProviderOrderId(
    paymentId: string,
    providerOrderId: string
  ): Promise<Prisma.PaymentGetPayload<Record<string, never>>> {
    return this.prismaClient.payment.update({
      where: { id: paymentId },
      data: { providerOrderId },
    });
  }

  /**
   * Locates a payment record and its parent order by the Razorpay provider order ID.
   */
  async findPaymentByProviderOrderId(
    providerOrderId: string
  ): Promise<
    (Prisma.PaymentGetPayload<Record<string, never>> & { order: OrderWithDetails }) | null
  > {
    return this.prismaClient.payment.findFirst({
      where: { providerOrderId },
      include: {
        order: {
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });
  }

  /**
   * Atomically confirms an order and marks its payment as CAPTURED within a single database transaction.
   * Enforces authoritative coupon usage counting, row-level locking, and safe late-capture handling.
   */
  async confirmOrderAndCapturePayment(
    paymentId: string,
    orderId: string,
    providerPaymentId: string,
    providerSignature?: string
  ): Promise<{
    order: OrderWithDetails;
    payment: Prisma.PaymentGetPayload<Record<string, never>>;
  }> {
    return this.prismaClient.$transaction(async tx => {
      // 1. Fetch current order and associated payment records
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payments: true,
        },
      });

      if (!currentOrder) {
        throw new Error(`Order with ID "${orderId}" was not found.`);
      }

      const paymentRecord = currentOrder.payments.find(p => p.id === paymentId);
      if (!paymentRecord) {
        throw new Error(`Payment record "${paymentId}" was not found for order "${orderId}".`);
      }

      // Idempotency: If payment is already CAPTURED, return immediately
      if (paymentRecord.status === 'CAPTURED') {
        return { order: currentOrder, payment: paymentRecord };
      }

      let targetOrderStatus: OrderStatus = 'CONFIRMED';
      let customerNotesToPersist: string | undefined = undefined;

      // 2. Coupon capacity validation and timesUsed increment under exclusive row lock
      if (currentOrder.couponId) {
        const rows = await tx.$queryRaw<Coupon[]>`
          SELECT * FROM "coupons"
          WHERE "id" = ${currentOrder.couponId}::uuid
          FOR UPDATE
        `;
        const lockedCoupon = rows[0];

        if (lockedCoupon) {
          if (lockedCoupon.usageLimit === null) {
            // Unlimited usage coupon: always confirm and increment timesUsed
            await tx.$executeRaw`
              UPDATE "coupons"
              SET "times_used" = "times_used" + 1
              WHERE "id" = ${lockedCoupon.id}::uuid
            `;
            targetOrderStatus = 'CONFIRMED';
          } else {
            // Invariant: Occupied slots = Coupon.timesUsed + active, unexpired PENDING_PAYMENT reservations.
            // Check other active reservations and self reservation status under the exclusive row lock.
            const reservationRows = await tx.$queryRaw<
              [{ other_active_count: bigint; self_active_count: bigint }]
            >`
              SELECT
                COUNT(*) FILTER (WHERE "id" != ${currentOrder.id}::uuid)::bigint AS other_active_count,
                COUNT(*) FILTER (WHERE "id" = ${currentOrder.id}::uuid)::bigint AS self_active_count
              FROM "orders"
              WHERE "coupon_id" = ${lockedCoupon.id}::uuid
                AND "status" = 'PENDING_PAYMENT'
                AND "created_at" >= (NOW() - INTERVAL '15 minutes')
            `;

            const otherActiveCount = Number(reservationRows[0]?.other_active_count ?? 0);
            const isSelfActive = Number(reservationRows[0]?.self_active_count ?? 0) > 0;

            // Invariant check:
            // Capturing this order will increment timesUsed by 1.
            // The order itself leaves the PENDING_PAYMENT state, leaving otherActiveCount active reservations.
            // Therefore, new occupied slots after capture will be: (lockedCoupon.timesUsed + 1) + otherActiveCount.
            // This MUST NOT exceed lockedCoupon.usageLimit.
            const newOccupiedSlots = lockedCoupon.timesUsed + 1 + otherActiveCount;

            if (newOccupiedSlots <= lockedCoupon.usageLimit) {
              // Normal capacity available (either active reservation or late capture into available slot)
              await tx.$executeRaw`
                UPDATE "coupons"
                SET "times_used" = "times_used" + 1
                WHERE "id" = ${lockedCoupon.id}::uuid
              `;
              targetOrderStatus = 'CONFIRMED';
            } else {
              // Capacity invariant violated:
              // Either timesUsed has reached usageLimit, or other active reservations occupy all remaining capacity.
              // Preserve truth: record payment as CAPTURED, but transition order to CANCELLED.
              // Do NOT increment timesUsed beyond usageLimit.
              targetOrderStatus = 'CANCELLED';
              const reconciliationBanner = `[COUPON_OVERAGE_RECONCILIATION] Payment of ₹${(currentOrder.total / 100).toFixed(2)} was captured by the gateway, but coupon "${lockedCoupon.code}" capacity is exhausted (usage limit: ${lockedCoupon.usageLimit}, confirmed: ${lockedCoupon.timesUsed}, active reservations: ${otherActiveCount}, incoming reservation active: ${isSelfActive}). Order cancelled for administrative reconciliation or refund.`;
              customerNotesToPersist = currentOrder.customerNotes
                ? `${currentOrder.customerNotes}\n\n${reconciliationBanner}`
                : reconciliationBanner;
            }
          }
        }
      }

      // 3. Atomically update Payment to CAPTURED
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CAPTURED',
          providerPaymentId,
          providerSignature: providerSignature ?? null,
          paidAt: new Date(),
        },
      });

      // 4. Update Order to determined status (CONFIRMED or CANCELLED)
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: targetOrderStatus,
          ...(customerNotesToPersist !== undefined
            ? { customerNotes: customerNotesToPersist }
            : {}),
        },
        include: {
          items: true,
          payments: true,
        },
      });

      return { order: updatedOrder, payment: updatedPayment };
    });
  }

  /**
   * Updates payment record status to FAILED with reason.
   */
  async markPaymentFailed(
    paymentId: string,
    failureReason: string,
    providerPaymentId?: string
  ): Promise<Prisma.PaymentGetPayload<Record<string, never>>> {
    return this.prismaClient.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        failureReason,
        ...(providerPaymentId ? { providerPaymentId } : {}),
      },
    });
  }

  /**
   * Retrieves paginated orders for administration with search, status filters, payment filters, and date ranges.
   */
  async findAdminOrders(
    filters: FindAdminOrdersFilters,
    options: FindAdminOrdersOptions
  ): Promise<{ orders: AdminOrderRecord[]; total: number }> {
    const where: Prisma.OrderWhereInput = {};

    // Multi-field search
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { customerEmail: { contains: term, mode: 'insensitive' } },
        { customerPhone: { contains: term, mode: 'insensitive' } },
        { shippingRecipientName: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Order status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Authoritative payment status filter via Payments relation
    if (filters.paymentStatus) {
      where.payments = buildPaymentStatusPrismaFilter(filters.paymentStatus);
    }

    // Date range filter
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.createdAt.lte = new Date(filters.to);
      }
    }

    // Sorting strategy
    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (options.sort === 'total_desc') {
      orderBy = { total: 'desc' };
    } else if (options.sort === 'total_asc') {
      orderBy = { total: 'asc' };
    }

    const [orders, total] = await Promise.all([
      this.prismaClient.order.findMany({
        where,
        include: {
          items: true,
          payments: {
            orderBy: { createdAt: 'desc' },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy,
        skip: options.skip,
        take: options.take,
      }),
      this.prismaClient.order.count({ where }),
    ]);

    return { orders, total };
  }

  /**
   * Retrieves complete order details for administration without customer ownership restriction.
   */
  async findAdminOrderById(id: string): Promise<AdminOrderRecord | null> {
    return this.prismaClient.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Atomically and conditionally transitions order status in the database:
   * Guarded by expectedCurrentStatus and requiring captured payment evidence (payments.some.status === 'CAPTURED').
   * If the order was concurrently modified, returns null (count === 0) to signal a 409 Conflict.
   */
  async updateOrderStatusConditionally(
    orderId: string,
    expectedCurrentStatus: OrderStatus,
    newStatus: OrderStatus,
    fulfillmentData: { trackingNumber?: string | null; courierName?: string | null }
  ): Promise<AdminOrderRecord | null> {
    return this.prismaClient.$transaction(async tx => {
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: expectedCurrentStatus,
          payments: {
            some: {
              status: 'CAPTURED',
            },
          },
        },
        data: {
          status: newStatus,
          ...(fulfillmentData.trackingNumber !== undefined
            ? { trackingNumber: fulfillmentData.trackingNumber }
            : {}),
          ...(fulfillmentData.courierName !== undefined
            ? { courierName: fulfillmentData.courierName }
            : {}),
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      return tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payments: {
            orderBy: { createdAt: 'desc' },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });
  }
}

export const orderRepository = new OrderRepository();
