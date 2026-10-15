import { prisma } from '../db/prisma';
import type { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
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
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CAPTURED',
          providerPaymentId,
          providerSignature: providerSignature ?? null,
          paidAt: new Date(),
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
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
