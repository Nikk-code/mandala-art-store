import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { reviewRepository } from '../src/repositories/review.repository';
import { productRepository } from '../src/repositories/product.repository';
import { userRepository } from '../src/repositories/user.repository';
import { config } from '../src/config/env';
import { UserRole, ProductAvailability } from '@prisma/client';
import type { ReviewWithAuthor } from '../src/repositories/review.repository';
import type { ProductWithDetails } from '../src/repositories/product.repository';

describe('Review REST API Endpoints (/api/reviews)', () => {
  const customerAId = '11111111-1111-4111-8111-111111111111';
  const customerBId = '22222222-2222-4222-8222-222222222222';
  const productAId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const reviewAId = '44444444-4444-4444-8444-444444444444';
  const orderAId = '55555555-5555-4555-8555-555555555555';

  const customerA = {
    id: customerAId,
    email: 'ananya@example.com',
    passwordHash: 'hashed',
    firstName: 'Ananya',
    lastName: 'Sharma',
    phone: '9876543210',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T12:00:00.000Z'),
    updatedAt: new Date('2026-10-05T12:00:00.000Z'),
  };

  const customerB = {
    id: customerBId,
    email: 'rohit@example.com',
    passwordHash: 'hashed',
    firstName: 'Rohit',
    lastName: 'Verma',
    phone: '9876543211',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T12:00:00.000Z'),
    updatedAt: new Date('2026-10-05T12:00:00.000Z'),
  };

  const productA: ProductWithDetails = {
    id: productAId,
    sku: 'MAN-001',
    name: 'Cosmic Mandala Canvas',
    slug: 'cosmic-mandala-canvas',
    description: 'Detailed cosmic mandala painting.',
    shortDescription: 'Cosmic mandala art piece.',
    price: 149900,
    compareAtPrice: 199900,
    categoryId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 10,
    dimensions: '30x30 cm',
    material: 'Canvas & Acrylic',
    weightGrams: 500,
    isHandmade: true,
    isFeatured: true,
    isActive: true,
    metaTitle: 'Cosmic Mandala Canvas',
    metaDescription: 'Handmade canvas mandala',
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
    category: {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      name: 'Canvas Art',
      slug: 'canvas-art',
      description: 'Canvas category',
      imageUrl: null,
      displayOrder: 1,
      isActive: true,
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
      updatedAt: new Date('2026-10-01T10:00:00.000Z'),
    },
    images: [],
    reviews: [{ rating: 5 }],
  };

  const reviewA: ReviewWithAuthor = {
    id: reviewAId,
    productId: productAId,
    userId: customerAId,
    orderId: orderAId,
    rating: 5,
    title: 'Magnificent mandala',
    body: 'The sacred geometry and gold accents are breathtaking in person.',
    status: 'APPROVED',
    isVerifiedPurchase: true,
    createdAt: new Date('2026-10-10T12:00:00.000Z'),
    updatedAt: new Date('2026-10-10T12:00:00.000Z'),
    user: {
      id: customerAId,
      firstName: 'Ananya',
      lastName: 'Sharma',
    },
  };

  const pendingReviewA: ReviewWithAuthor = {
    ...reviewA,
    status: 'PENDING',
  };

  function createAuthToken(
    userId: string = customerAId,
    email: string = 'ananya@example.com'
  ): string {
    return jwt.sign({ id: userId, email, role: 'CUSTOMER' }, config.jwtSecret, {
      expiresIn: '7d',
      algorithm: 'HS256',
    });
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(userRepository, 'findById').mockImplementation(async (id: string) => {
      if (id === customerAId) return customerA;
      if (id === customerBId) return customerB;
      return null;
    });
  });

  // --------------------------------------------------------------------------
  // 1. GET /api/reviews/product/:productId (Public)
  // --------------------------------------------------------------------------
  describe('GET /api/reviews/product/:productId', () => {
    it('returns 200 with approved reviews and rating summary', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(reviewRepository, 'findByProductId').mockResolvedValue([reviewA]);
      vi.spyOn(reviewRepository, 'getRatingSummary').mockResolvedValue({
        averageRating: 5.0,
        totalReviews: 1,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
      });

      const res = await request(app).get(`/api/reviews/product/${productAId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews).toHaveLength(1);
      expect(res.body.data.reviews[0].id).toBe(reviewAId);
      expect(res.body.data.reviews[0].user.firstName).toBe('Ananya');
      expect(res.body.data.summary.averageRating).toBe(5.0);
      expect(reviewRepository.findByProductId).toHaveBeenCalledWith(productAId, 'APPROVED');
    });

    it('excludes pending and rejected reviews from public visibility and rating calculations', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(reviewRepository, 'findByProductId').mockResolvedValue([]);
      vi.spyOn(reviewRepository, 'getRatingSummary').mockResolvedValue({
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });

      const res = await request(app).get(`/api/reviews/product/${productAId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reviews).toHaveLength(0);
      expect(res.body.data.summary.totalReviews).toBe(0);
      expect(reviewRepository.findByProductId).toHaveBeenCalledWith(productAId, 'APPROVED');
    });

    it('returns 404 when product is not found', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(null);

      const res = await request(app).get(`/api/reviews/product/${productAId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid UUID format', async () => {
      const res = await request(app).get('/api/reviews/product/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --------------------------------------------------------------------------
  // 2. GET /api/reviews/eligibility/:productId
  // --------------------------------------------------------------------------
  describe('GET /api/reviews/eligibility/:productId', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).get(`/api/reviews/eligibility/${productAId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with isEligible: true when verified purchase exists', async () => {
      const token = createAuthToken(customerAId);
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(reviewRepository, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(reviewRepository, 'findEligiblePurchase').mockResolvedValue({ orderId: orderAId });

      const res = await request(app)
        .get(`/api/reviews/eligibility/${productAId}`)
        .set('Cookie', `auth_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isEligible).toBe(true);
      expect(res.body.data.hasReviewed).toBe(false);
    });

    it('returns 200 with isEligible: false when no purchase exists', async () => {
      const token = createAuthToken(customerAId);
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(reviewRepository, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(reviewRepository, 'findEligiblePurchase').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/reviews/eligibility/${productAId}`)
        .set('Cookie', `auth_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isEligible).toBe(false);
      expect(res.body.data.reason).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 3. POST /api/reviews
  // --------------------------------------------------------------------------
  describe('POST /api/reviews', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({ productId: productAId, rating: 5, body: 'Superb piece of art.' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when rating is missing or invalid', async () => {
      const token = createAuthToken(customerAId);

      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', `auth_token=${token}`)
        .send({ productId: productAId, rating: 0, body: 'Superb piece of art.' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when review text is less than 5 characters', async () => {
      const token = createAuthToken(customerAId);

      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', `auth_token=${token}`)
        .send({ productId: productAId, rating: 5, body: 'Nice' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 403 when customer has not purchased this product', async () => {
      const token = createAuthToken(customerAId);
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(reviewRepository, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(reviewRepository, 'findEligiblePurchase').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', `auth_token=${token}`)
        .send({
          productId: productAId,
          rating: 5,
          title: 'Amazing',
          body: 'Writing a review without purchasing.',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 409 Conflict when customer has already submitted a review', async () => {
      const token = createAuthToken(customerAId);
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(reviewRepository, 'findByUserAndProduct').mockResolvedValue(reviewA);

      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', `auth_token=${token}`)
        .send({
          productId: productAId,
          rating: 5,
          title: 'Amazing',
          body: 'Attempting duplicate review.',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 201 Created on valid review submission with PENDING status', async () => {
      const token = createAuthToken(customerAId);
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(reviewRepository, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(reviewRepository, 'findEligiblePurchase').mockResolvedValue({ orderId: orderAId });
      vi.spyOn(reviewRepository, 'create').mockResolvedValue(pendingReviewA);

      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', `auth_token=${token}`)
        .send({
          productId: productAId,
          rating: 5,
          title: 'Magnificent mandala',
          body: 'The sacred geometry and gold accents are breathtaking in person.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(reviewAId);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.isVerifiedPurchase).toBe(true);
      expect(reviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: productAId,
          status: 'PENDING',
        })
      );
    });

    it('ignores client-supplied status: "APPROVED" and creates review with PENDING status', async () => {
      const token = createAuthToken(customerAId);
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(reviewRepository, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(reviewRepository, 'findEligiblePurchase').mockResolvedValue({ orderId: orderAId });
      vi.spyOn(reviewRepository, 'create').mockResolvedValue(pendingReviewA);

      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', `auth_token=${token}`)
        .send({
          productId: productAId,
          rating: 5,
          title: 'Tampering Attempt',
          body: 'Customer attempts to force auto-approval via payload.',
          status: 'APPROVED',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(reviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: productAId,
          status: 'PENDING',
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. PUT /api/reviews/:reviewId
  // --------------------------------------------------------------------------
  describe('PUT /api/reviews/:reviewId', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).put(`/api/reviews/${reviewAId}`).send({ rating: 4 });

      expect(res.status).toBe(401);
    });

    it('returns 404 when customer attempts to edit another customer review (IDOR)', async () => {
      const token = createAuthToken(customerBId, 'rohit@example.com');
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue(reviewA); // owned by customerA

      const res = await request(app)
        .put(`/api/reviews/${reviewAId}`)
        .set('Cookie', `auth_token=${token}`)
        .send({ rating: 4, body: 'Attempting to edit someone else review.' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 200 on successful review update', async () => {
      const token = createAuthToken(customerAId);
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue(reviewA);
      vi.spyOn(reviewRepository, 'update').mockResolvedValue({
        ...reviewA,
        rating: 4,
        body: 'Updated review comments after several weeks of hanging it.',
      });

      const res = await request(app)
        .put(`/api/reviews/${reviewAId}`)
        .set('Cookie', `auth_token=${token}`)
        .send({
          rating: 4,
          body: 'Updated review comments after several weeks of hanging it.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
    });
  });

  // --------------------------------------------------------------------------
  // 5. DELETE /api/reviews/:reviewId
  // --------------------------------------------------------------------------
  describe('DELETE /api/reviews/:reviewId', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).delete(`/api/reviews/${reviewAId}`);

      expect(res.status).toBe(401);
    });

    it('returns 404 when customer attempts to delete another customer review (IDOR)', async () => {
      const token = createAuthToken(customerBId, 'rohit@example.com');
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue(reviewA); // owned by customerA

      const res = await request(app)
        .delete(`/api/reviews/${reviewAId}`)
        .set('Cookie', `auth_token=${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 200 on successful review deletion', async () => {
      const token = createAuthToken(customerAId);
      vi.spyOn(reviewRepository, 'findById').mockResolvedValue(reviewA);
      vi.spyOn(reviewRepository, 'delete').mockResolvedValue({} as never);

      const res = await request(app)
        .delete(`/api/reviews/${reviewAId}`)
        .set('Cookie', `auth_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');
    });
  });
});
