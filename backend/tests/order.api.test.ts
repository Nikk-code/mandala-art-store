import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { orderService } from '../src/services';
import { NotFoundError } from '../src/errors';
import type { OrderDetailsDto, OrderHistoryResponseDto } from '../src/types';

describe('Order REST API Endpoints (/api/orders)', () => {
  const customerId = '11111111-1111-4111-8111-111111111111';
  const otherCustomerId = '22222222-2222-4222-8222-222222222222';
  const validOrderId = '33333333-3333-4333-8333-333333333333';

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
    it('returns 200 with complete order details for the authenticated customer', async () => {
      vi.spyOn(orderService, 'getOrderById').mockResolvedValue(sampleOrderDetails);

      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Authorization', `Bearer ${customerId}`);

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

    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get(`/api/orders/${validOrderId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid UUID parameter with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/orders/invalid-uuid-123')
        .set('Authorization', `Bearer ${customerId}`);

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
        .set('Authorization', `Bearer ${customerId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('prevents User A from viewing User B’s order (returns 404 anti-enumeration)', async () => {
      // If order belongs to customerId but otherCustomerId tries to fetch it
      vi.spyOn(orderService, 'getOrderById').mockRejectedValue(
        new NotFoundError(`Order with ID ${validOrderId} was not found.`)
      );

      const res = await request(app)
        .get(`/api/orders/${validOrderId}`)
        .set('Authorization', `Bearer ${otherCustomerId}`);

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
        .set('Authorization', `Bearer ${customerId}`);

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
        .set('Authorization', `Bearer ${customerId}`);

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
        .set('Authorization', `Bearer ${customerId}`);

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(customerId, 2, 5);
    });
  });
});
