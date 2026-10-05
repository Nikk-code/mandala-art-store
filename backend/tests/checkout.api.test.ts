import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { orderService } from '../src/services';
import { NotFoundError, ConflictError } from '../src/errors';
import type { OrderResponseDto } from '../src/types';

describe('Checkout REST API Endpoints', () => {
  const validProductId = '11111111-1111-4111-8111-111111111111';

  const validPayload = {
    customer: {
      fullName: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543210',
    },
    shippingAddress: {
      addressLine1: 'Flat 101, Lotus Apts, MG Road',
      addressLine2: 'Near Central Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    items: [{ productId: validProductId, quantity: 1 }],
  };

  const sampleOrderResponse: OrderResponseDto = {
    id: 'order-123',
    orderNumber: 'MAT-20261005-7F2A9C',
    status: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    subtotal: 149900,
    discountAmount: 0,
    shippingFee: 0,
    taxAmount: 0,
    total: 149900,
    currency: 'INR',
    customerEmail: 'priya@example.com',
    customerPhone: '9876543210',
    shippingAddress: {
      recipientName: 'Priya Sharma',
      phone: '9876543210',
      addressLine1: 'Flat 101, Lotus Apts, MG Road',
      addressLine2: 'Near Central Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    items: [
      {
        id: 'item-1',
        productId: validProductId,
        productName: 'Sacred Lotus Mandala',
        productSku: 'MND-LOTUS-01',
        unitPrice: 149900,
        quantity: 1,
        total: 149900,
      },
    ],
    createdAt: '2026-10-05T12:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/checkout/orders', () => {
    it('creates a guest order and returns 201 with authoritative snapshot data', async () => {
      vi.spyOn(orderService, 'createOrder').mockResolvedValue(sampleOrderResponse);

      const res = await request(app)
        .post('/api/checkout/orders')
        .send(validPayload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order).toBeDefined();
      expect(res.body.data.order.orderNumber).toBe('MAT-20261005-7F2A9C');
      expect(res.body.data.order.status).toBe('PENDING_PAYMENT');
      expect(res.body.data.order.paymentStatus).toBe('PENDING');
      expect(res.body.data.order.total).toBe(149900);
      expect(res.body.data.order.items).toHaveLength(1);
      expect(res.body.data.order.items[0].unitPrice).toBe(149900);
      expect(res.body.data.order.shippingAddress.city).toBe('Bengaluru');
    });

    it('returns 400 when customer information is missing or invalid', async () => {
      const invalidPayload = {
        ...validPayload,
        customer: {
          fullName: 'A', // too short
          email: 'not-an-email',
          phone: '12345',
        },
      };

      const res = await request(app)
        .post('/api/checkout/orders')
        .send(invalidPayload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when shipping address is missing or invalid PIN', async () => {
      const invalidPayload = {
        ...validPayload,
        shippingAddress: {
          addressLine1: 'Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: 'invalid-pin',
        },
      };

      const res = await request(app)
        .post('/api/checkout/orders')
        .send(invalidPayload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when items array is empty or has invalid quantities', async () => {
      const invalidPayload = {
        ...validPayload,
        items: [],
      };

      const res = await request(app)
        .post('/api/checkout/orders')
        .send(invalidPayload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when product is not found', async () => {
      vi.spyOn(orderService, 'createOrder').mockRejectedValue(
        new NotFoundError('Product was not found')
      );

      const res = await request(app)
        .post('/api/checkout/orders')
        .send(validPayload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 409 when product is SOLD_OUT or out of stock', async () => {
      vi.spyOn(orderService, 'createOrder').mockRejectedValue(
        new ConflictError('Product is sold out and cannot be purchased')
      );

      const res = await request(app)
        .post('/api/checkout/orders')
        .send(validPayload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('passes Idempotency-Key header through to orderService', async () => {
      const spy = vi.spyOn(orderService, 'createOrder').mockResolvedValue(sampleOrderResponse);

      const res = await request(app)
        .post('/api/checkout/orders')
        .set('Idempotency-Key', 'test-key-12345')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ customer: expect.any(Object) }),
        'test-key-12345'
      );
    });
  });
});
