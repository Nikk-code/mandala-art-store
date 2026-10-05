import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentService, type IRazorpayClient } from '../src/services/payment.service';
import { OrderRepository, type OrderWithDetails } from '../src/repositories/order.repository';
import { NotFoundError, BadRequestError, ConflictError, AppError } from '../src/errors';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('PaymentService Domain Logic & Razorpay Initialization', () => {
  let mockOrderRepo: OrderRepository;
  let mockRazorpayClient: IRazorpayClient;
  let service: PaymentService;

  const validOrderId = '33333333-3333-4333-8333-333333333333';
  const validPaymentId = '44444444-4444-4444-8444-444444444444';

  const sampleOrder: OrderWithDetails = {
    id: validOrderId,
    orderNumber: 'MAT-20261005-A1B2C3',
    userId: null,
    customerEmail: 'priya@example.com',
    customerPhone: '9876543210',
    status: OrderStatus.PENDING_PAYMENT,
    subtotal: 149900,
    discountAmount: 0,
    shippingFee: 0,
    taxAmount: 0,
    total: 149900, // ₹1,499.00
    couponId: null,
    couponCode: null,
    shippingRecipientName: 'Priya Sharma',
    shippingPhone: '9876543210',
    shippingAddressLine1: 'MG Road',
    shippingAddressLine2: null,
    shippingCity: 'Bengaluru',
    shippingState: 'Karnataka',
    shippingPostalCode: '560001',
    shippingCountry: 'India',
    trackingNumber: null,
    courierName: null,
    customerNotes: null,
    createdAt: new Date('2026-10-05T12:00:00Z'),
    updatedAt: new Date('2026-10-05T12:00:00Z'),
    items: [
      {
        id: 'item-1',
        orderId: validOrderId,
        productId: 'prod-1',
        productName: 'Sacred Lotus Mandala',
        productSku: 'MND-LOTUS-01',
        unitPrice: 149900,
        quantity: 1,
        total: 149900,
        createdAt: new Date('2026-10-05T12:00:00Z'),
      },
    ],
    payments: [
      {
        id: validPaymentId,
        orderId: validOrderId,
        provider: 'razorpay',
        providerOrderId: null,
        providerPaymentId: null,
        providerSignature: null,
        amount: 149900,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        failureReason: null,
        paidAt: null,
        createdAt: new Date('2026-10-05T12:00:00Z'),
        updatedAt: new Date('2026-10-05T12:00:00Z'),
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOrderRepo = new OrderRepository();
    mockRazorpayClient = {
      orders: {
        create: vi.fn().mockResolvedValue({
          id: 'order_rzp_mock_12345',
          entity: 'order',
          amount: 149900,
          amount_paid: 0,
          amount_due: 149900,
          currency: 'INR',
          receipt: 'MAT-20261005-A1B2C3',
          status: 'created',
          attempts: 0,
          notes: {},
          created_at: 1760000000,
        }),
      },
    };
    service = new PaymentService(mockOrderRepo, mockRazorpayClient);
  });

  it('creates a Razorpay order using authoritative DB order total and persists providerOrderId', async () => {
    vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(sampleOrder);
    const updateSpy = vi.spyOn(mockOrderRepo, 'updatePaymentProviderOrderId').mockResolvedValue({
      ...sampleOrder.payments[0],
      providerOrderId: 'order_rzp_mock_12345',
    });

    const result = await service.initializePayment(validOrderId);

    expect(result).toEqual({
      orderId: validOrderId,
      orderNumber: 'MAT-20261005-A1B2C3',
      razorpayOrderId: 'order_rzp_mock_12345',
      razorpayKeyId: expect.any(String),
      amount: 149900,
      currency: 'INR',
    });

    expect(mockRazorpayClient.orders.create).toHaveBeenCalledWith({
      amount: 149900,
      currency: 'INR',
      receipt: 'MAT-20261005-A1B2C3',
    });

    expect(updateSpy).toHaveBeenCalledWith(validPaymentId, 'order_rzp_mock_12345');
  });

  it('re-uses existing providerOrderId without creating a duplicate Razorpay order', async () => {
    const existingOrderWithProviderId: OrderWithDetails = {
      ...sampleOrder,
      payments: [
        {
          ...sampleOrder.payments[0],
          providerOrderId: 'order_rzp_existing_99999',
        },
      ],
    };

    vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(existingOrderWithProviderId);
    const updateSpy = vi.spyOn(mockOrderRepo, 'updatePaymentProviderOrderId');

    const result = await service.initializePayment(validOrderId);

    expect(result.razorpayOrderId).toBe('order_rzp_existing_99999');
    expect(mockRazorpayClient.orders.create).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('rejects with BadRequestError if orderId is invalid UUID format', async () => {
    await expect(service.initializePayment('invalid-id')).rejects.toThrow(BadRequestError);
    await expect(service.initializePayment('')).rejects.toThrow(BadRequestError);
  });

  it('rejects with NotFoundError if order does not exist', async () => {
    vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(null);

    await expect(service.initializePayment(validOrderId)).rejects.toThrow(NotFoundError);
  });

  it('rejects with ConflictError if order is not in PENDING_PAYMENT status', async () => {
    vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue({
      ...sampleOrder,
      status: OrderStatus.CONFIRMED,
    });

    await expect(service.initializePayment(validOrderId)).rejects.toThrow(ConflictError);
  });

  it('rejects with NotFoundError if order has no associated payment record', async () => {
    vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue({
      ...sampleOrder,
      payments: [],
    });

    await expect(service.initializePayment(validOrderId)).rejects.toThrow(NotFoundError);
  });

  it('rejects with ConflictError if payment status is already CAPTURED or not PENDING', async () => {
    vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue({
      ...sampleOrder,
      payments: [
        {
          ...sampleOrder.payments[0],
          status: PaymentStatus.CAPTURED,
        },
      ],
    });

    await expect(service.initializePayment(validOrderId)).rejects.toThrow(ConflictError);
  });

  it('rejects with BadRequestError if payment provider is not Razorpay', async () => {
    vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue({
      ...sampleOrder,
      payments: [
        {
          ...sampleOrder.payments[0],
          provider: 'stripe',
        },
      ],
    });

    await expect(service.initializePayment(validOrderId)).rejects.toThrow(BadRequestError);
  });

  it('wraps Razorpay SDK failures in safe AppError (502) without leaking secrets', async () => {
    vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(sampleOrder);
    mockRazorpayClient.orders.create = vi
      .fn()
      .mockRejectedValue(new Error('Razorpay Gateway Timeout'));

    await expect(service.initializePayment(validOrderId)).rejects.toThrow(AppError);
    try {
      await service.initializePayment(validOrderId);
    } catch (err) {
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(502);
      expect(appErr.code).toBe('PAYMENT_PROVIDER_ERROR');
      expect(appErr.message).toBe('Failed to initialize payment with payment provider');
    }
  });

  it('never exposes secret keys in the returned DTO', async () => {
    vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(sampleOrder);
    vi.spyOn(mockOrderRepo, 'updatePaymentProviderOrderId').mockResolvedValue({
      ...sampleOrder.payments[0],
      providerOrderId: 'order_rzp_mock_12345',
    });

    const result = await service.initializePayment(validOrderId);

    expect(result).not.toHaveProperty('keySecret');
    expect(result).not.toHaveProperty('secret');
    expect(result).not.toHaveProperty('razorpayKeySecret');
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  describe('Payment Verification (verifyPayment)', () => {
    const rzpOrderId = 'order_rzp_mock_12345';
    const rzpPaymentId = 'pay_rzp_mock_67890';
    const secret = 'test_secret_placeholder';

    // Calculate valid test signature matching HMAC-SHA256
    const crypto = require('crypto');
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');

    const sampleOrderWithRzpId: OrderWithDetails = {
      ...sampleOrder,
      payments: [
        {
          ...sampleOrder.payments[0],
          providerOrderId: rzpOrderId,
        },
      ],
    };

    it('successfully verifies a valid Razorpay signature and atomically transitions order to CONFIRMED and payment to CAPTURED', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(sampleOrderWithRzpId);
      const confirmSpy = vi
        .spyOn(mockOrderRepo, 'confirmOrderAndCapturePayment')
        .mockResolvedValue({
          order: { ...sampleOrderWithRzpId, status: OrderStatus.CONFIRMED },
          payment: {
            ...sampleOrderWithRzpId.payments[0],
            status: PaymentStatus.CAPTURED,
            providerPaymentId: rzpPaymentId,
            providerSignature: validSignature,
            paidAt: new Date(),
          },
        });

      const result = await service.verifyPayment(validOrderId, {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: validSignature,
      });

      expect(result).toEqual({
        orderId: validOrderId,
        orderNumber: 'MAT-20261005-A1B2C3',
        paymentStatus: 'CAPTURED',
        orderStatus: 'CONFIRMED',
      });

      expect(confirmSpy).toHaveBeenCalledWith(
        validPaymentId,
        validOrderId,
        rzpPaymentId,
        validSignature
      );
    });

    it('is idempotent: returns confirmed state immediately if payment is already CAPTURED without double-updating', async () => {
      const alreadyCapturedOrder: OrderWithDetails = {
        ...sampleOrderWithRzpId,
        status: OrderStatus.CONFIRMED,
        payments: [
          {
            ...sampleOrderWithRzpId.payments[0],
            status: PaymentStatus.CAPTURED,
            providerPaymentId: rzpPaymentId,
            providerSignature: validSignature,
          },
        ],
      };

      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(alreadyCapturedOrder);
      const confirmSpy = vi.spyOn(mockOrderRepo, 'confirmOrderAndCapturePayment');

      const result = await service.verifyPayment(validOrderId, {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: validSignature,
      });

      expect(result).toEqual({
        orderId: validOrderId,
        orderNumber: 'MAT-20261005-A1B2C3',
        paymentStatus: 'CAPTURED',
        orderStatus: 'CONFIRMED',
      });
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('rejects with BadRequestError if Razorpay signature is invalid', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(sampleOrderWithRzpId);

      await expect(
        service.verifyPayment(validOrderId, {
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: 'invalid_tampered_signature_hex',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('rejects with BadRequestError if razorpayOrderId does not match Payment.providerOrderId', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(sampleOrderWithRzpId);

      await expect(
        service.verifyPayment(validOrderId, {
          razorpayOrderId: 'order_rzp_different_11111',
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: validSignature,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('rejects with BadRequestError if verification parameters are missing', async () => {
      await expect(
        service.verifyPayment(validOrderId, {
          razorpayOrderId: '',
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: validSignature,
        })
      ).rejects.toThrow(BadRequestError);

      await expect(
        service.verifyPayment(validOrderId, {
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: '',
          razorpaySignature: validSignature,
        })
      ).rejects.toThrow(BadRequestError);

      await expect(
        service.verifyPayment(validOrderId, {
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: '',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('rejects with BadRequestError if orderId is not a valid UUID', async () => {
      await expect(
        service.verifyPayment('invalid-uuid', {
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: validSignature,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('rejects with NotFoundError if order does not exist', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(null);

      await expect(
        service.verifyPayment(validOrderId, {
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: validSignature,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects with ConflictError if order is not in PENDING_PAYMENT status and payment is not captured', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue({
        ...sampleOrderWithRzpId,
        status: OrderStatus.CANCELLED,
      });

      await expect(
        service.verifyPayment(validOrderId, {
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: validSignature,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('Webhook Handling (processWebhook)', () => {
    const rzpOrderId = 'order_rzp_mock_12345';
    const rzpPaymentId = 'pay_rzp_mock_67890';
    const secret = 'test_secret_placeholder';

    const crypto = require('crypto');

    const sampleCapturedPayload = {
      entity: 'event',
      account_id: 'acc_123',
      event: 'payment.captured',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: rzpPaymentId,
            entity: 'payment',
            amount: 149900,
            currency: 'INR',
            status: 'captured',
            order_id: rzpOrderId,
          },
        },
      },
      created_at: 1760000000,
    };

    const rawCapturedBody = JSON.stringify(sampleCapturedPayload);
    const validWebhookSignature = crypto
      .createHmac('sha256', secret)
      .update(rawCapturedBody)
      .digest('hex');

    it('successfully processes a valid payment.captured webhook and confirms order', async () => {
      vi.spyOn(mockOrderRepo, 'findPaymentByProviderOrderId').mockResolvedValue({
        id: validPaymentId,
        orderId: validOrderId,
        provider: 'razorpay',
        providerOrderId: rzpOrderId,
        providerPaymentId: null,
        providerSignature: null,
        amount: 149900,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        failureReason: null,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: sampleOrder,
      });

      const confirmSpy = vi
        .spyOn(mockOrderRepo, 'confirmOrderAndCapturePayment')
        .mockResolvedValue({
          order: { ...sampleOrder, status: OrderStatus.CONFIRMED },
          payment: {
            ...sampleOrder.payments[0],
            status: PaymentStatus.CAPTURED,
            providerPaymentId: rzpPaymentId,
          },
        });

      const result = await service.processWebhook(
        rawCapturedBody,
        validWebhookSignature,
        sampleCapturedPayload
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('captured successfully');
      expect(confirmSpy).toHaveBeenCalledWith(validPaymentId, validOrderId, rzpPaymentId);
    });

    it('is idempotent when receiving duplicate payment.captured webhooks', async () => {
      vi.spyOn(mockOrderRepo, 'findPaymentByProviderOrderId').mockResolvedValue({
        id: validPaymentId,
        orderId: validOrderId,
        provider: 'razorpay',
        providerOrderId: rzpOrderId,
        providerPaymentId: rzpPaymentId,
        providerSignature: null,
        amount: 149900,
        currency: 'INR',
        status: PaymentStatus.CAPTURED,
        failureReason: null,
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        order: { ...sampleOrder, status: OrderStatus.CONFIRMED },
      });

      const confirmSpy = vi.spyOn(mockOrderRepo, 'confirmOrderAndCapturePayment');

      const result = await service.processWebhook(
        rawCapturedBody,
        validWebhookSignature,
        sampleCapturedPayload
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('already captured');
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('successfully processes payment.failed webhook and marks payment as FAILED', async () => {
      const failedPayload = {
        ...sampleCapturedPayload,
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              ...sampleCapturedPayload.payload.payment.entity,
              status: 'failed',
              error_description: 'Payment was declined by bank',
            },
          },
        },
      };

      const rawFailedBody = JSON.stringify(failedPayload);
      const failedSig = crypto.createHmac('sha256', secret).update(rawFailedBody).digest('hex');

      vi.spyOn(mockOrderRepo, 'findPaymentByProviderOrderId').mockResolvedValue({
        id: validPaymentId,
        orderId: validOrderId,
        provider: 'razorpay',
        providerOrderId: rzpOrderId,
        providerPaymentId: null,
        providerSignature: null,
        amount: 149900,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        failureReason: null,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: sampleOrder,
      });

      const failSpy = vi.spyOn(mockOrderRepo, 'markPaymentFailed').mockResolvedValue({
        ...sampleOrder.payments[0],
        status: PaymentStatus.FAILED,
        failureReason: 'Payment was declined by bank',
      });

      const result = await service.processWebhook(rawFailedBody, failedSig, failedPayload);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Payment marked as failed');
      expect(failSpy).toHaveBeenCalledWith(
        validPaymentId,
        'Payment was declined by bank',
        rzpPaymentId
      );
    });

    it('rejects webhooks with missing signature header', async () => {
      await expect(
        service.processWebhook(rawCapturedBody, undefined, sampleCapturedPayload)
      ).rejects.toThrow(BadRequestError);
    });

    it('rejects webhooks with invalid HMAC signature', async () => {
      await expect(
        service.processWebhook(
          rawCapturedBody,
          'invalid_tampered_signature_hex',
          sampleCapturedPayload
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('throws NotFoundError when webhook references an unknown Razorpay order', async () => {
      vi.spyOn(mockOrderRepo, 'findPaymentByProviderOrderId').mockResolvedValue(null);

      await expect(
        service.processWebhook(rawCapturedBody, validWebhookSignature, sampleCapturedPayload)
      ).rejects.toThrow(NotFoundError);
    });

    it('safely ignores unhandled webhook events without error', async () => {
      const unknownPayload = {
        ...sampleCapturedPayload,
        event: 'refund.created',
      };
      const rawUnknownBody = JSON.stringify(unknownPayload);
      const unknownSig = crypto.createHmac('sha256', secret).update(rawUnknownBody).digest('hex');

      const result = await service.processWebhook(rawUnknownBody, unknownSig, unknownPayload);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Ignored unhandled webhook event');
    });
  });
});
