import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { paymentService } from '../src/services';
import { NotFoundError, ConflictError, AppError } from '../src/errors';
import type { PaymentInitializationDto } from '../src/types';

describe('Payment REST API Endpoints', () => {
  const validOrderId = '33333333-3333-4333-8333-333333333333';

  const samplePaymentInitResponse: PaymentInitializationDto = {
    orderId: validOrderId,
    orderNumber: 'MAT-20261005-A1B2C3',
    razorpayOrderId: 'order_rzp_mock_12345',
    razorpayKeyId: 'rzp_test_key_123',
    amount: 149900,
    currency: 'INR',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/checkout/orders/:orderId/payment', () => {
    it('initializes Razorpay payment and returns 200 with safe initialization data', async () => {
      vi.spyOn(paymentService, 'initializePayment').mockResolvedValue(samplePaymentInitResponse);

      const res = await request(app).post(`/api/checkout/orders/${validOrderId}/payment`).send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(samplePaymentInitResponse);
      expect(res.body.data.razorpayOrderId).toBe('order_rzp_mock_12345');
      expect(res.body.data.amount).toBe(149900);
      expect(res.body.data.currency).toBe('INR');
      expect(res.body.data).not.toHaveProperty('keySecret');
    });

    it('returns 400 when orderId is not a valid UUID', async () => {
      const res = await request(app).post('/api/checkout/orders/not-a-valid-uuid/payment').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 404 when order does not exist', async () => {
      vi.spyOn(paymentService, 'initializePayment').mockRejectedValue(
        new NotFoundError(`Order with ID "${validOrderId}" was not found.`)
      );

      const res = await request(app).post(`/api/checkout/orders/${validOrderId}/payment`).send({});

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 409 when order is not in pending payment status', async () => {
      vi.spyOn(paymentService, 'initializePayment').mockRejectedValue(
        new ConflictError('Payment cannot be initiated. Order is not in pending status.')
      );

      const res = await request(app).post(`/api/checkout/orders/${validOrderId}/payment`).send({});

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 502 when payment provider API fails', async () => {
      vi.spyOn(paymentService, 'initializePayment').mockRejectedValue(
        new AppError(
          'Failed to initialize payment with payment provider',
          502,
          'PAYMENT_PROVIDER_ERROR'
        )
      );

      const res = await request(app).post(`/api/checkout/orders/${validOrderId}/payment`).send({});

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYMENT_PROVIDER_ERROR');
    });
  });

  describe('POST /api/checkout/orders/:orderId/payment/verify', () => {
    const validVerificationBody = {
      razorpayOrderId: 'order_rzp_mock_12345',
      razorpayPaymentId: 'pay_rzp_mock_67890',
      razorpaySignature: 'sig_valid_12345',
    };

    const sampleVerificationResponse = {
      orderId: validOrderId,
      orderNumber: 'MAT-20261005-A1B2C3',
      paymentStatus: 'CAPTURED',
      orderStatus: 'CONFIRMED',
    };

    it('returns 200 with confirmation details upon successful signature verification', async () => {
      vi.spyOn(paymentService, 'verifyPayment').mockResolvedValue(sampleVerificationResponse);

      const res = await request(app)
        .post(`/api/checkout/orders/${validOrderId}/payment/verify`)
        .send(validVerificationBody);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(sampleVerificationResponse);
    });

    it('returns 400 when orderId is not a valid UUID', async () => {
      const res = await request(app)
        .post('/api/checkout/orders/invalid-uuid/payment/verify')
        .send(validVerificationBody);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 400 when verification parameters are missing', async () => {
      const res = await request(app)
        .post(`/api/checkout/orders/${validOrderId}/payment/verify`)
        .send({
          razorpayOrderId: 'order_123',
          // missing razorpayPaymentId and razorpaySignature
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 404 when order is not found during verification', async () => {
      vi.spyOn(paymentService, 'verifyPayment').mockRejectedValue(
        new NotFoundError(`Order with ID "${validOrderId}" was not found.`)
      );

      const res = await request(app)
        .post(`/api/checkout/orders/${validOrderId}/payment/verify`)
        .send(validVerificationBody);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
