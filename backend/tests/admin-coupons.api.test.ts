import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole, DiscountType } from '@prisma/client';
import { app } from '../src/app';
import { userRepository } from '../src/repositories/user.repository';
import { couponService } from '../src/services/coupon.service';
import { config } from '../src/config/env';

describe('Coupon REST API Endpoints (/api/admin/coupons & /api/coupons)', () => {
  const adminUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const customerUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const couponId = '11111111-2222-4333-8444-555555555555';

  const sampleAdmin = {
    id: adminUserId,
    email: 'admin@mandala.test',
    passwordHash: 'secret_hash',
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
    passwordHash: 'customer_hash',
    firstName: 'Rohan',
    lastName: 'Verma',
    phone: '9123456780',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T10:00:00.000Z'),
    updatedAt: new Date('2026-10-05T10:00:00.000Z'),
  };

  const sampleCouponDto = {
    id: couponId,
    code: 'FESTIVE15',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 15,
    minOrderAmount: 100000,
    maxDiscountAmount: 50000,
    usageLimit: 100,
    timesUsed: 5,
    validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ordersCount: 5,
  };

  function createToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Public Coupon Endpoint: POST /api/coupons/validate', () => {
    it('validates coupon code and returns authoritative discount preview', async () => {
      vi.spyOn(couponService, 'validatePublicCoupon').mockResolvedValue({
        valid: true,
        couponCode: 'FESTIVE15',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        discountAmount: 30000, // ₹300 on ₹2,000
        newTotal: 170000,
      });

      const res = await request(app)
        .post('/api/coupons/validate')
        .send({ code: 'festive15', subtotal: 200000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountAmount).toBe(30000);
      expect(res.body.data.newTotal).toBe(170000);
    });

    it('rejects missing or invalid payload with 400 Validation Error', async () => {
      const res = await request(app).post('/api/coupons/validate').send({ code: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Admin Authorization on /api/admin/coupons', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/coupons');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects authenticated non-admin customers with 403 Forbidden', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleCustomer as any);
      const customerToken = createToken({
        id: sampleCustomer.id,
        email: sampleCustomer.email,
        role: sampleCustomer.role,
      });

      const res = await request(app)
        .get('/api/admin/coupons')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Admin Coupon CRUD Endpoints', () => {
    let adminToken: string;

    beforeEach(() => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin as any);
      adminToken = createToken({
        id: sampleAdmin.id,
        email: sampleAdmin.email,
        role: sampleAdmin.role,
      });
    });

    it('GET /api/admin/coupons returns paginated coupons', async () => {
      vi.spyOn(couponService, 'getAdminCoupons').mockResolvedValue({
        items: [sampleCouponDto],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      });

      const res = await request(app)
        .get('/api/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].code).toBe('FESTIVE15');
    });

    it('POST /api/admin/coupons creates a new coupon with 201 Created', async () => {
      vi.spyOn(couponService, 'createCoupon').mockResolvedValue(sampleCouponDto);

      const res = await request(app)
        .post('/api/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'FESTIVE15',
          discountType: 'PERCENTAGE',
          discountValue: 15,
          validFrom: sampleCouponDto.validFrom,
          validUntil: sampleCouponDto.validUntil,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('FESTIVE15');
    });

    it('PATCH /api/admin/coupons/:id/status toggles status', async () => {
      vi.spyOn(couponService, 'toggleCouponStatus').mockResolvedValue({
        ...sampleCouponDto,
        isActive: false,
      });

      const res = await request(app)
        .patch(`/api/admin/coupons/${couponId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });

    it('DELETE /api/admin/coupons/:id safely deletes unreferenced coupon', async () => {
      vi.spyOn(couponService, 'deleteCoupon').mockResolvedValue({
        deleted: true,
        id: couponId,
      });

      const res = await request(app)
        .delete(`/api/admin/coupons/${couponId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toBe(true);
    });
  });
});
