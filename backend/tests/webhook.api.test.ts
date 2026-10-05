import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { paymentService } from '../src/services';
import { BadRequestError, NotFoundError } from '../src/errors';

describe('Webhook REST API Endpoints', () => {
  const sampleWebhookPayload = {
    entity: 'event',
    account_id: 'acc_123',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: 'pay_rzp_mock_123',
          entity: 'payment',
          amount: 149900,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_rzp_mock_123',
        },
      },
    },
    created_at: 1760000000,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/webhooks/razorpay', () => {
    it('returns 200 when webhook signature is valid and processed successfully', async () => {
      vi.spyOn(paymentService, 'processWebhook').mockResolvedValue({
        success: true,
        message: 'Payment captured successfully.',
      });

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', 'valid_mock_sig_123')
        .send(sampleWebhookPayload);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Payment captured successfully.',
      });
    });

    it('returns 400 when webhook signature is invalid or missing', async () => {
      vi.spyOn(paymentService, 'processWebhook').mockRejectedValue(
        new BadRequestError('Invalid Razorpay webhook signature.')
      );

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', 'invalid_sig')
        .send(sampleWebhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 404 when webhook order ID does not match any local payment', async () => {
      vi.spyOn(paymentService, 'processWebhook').mockRejectedValue(
        new NotFoundError('Payment record not found for Razorpay order ID "order_rzp_unknown".')
      );

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', 'valid_sig')
        .send(sampleWebhookPayload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
