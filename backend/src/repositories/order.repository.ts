import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payments: true;
  };
}>;

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
  async findById(id: string): Promise<OrderWithDetails | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderWithDetails | null> {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payments: true,
      },
    });
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
    return prisma.payment.update({
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
    return prisma.payment.findFirst({
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
    return prisma.$transaction(async tx => {
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
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        failureReason,
        ...(providerPaymentId ? { providerPaymentId } : {}),
      },
    });
  }
}

export const orderRepository = new OrderRepository();
