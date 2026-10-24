import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../src/app';
import { userRepository } from '../src/repositories/user.repository';
import { reviewRepository } from '../src/repositories/review.repository';
import { productRepository } from '../src/repositories/product.repository';
import { config } from '../src/config/env';
import type { ReviewWithAuthor, ReviewWithDetails } from '../src/repositories/review.repository';

describe('Admin Review Moderation REST API Endpoints (/api/admin/reviews)', () => {
  const adminUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const customerUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const productId = '11111111-2222-4333-8444-555555555555';
  const reviewId = '77777777-8888-4999-8aaa-bbbbbbbbbbbb';

  const sampleAdmin = {
    id: adminUserId,
    email: 'admin@mandala.test',
    passwordHash: 'secret_admin_hash',
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
    passwordHash: 'secret_customer_hash',
    firstName: 'Rohan',
    lastName: 'Verma',
    phone: '9123456780',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T10:00:00.000Z'),
    updatedAt: new Date('2026-10-05T10:00:00.000Z'),
  };

  const sampleReviewWithDetails: ReviewWithDetails = {
    id: reviewId,
    productId,
    userId: customerUserId,
    orderId: '99999999-9999-4999-8999-999999999999',
    rating: 5,
    title: 'Divine Geometric Balance',
    body: 'The symmetrical harmony and vibrant natural pigments in this mandala radiate tranquility.',
    status: 'PENDING',
    isVerifiedPurchase: true,
    createdAt: new Date('2026-10-15T12:00:00.000Z'),
    updatedAt: new Date('2026-10-15T12:00:00.000Z'),
    user: {
      id: customerUserId,
      firstName: 'Rohan',
      lastName: 'Verma',
      email: 'customer@mandala.test',
    },
    product: {
      id: productId,
      name: 'Cosmic Lotus Mandala',
      slug: 'cosmic-lotus-mandala',
      sku: 'MND-LOTUS-01',
    },
  };

  function createToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });
  }

  const adminToken = createToken({
    id: adminUserId,
    email: sampleAdmin.email,
    role: sampleAdmin.role,
  });

  const customerToken = createToken({
    id: customerUserId,
    email: sampleCustomer.email,
    role: sampleCustomer.role,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(userRepository, 'findById').mockImplementation(async (id: string) => {
      if (id === adminUserId) return sampleAdmin as any;
      if (id === customerUserId) return sampleCustomer as any;
      return null;
    });
  });

  // ==========================================================================
  // 1. GET /api/admin/reviews (List & Filter)
  // ==========================================================================
  describe('GET /api/admin/reviews', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).get('/api/admin/reviews');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 Forbidden when authenticated as non-admin customer', async () => {
      const res = await request(app)
        .get('/api/admin/reviews')
        .set('Cookie', `auth_token=${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 with paginated reviews for authorized admin', async () => {
      vi.spyOn(reviewRepository, 'findAdminReviews').mockResolvedValue({
        items: [sampleReviewWithDetails],
        totalItems: 1,
      });

      const res = await request(app)
        .get('/api/admin/reviews')
        .set('Cookie', `auth_token=${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(reviewId);
      expect(res.body.data[0].product.name).toBe('Cosmic Lotus Mandala');
      expect(res.body.data[0].user.email).toBe('customer@mandala.test');
      expect(res.body.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      });

      // Verify no sensitive credentials leaked
      expect(res.body.data[0].user.passwordHash).toBeUndefined();
      expect(res.body.data[0].customer.passwordHash).toBeUndefined();
    });

    it('applies filters for status, productId, search, and sort', async () => {
      const spyFind = vi.spyOn(reviewRepository, 'findAdminReviews').mockResolvedValue({
        items: [],
        totalItems: 0,
      });

      const res = await request(app)
        .get(
          `/api/admin/reviews?status=PENDING&productId=${productId}&search=Lotus&sort=rating_desc&page=2&pageSize=10`
        )
        .set('Cookie', `auth_token=${adminToken}`);

      expect(res.status).toBe(200);
      expect(spyFind).toHaveBeenCalledWith(
        {
          status: 'PENDING',
          productId,
          search: 'Lotus',
        },
        {
          page: 2,
          pageSize: 10,
          sort: 'rating_desc',
        }
      );
    });

    it('rejects invalid query parameters with 400 ValidationError', async () => {
      // Invalid status
      const resBadStatus = await request(app)
        .get('/api/admin/reviews?status=ACTIVE')
        .set('Cookie', `auth_token=${adminToken}`);
      expect(resBadStatus.status).toBe(400);
      expect(resBadStatus.body.error.code).toBe('VALIDATION_ERROR');

      // Invalid page (< 1)
      const resBadPage = await request(app)
        .get('/api/admin/reviews?page=0')
        .set('Cookie', `auth_token=${adminToken}`);
      expect(resBadPage.status).toBe(400);

      // Invalid pageSize (> 100)
      const resBadPageSize = await request(app)
        .get('/api/admin/reviews?pageSize=105')
        .set('Cookie', `auth_token=${adminToken}`);
      expect(resBadPageSize.status).toBe(400);

      // Invalid productId format
      const resBadProductId = await request(app)
        .get('/api/admin/reviews?productId=not-a-uuid')
        .set('Cookie', `auth_token=${adminToken}`);
      expect(resBadProductId.status).toBe(400);

      // Invalid sort
      const resBadSort = await request(app)
        .get('/api/admin/reviews?sort=invalid_sort')
        .set('Cookie', `auth_token=${adminToken}`);
      expect(resBadSort.status).toBe(400);
    });
  });

  // ==========================================================================
  // 2. PATCH /api/admin/reviews/:id/status (Moderation Status Update)
  // ==========================================================================
  describe('PATCH /api/admin/reviews/:id/status', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app)
        .patch(`/api/admin/reviews/${reviewId}/status`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when authenticated as non-admin customer', async () => {
      const res = await request(app)
        .patch(`/api/admin/reviews/${reviewId}/status`)
        .set('Cookie', `auth_token=${customerToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);
    });

    it('returns 400 ValidationError for invalid review ID format', async () => {
      const res = await request(app)
        .patch('/api/admin/reviews/not-a-uuid/status')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 ValidationError for invalid status value', async () => {
      const res = await request(app)
        .patch(`/api/admin/reviews/${reviewId}/status`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ status: 'PUBLISHED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 ValidationError when extra writable fields are passed', async () => {
      const res = await request(app)
        .patch(`/api/admin/reviews/${reviewId}/status`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          status: 'APPROVED',
          rating: 1,
          body: 'malicious tamper',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Unexpected fields');
    });

    it('returns 404 NotFoundError when review does not exist', async () => {
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/admin/reviews/${reviewId}/status`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('successfully approves a pending review', async () => {
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue({
        ...sampleReviewWithDetails,
        user: {
          id: customerUserId,
          firstName: 'Rohan',
          lastName: 'Verma',
        },
      } as ReviewWithAuthor);

      vi.spyOn(reviewRepository, 'updateStatus').mockResolvedValue({
        ...sampleReviewWithDetails,
        status: 'APPROVED',
      });

      const res = await request(app)
        .patch(`/api/admin/reviews/${reviewId}/status`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(reviewId);
      expect(res.body.data.status).toBe('APPROVED');
      expect(reviewRepository.updateStatus).toHaveBeenCalledWith(reviewId, 'APPROVED');
    });

    it('successfully rejects a review', async () => {
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue({
        ...sampleReviewWithDetails,
        user: {
          id: customerUserId,
          firstName: 'Rohan',
          lastName: 'Verma',
        },
      } as ReviewWithAuthor);

      vi.spyOn(reviewRepository, 'updateStatus').mockResolvedValue({
        ...sampleReviewWithDetails,
        status: 'REJECTED',
      });

      const res = await request(app)
        .patch(`/api/admin/reviews/${reviewId}/status`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ status: 'REJECTED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REJECTED');
      expect(reviewRepository.updateStatus).toHaveBeenCalledWith(reviewId, 'REJECTED');
    });

    it('successfully resets an approved review back to pending', async () => {
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue({
        ...sampleReviewWithDetails,
        status: 'APPROVED',
        user: {
          id: customerUserId,
          firstName: 'Rohan',
          lastName: 'Verma',
        },
      } as ReviewWithAuthor);

      vi.spyOn(reviewRepository, 'updateStatus').mockResolvedValue({
        ...sampleReviewWithDetails,
        status: 'PENDING',
      });

      const res = await request(app)
        .patch(`/api/admin/reviews/${reviewId}/status`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ status: 'PENDING' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(reviewRepository.updateStatus).toHaveBeenCalledWith(reviewId, 'PENDING');
    });
  });

  // ==========================================================================
  // 3. DELETE /api/admin/reviews/:id (Authoritative Deletion)
  // ==========================================================================
  describe('DELETE /api/admin/reviews/:id', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).delete(`/api/admin/reviews/${reviewId}`);

      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when authenticated as non-admin customer', async () => {
      const res = await request(app)
        .delete(`/api/admin/reviews/${reviewId}`)
        .set('Cookie', `auth_token=${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 400 ValidationError for invalid review ID format', async () => {
      const res = await request(app)
        .delete('/api/admin/reviews/not-a-valid-uuid')
        .set('Cookie', `auth_token=${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 NotFoundError when review does not exist', async () => {
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/admin/reviews/${reviewId}`)
        .set('Cookie', `auth_token=${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('successfully deletes a review by admin', async () => {
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue({
        ...sampleReviewWithDetails,
        user: {
          id: customerUserId,
          firstName: 'Rohan',
          lastName: 'Verma',
        },
      } as ReviewWithAuthor);

      vi.spyOn(reviewRepository, 'delete').mockResolvedValue({} as any);

      const res = await request(app)
        .delete(`/api/admin/reviews/${reviewId}`)
        .set('Cookie', `auth_token=${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');
      expect(reviewRepository.delete).toHaveBeenCalledWith(reviewId);
    });
  });

  // ==========================================================================
  // 4. Public storefront approved-only and rating aggregate consistency
  // ==========================================================================
  describe('Public storefront review filtering and rating aggregate consistency', () => {
    it('public endpoint only requests APPROVED reviews from repository', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue({
        id: productId,
        isActive: true,
      } as any);

      const spyFindPublic = vi.spyOn(reviewRepository, 'findByProductId').mockResolvedValue([]);

      const spySummary = vi.spyOn(reviewRepository, 'getRatingSummary').mockResolvedValue({
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });

      const res = await request(app).get(`/api/reviews/product/${productId}`);

      expect(res.status).toBe(200);
      expect(spyFindPublic).toHaveBeenCalledWith(productId, 'APPROVED');
      expect(spySummary).toHaveBeenCalledWith(productId);
    });
  });
});
