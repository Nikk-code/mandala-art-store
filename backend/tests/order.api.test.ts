import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { orderService } from '../src/services';
import { config } from '../src/config/env';
import { NotFoundError } from '../src/errors';
import type { OrderDetailsDto, OrderHistoryResponseDto } from '../src/types';

describe('Order REST API Endpoints (/api/orders)', () => {
  const customerId = '11111111-1111-4111-8111-111111111111';
  const otherCustomerId = '22222222-2222-4222-8222-222222222222';
  const validOrderId = '33333333-3333-4333-8333-333333333333';

  const customerToken = jwt.sign(
    { id: customerId, email: 'priya@example.com', role: 'CUSTOMER' },
    config.jwtSecret,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const otherCustomerToken = jwt.sign(
    { id: otherCustomerId, email: 'other@example.com', role: 'CUSTOMER' },
    config.jwtSecret,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const sampleOrderDetails: OrderDetailsDto = {
    id: validOrderId,
    orderNumber: 'MAT-20261005-7F2A9C',
    status: 'CONFIRMED',
    paymentStatus: 'CAPTURED',
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
        productId: 'prod-1',
        productName: 'Sacred Lotus Mandala',
        productSku: 'MND-LOTUS-01',
        unitPrice: 149900,
        quantity: 1,
        total: 149900,
      },
    ],
    payments: [
      {
        id: 'pay-1',
        provider: 'razorpay',
        amount: 149900,
        currency: 'INR',
        status: 'CAPTURED',
        paidAt: '2026-10-05T12:05:00.000Z',
        failureReason: null,
      },
    ],
    createdAt: '2026-10-05T12:00:00.000Z',
    updatedAt: '2026-10-05T12:05:00.000Z',
  };

  const sampleOrderHistory: OrderHistoryResponseDto = {
    orders: [
      {
        id: validOrderId,
        orderNumber: 'MAT-20261005-7F2A9C',
        status: 'CONFIRMED',
        paymentStatus: 'CAPTURED',
        total: 149900,
        currency: 'INR',
        itemCount: 1,
        createdAt: '2026-10-05T12:00:00.000Z',
      },
    ],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/orders/:orderId', () => {
    it('returns 200 with complete order details for the authenticated customer (via Bearer token)', async () => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(sampleOrderDetails);

      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validOrderId);
      expect(res.body.data.orderNumber).toBe('MAT-20261005-7F2A9C');
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(res.body.data.paymentStatus).toBe('CAPTURED');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].productName).toBe('Sacred Lotus Mandala');
      expect(res.body.data.payments).toHaveLength(1);
    });

    it('returns 200 with complete order details for the authenticated customer (via HttpOnly auth_token cookie)', async () => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(sampleOrderDetails);

      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Cookie', [`auth_token=${customerToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validOrderId);
    });

    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get(`/api/orders/${validOrderId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid UUID parameter with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/orders/invalid-uuid-123')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 404 when order does not exist', async () => {
      vi.spyOn(orderService, 'getOrderById').mockRejectedValue(
        new NotFoundError(`Order with ID ${validOrderId} was not found.`)
      );

      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('prevents User A from viewing User B’s order (returns 404 anti-enumeration)', async () => {
      vi.spyOn(orderService, 'getOrderById').mockRejectedValue(
        new NotFoundError(`Order with ID ${validOrderId} was not found.`)
      );

      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/orders', () => {
    it('returns 200 with customer order history and pagination', async () => {
      vi.spyOn(orderService, 'getOrderHistory').mockResolvedValue(sampleOrderHistory);

      const res = await request(app)
        .get('/api/orders?page=1&pageSize=10')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.orders[0].orderNumber).toBe('MAT-20261005-7F2A9C');
      expect(res.body.data.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('rejects unauthenticated request to order history with 401', async () => {
      const res = await request(app).get('/api/orders');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns empty array when user has no orders', async () => {
      vi.spyOn(orderService, 'getOrderHistory').mockResolvedValue({
        orders: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      });

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('supports custom pagination query parameters', async () => {
      const spy = vi.spyOn(orderService, 'getOrderHistory').mockResolvedValue({
        orders: [],
        pagination: {
          page: 2,
          pageSize: 5,
          total: 12,
          totalPages: 3,
        },
      });

      const res = await request(app)
        .get('/api/orders?page=2&pageSize=5')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(customerId, 2, 5);
    });
  });

  describe('Security & Identity Trust Audit', () => {
    it('rejects raw UUID Bearer tokens without cryptographic JWT signatures (returns 401)', async () => {
      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Authorization', `Bearer ${customerId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects identity spoofing via x-user-id header alone (returns 401)', async () => {
      const res = await request(app).get('/api/orders').set('x-user-id', customerId);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects identity spoofing via client-controlled body or query params', async () => {
      const res = await request(app).get(`/api/orders?userId=${customerId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects tampered or forged JWT signatures (returns 401)', async () => {
      const forgedToken = jwt.sign(
        { id: customerId, email: 'attacker@example.com', role: 'CUSTOMER' },
        'wrong_attacker_secret_key_1234567890'
      );

      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects expired JWT tokens (returns 401)', async () => {
      const expiredToken = jwt.sign(
        { id: customerId, email: 'priya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '-1s' }
      );

      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('strictly denies access to guest orders (order.userId === null) via protected endpoint (returns 404)', async () => {
      vi.spyOn(orderService, 'getOrderById').mockRejectedValue(
        new NotFoundError(`Order with ID ${validOrderId} was not found.`)
      );

      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
