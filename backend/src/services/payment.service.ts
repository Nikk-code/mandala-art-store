import Razorpay from 'razorpay';
import { orderRepository, type OrderRepository } from '../repositories/order.repository';
import { config } from '../config/env';
import { NotFoundError, BadRequestError, ConflictError, AppError } from '../errors';
import type { PaymentInitializationDto } from '../types';

export interface RazorpayOrderOptions {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface IRazorpayClient {
  orders: {
    create: (options: RazorpayOrderOptions) => Promise<RazorpayOrderResponse>;
  };
}

export class PaymentService {
  private readonly repository: OrderRepository;
  private readonly razorpayClient: IRazorpayClient;

  constructor(repository: OrderRepository = orderRepository, razorpayClient?: IRazorpayClient) {
    this.repository = repository;
    this.razorpayClient =
      razorpayClient ||
      (new Razorpay({
        key_id: config.razorpayKeyId,
        key_secret: config.razorpayKeySecret || 'test_secret_placeholder',
      }) as unknown as IRazorpayClient);
  }

  /**
   * Initializes Razorpay checkout for an existing ecommerce order:
   * 1. Validates order existence and PENDING_PAYMENT status.
   * 2. Validates associated Payment record in PENDING status.
   * 3. If a providerOrderId already exists, returns it idempotently without creating a duplicate Razorpay order.
   * 4. Otherwise, creates a Razorpay Order using authoritative integer-paise order total from DB.
   * 5. Persists the Razorpay order ID into Payment.providerOrderId.
   * 6. Returns sanitized initialization data with public key only.
   */
  async initializePayment(orderId: string): Promise<PaymentInitializationDto> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!orderId || typeof orderId !== 'string' || !uuidRegex.test(orderId.trim())) {
      throw new BadRequestError('Invalid or missing orderId parameter');
    }

    const cleanOrderId = orderId.trim();
    const order = await this.repository.findById(cleanOrderId);

    if (!order) {
      throw new NotFoundError(`Order with ID "${cleanOrderId}" was not found.`);
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new ConflictError(
        `Payment cannot be initiated. Order "${order.orderNumber}" is in status "${order.status}".`
      );
    }

    if (!order.payments || order.payments.length === 0) {
      throw new NotFoundError(`Payment record not found for order "${order.orderNumber}".`);
    }

    const payment = order.payments[0];

    if (payment.status !== 'PENDING') {
      throw new ConflictError(
        `Payment cannot be initiated. Payment status is already "${payment.status}".`
      );
    }

    if (payment.provider.toLowerCase() !== 'razorpay') {
      throw new BadRequestError(`Unsupported payment provider: "${payment.provider}".`);
    }

    // Duplicate / Retry Safety: If Razorpay order was already created, reuse it
    if (payment.providerOrderId) {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        razorpayOrderId: payment.providerOrderId,
        razorpayKeyId: config.razorpayKeyId,
        amount: order.total,
        currency: payment.currency,
      };
    }

    // Create Razorpay Order using authoritative database financial values
    let rzpOrder: RazorpayOrderResponse;
    try {
      rzpOrder = await this.razorpayClient.orders.create({
        amount: order.total, // in integer paise
        currency: payment.currency || 'INR',
        receipt: order.orderNumber,
      });
    } catch {
      throw new AppError(
        'Failed to initialize payment with payment provider',
        502,
        'PAYMENT_PROVIDER_ERROR'
      );
    }

    if (!rzpOrder || !rzpOrder.id) {
      throw new AppError(
        'Invalid response received from payment provider',
        502,
        'PAYMENT_PROVIDER_ERROR'
      );
    }

    // Persist Razorpay Order ID to database
    await this.repository.updatePaymentProviderOrderId(payment.id, rzpOrder.id);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId: config.razorpayKeyId,
      amount: order.total,
      currency: payment.currency,
    };
  }
}

export const paymentService = new PaymentService();
