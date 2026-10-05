import Razorpay from 'razorpay';
import {
  validatePaymentVerification,
  validateWebhookSignature,
} from 'razorpay/dist/utils/razorpay-utils';
import { orderRepository, type OrderRepository } from '../repositories/order.repository';
import { config } from '../config/env';
import { NotFoundError, BadRequestError, ConflictError, AppError } from '../errors';
import type {
  PaymentInitializationDto,
  VerifyPaymentRequest,
  PaymentVerificationResultDto,
  RazorpayWebhookPayload,
} from '../types';

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

  /**
   * Verifies Razorpay checkout payment signature and confirms order:
   * 1. Validates order existence and payment eligibility.
   * 2. Validates razorpayOrderId match against stored Payment.providerOrderId.
   * 3. Idempotently returns confirmation if already CAPTURED.
   * 4. Cryptographically verifies HMAC SHA-256 signature using server-side key secret.
   * 5. Atomically transitions Payment to CAPTURED and Order to CONFIRMED.
   * 6. Returns sanitized response.
   */
  async verifyPayment(
    orderId: string,
    input: VerifyPaymentRequest
  ): Promise<PaymentVerificationResultDto> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!orderId || typeof orderId !== 'string' || !uuidRegex.test(orderId.trim())) {
      throw new BadRequestError('Invalid or missing orderId parameter');
    }

    if (
      !input ||
      typeof input !== 'object' ||
      !input.razorpayOrderId ||
      typeof input.razorpayOrderId !== 'string' ||
      !input.razorpayOrderId.trim() ||
      !input.razorpayPaymentId ||
      typeof input.razorpayPaymentId !== 'string' ||
      !input.razorpayPaymentId.trim() ||
      !input.razorpaySignature ||
      typeof input.razorpaySignature !== 'string' ||
      !input.razorpaySignature.trim()
    ) {
      throw new BadRequestError('Missing or invalid Razorpay payment verification parameters');
    }

    const cleanOrderId = orderId.trim();
    const cleanRzpOrderId = input.razorpayOrderId.trim();
    const cleanRzpPaymentId = input.razorpayPaymentId.trim();
    const cleanRzpSignature = input.razorpaySignature.trim();

    const order = await this.repository.findById(cleanOrderId);
    if (!order) {
      throw new NotFoundError(`Order with ID "${cleanOrderId}" was not found.`);
    }

    if (!order.payments || order.payments.length === 0) {
      throw new NotFoundError(`Payment record not found for order "${order.orderNumber}".`);
    }

    const payment = order.payments[0];

    if (payment.provider.toLowerCase() !== 'razorpay') {
      throw new BadRequestError(
        `Payment provider "${payment.provider}" is not supported for Razorpay verification.`
      );
    }

    if (payment.providerOrderId && payment.providerOrderId !== cleanRzpOrderId) {
      throw new BadRequestError('Razorpay order ID does not match payment record.');
    }

    // Idempotency: If payment is already captured, return safe success state
    if (payment.status === 'CAPTURED') {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: 'CAPTURED',
        orderStatus: order.status === 'CONFIRMED' ? 'CONFIRMED' : order.status,
      };
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new ConflictError(
        `Payment cannot be verified. Order "${order.orderNumber}" is in status "${order.status}".`
      );
    }

    // Cryptographic Signature Verification using server-side RAZORPAY_KEY_SECRET
    const secret = config.razorpayKeySecret || 'test_secret_placeholder';
    let isSignatureValid = false;
    try {
      isSignatureValid = validatePaymentVerification(
        {
          order_id: cleanRzpOrderId,
          payment_id: cleanRzpPaymentId,
        },
        cleanRzpSignature,
        secret
      );
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      throw new BadRequestError('Invalid Razorpay payment signature.');
    }

    // Atomic database update: Payment -> CAPTURED, Order -> CONFIRMED
    const { order: confirmedOrder, payment: capturedPayment } =
      await this.repository.confirmOrderAndCapturePayment(
        payment.id,
        order.id,
        cleanRzpPaymentId,
        cleanRzpSignature
      );

    return {
      orderId: confirmedOrder.id,
      orderNumber: confirmedOrder.orderNumber,
      paymentStatus: capturedPayment.status,
      orderStatus: confirmedOrder.status,
    };
  }

  /**
   * Processes Razorpay webhook notifications:
   * 1. Validates webhook signature using raw body and configured secret.
   * 2. Dispatches event handling for payment.captured, payment.failed.
   * 3. Idempotently updates local payment and order state.
   */
  async processWebhook(
    rawBody: string | Buffer | undefined,
    signatureHeader: string | undefined,
    payload: RazorpayWebhookPayload
  ): Promise<{ success: boolean; message: string }> {
    if (!signatureHeader || typeof signatureHeader !== 'string' || !signatureHeader.trim()) {
      throw new BadRequestError('Missing Razorpay webhook signature header.');
    }

    if (rawBody === undefined || rawBody === null) {
      throw new BadRequestError('Missing webhook raw request body for signature verification.');
    }

    const secret =
      config.razorpayWebhookSecret || config.razorpayKeySecret || 'test_secret_placeholder';
    const rawBodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    let isWebhookSignatureValid = false;
    try {
      isWebhookSignatureValid = validateWebhookSignature(
        rawBodyString,
        signatureHeader.trim(),
        secret
      );
    } catch {
      isWebhookSignatureValid = false;
    }

    if (!isWebhookSignatureValid) {
      throw new BadRequestError('Invalid Razorpay webhook signature.');
    }

    if (!payload || !payload.event) {
      throw new BadRequestError('Invalid webhook payload structure.');
    }

    // Event Handling
    switch (payload.event) {
      case 'payment.captured': {
        const paymentEntity = payload.payload?.payment?.entity;
        if (!paymentEntity || !paymentEntity.order_id) {
          throw new BadRequestError(
            'Invalid webhook payload structure: missing payment entity or order_id.'
          );
        }

        const paymentRecord = await this.repository.findPaymentByProviderOrderId(
          paymentEntity.order_id
        );
        if (!paymentRecord) {
          throw new NotFoundError(
            `Payment record not found for Razorpay order ID "${paymentEntity.order_id}".`
          );
        }

        // Idempotent: If already captured, don't duplicate state transition
        if (paymentRecord.status === 'CAPTURED') {
          return { success: true, message: 'Payment already captured.' };
        }

        await this.repository.confirmOrderAndCapturePayment(
          paymentRecord.id,
          paymentRecord.orderId,
          paymentEntity.id
        );

        return { success: true, message: 'Payment captured successfully.' };
      }

      case 'payment.failed': {
        const paymentEntity = payload.payload?.payment?.entity;
        if (!paymentEntity || !paymentEntity.order_id) {
          throw new BadRequestError(
            'Invalid webhook payload structure: missing payment entity or order_id.'
          );
        }

        const paymentRecord = await this.repository.findPaymentByProviderOrderId(
          paymentEntity.order_id
        );
        if (!paymentRecord) {
          throw new NotFoundError(
            `Payment record not found for Razorpay order ID "${paymentEntity.order_id}".`
          );
        }

        // If payment was already captured by another flow, do not overwrite with failed
        if (paymentRecord.status === 'CAPTURED') {
          return {
            success: true,
            message: 'Payment already captured, ignoring failure event.',
          };
        }

        const failureReason =
          paymentEntity.error_description ||
          paymentEntity.error_reason ||
          'Payment failed at provider';

        await this.repository.markPaymentFailed(paymentRecord.id, failureReason, paymentEntity.id);

        return { success: true, message: 'Payment marked as failed.' };
      }

      default: {
        return {
          success: true,
          message: `Ignored unhandled webhook event: "${payload.event}".`,
        };
      }
    }
  }
}

export const paymentService = new PaymentService();
