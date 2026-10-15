import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole, OrderStatus, PaymentStatus } from '@prisma/client';
import { app } from '../src/app';
import { userRepository } from '../src/repositories/user.repository';
import { orderService } from '../src/services';
import { NotFoundError, ConflictError, ValidationError } from '../src/errors';
import { config } from '../src/config/env';
import type { AdminOrderListItemDto, AdminOrderDetailsDto } from '../src/types/admin';

describe('Admin Orders REST API Endpoints (/api/admin/orders)', () => {
  const adminUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const customerUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const sampleOrderId = '11111111-1111-4111-8111-111111111111';

  const sampleAdmin = {
    id: adminUserId,
    email: 'admin@mandala.test',
    passwordHash: 'secret_hash_not_exposed',
    firstName: 'Meera',
    lastName: 'Deshmukh',
    phone: '9876543210',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
  };

  const sampleCustomer = {
    id: customerUserId,
    email: 'customer@mandala.test',
    passwordHash: 'customer_secret_hash',
    firstName: 'Rohan',
    lastName: 'Verma',
    phone: '9123456780',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T10:00:00.000Z'),
    updatedAt: new Date('2026-10-05T10:00:00.000Z'),
  };

  function createToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });
  }

  const adminToken = createToken({ id: adminUserId, email: sampleAdmin.email, role: 'ADMIN' });
  const customerToken = createToken({
    id: customerUserId,
    email: sampleCustomer.email,
    role: 'CUSTOMER',
  });

  const sampleOrderItemDto: AdminOrderListItemDto = {
    id: sampleOrderId,
    orderNumber: 'MAT-20261005-7F2A9C',
    customerEmail: 'customer@mandala.test',
    customerPhone: '9123456780',
    shippingRecipientName: 'Rohan Verma',
    isGuest: false,
    userId: customerUserId,
    status: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.CAPTURED,
    total: 149900,
    itemCount: 1,
    trackingNumber: null,
    courierName: null,
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-05T10:05:00.000Z',
  };

  const sampleOrderDetailsDto: AdminOrderDetailsDto = {
    ...sampleOrderItemDto,
    subtotal: 149900,
    discountAmount: 0,
    shippingFee: 0,
    taxAmount: 0,
    currency: 'INR',
    couponCode: null,
    customer: {
      userId: customerUserId,
      email: 'customer@mandala.test',
      phone: '9123456780',
      isGuest: false,
      registeredName: 'Rohan Verma',
    },
    shippingAddress: {
      recipientName: 'Rohan Verma',
      phone: '9123456780',
      addressLine1: 'Flat 101, Lotus Apts',
      addressLine2: null,
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
        providerOrderId: 'order_rzp_123',
        providerPaymentId: 'pay_rzp_123',
        amount: 149900,
        currency: 'INR',
        status: PaymentStatus.CAPTURED,
        paidAt: '2026-10-05T10:05:00.000Z',
        failureReason: null,
        createdAt: '2026-10-05T10:00:00.000Z',
      },
    ],
    fulfillment: {
      trackingNumber: null,
      courierName: null,
      customerNotes: null,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(userRepository, 'findById').mockImplementation(async (id: string) => {
      if (id === adminUserId) return sampleAdmin as any;
      if (id === customerUserId) return sampleCustomer as any;
      return null;
    });
  });

  // ============================================================================
  // 1. GET /api/admin/orders
  // ============================================================================
  describe('GET /api/admin/orders', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/orders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-admin customer with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns paginated orders list for authenticated administrator', async () => {
      vi.spyOn(orderService, 'getAdminOrders').mockResolvedValue({
        items: [sampleOrderItemDto],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      });

      const res = await request(app)
        .get('/api/admin/orders?page=1&pageSize=20')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].orderNumber).toBe('MAT-20261005-7F2A9C');
      expect(res.body.pagination.totalItems).toBe(1);
    });

    it('passes search, status, paymentStatus, and date filters to service', async () => {
      const getOrdersSpy = vi.spyOn(orderService, 'getAdminOrders').mockResolvedValue({
        items: [],
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      });

      const res = await request(app)
        .get(
          '/api/admin/orders?search=Lotus&status=CONFIRMED&paymentStatus=CAPTURED&from=2026-10-01T00:00:00.000Z'
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(getOrdersSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Lotus',
          status: 'CONFIRMED',
          paymentStatus: 'CAPTURED',
          from: '2026-10-01T00:00:00.000Z',
        })
      );
    });
  });

  // ============================================================================
  // 2. GET /api/admin/orders/:id
  // ============================================================================
  describe('GET /api/admin/orders/:id', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get(`/api/admin/orders/${sampleOrderId}`);
      expect(res.status).toBe(401);
    });

    it('rejects non-admin customer with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/admin/orders/${sampleOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('returns full order snapshot details for authenticated administrator', async () => {
      vi.spyOn(orderService, 'getAdminOrderById').mockResolvedValue(sampleOrderDetailsDto);

      const res = await request(app)
        .get(`/api/admin/orders/${sampleOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(sampleOrderId);
      expect(res.body.data.customer.email).toBe('customer@mandala.test');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.payments).toHaveLength(1);
    });

    it('returns 404 when order is not found', async () => {
      vi.spyOn(orderService, 'getAdminOrderById').mockRejectedValue(
        new NotFoundError('Order not found.')
      );

      const res = await request(app)
        .get(`/api/admin/orders/${sampleOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for malformed UUID parameter', async () => {
      vi.spyOn(orderService, 'getAdminOrderById').mockRejectedValue(
        new ValidationError('Invalid Order ID format.')
      );

      const res = await request(app)
        .get('/api/admin/orders/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // 3. PATCH /api/admin/orders/:id/status
  // ============================================================================
  describe('PATCH /api/admin/orders/:id/status', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app)
        .patch(`/api/admin/orders/${sampleOrderId}/status`)
        .send({ status: 'PROCESSING' });

      expect(res.status).toBe(401);
    });

    it('rejects customer with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/admin/orders/${sampleOrderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PROCESSING' });

      expect(res.status).toBe(403);
    });

    it('successfully transitions order status when authorized and valid', async () => {
      const updatedDto: AdminOrderDetailsDto = {
        ...sampleOrderDetailsDto,
        status: OrderStatus.PROCESSING,
      };

      vi.spyOn(orderService, 'updateOrderStatusByAdmin').mockResolvedValue(updatedDto);

      const res = await request(app)
        .patch(`/api/admin/orders/${sampleOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(OrderStatus.PROCESSING);
    });

    it('returns 409 Conflict when payment condition or state transition fails', async () => {
      vi.spyOn(orderService, 'updateOrderStatusByAdmin').mockRejectedValue(
        new ConflictError('Cannot advance order without verified CAPTURED payment.')
      );

      const res = await request(app)
        .patch(`/api/admin/orders/${sampleOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 Validation Error for invalid payload or missing courier on SHIPPED', async () => {
      vi.spyOn(orderService, 'updateOrderStatusByAdmin').mockRejectedValue(
        new ValidationError(
          'Tracking number is mandatory when transitioning order status to SHIPPED.'
        )
      );

      const res = await request(app)
        .patch(`/api/admin/orders/${sampleOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SHIPPED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
