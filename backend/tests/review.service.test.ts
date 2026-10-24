import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReviewService } from '../src/services/review.service';
import type {
  ReviewRepository,
  ReviewWithAuthor,
  ReviewWithDetails,
} from '../src/repositories/review.repository';
import type { ProductRepository, ProductWithDetails } from '../src/repositories/product.repository';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../src/errors';
import { ProductAvailability, Prisma } from '@prisma/client';

describe('ReviewService Domain Logic', () => {
  let mockReviewRepo: ReviewRepository;
  let mockProductRepo: ProductRepository;
  let service: ReviewService;

  const validProductId = '11111111-1111-1111-1111-111111111111';
  const validUserId = '22222222-2222-2222-2222-222222222222';
  const otherUserId = '33333333-3333-3333-3333-333333333333';
  const validReviewId = '44444444-4444-4444-4444-444444444444';
  const validOrderId = '55555555-5555-5555-5555-555555555555';

  const mockProduct: ProductWithDetails = {
    id: validProductId,
    sku: 'MND-LOTUS-01',
    name: 'Sacred Lotus Mandala',
    slug: 'sacred-lotus-mandala',
    description: 'Detailed description',
    shortDescription: 'Short description',
    price: 150000,
    compareAtPrice: 180000,
    categoryId: 'cat-1',
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 5,
    dimensions: '12x12 inches',
    material: 'Acrylic on canvas',
    weightGrams: 500,
    isHandmade: true,
    isFeatured: true,
    isActive: true,
    metaTitle: null,
    metaDescription: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    category: {
      id: 'cat-1',
      name: 'Mandala Art',
      slug: 'mandala-art',
      description: null,
      imageUrl: null,
      displayOrder: 1,
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    images: [],
    reviews: [{ rating: 5 }, { rating: 4 }],
  };

  const mockReview: ReviewWithAuthor = {
    id: validReviewId,
    productId: validProductId,
    userId: validUserId,
    orderId: validOrderId,
    rating: 5,
    title: 'Exquisite Artwork',
    body: 'The detailing on this mandala is mesmerizing. Truly mastercrafted!',
    status: 'APPROVED',
    isVerifiedPurchase: true,
    createdAt: new Date('2026-02-01T10:00:00.000Z'),
    updatedAt: new Date('2026-02-01T10:00:00.000Z'),
    user: {
      id: validUserId,
      firstName: 'Aarav',
      lastName: 'Patel',
    },
  };

  beforeEach(() => {
    mockReviewRepo = {
      findByProductId: vi.fn(),
      findById: vi.fn(),
      findByUserAndProduct: vi.fn(),
      getRatingSummary: vi.fn(),
      findEligiblePurchase: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReviewRepository;

    mockProductRepo = {
      findById: vi.fn(),
    } as unknown as ProductRepository;

    service = new ReviewService(mockReviewRepo, mockProductRepo);
  });

  // --------------------------------------------------------------------------
  // 1. getProductReviews
  // --------------------------------------------------------------------------
  describe('getProductReviews', () => {
    it('throws NotFoundError when product does not exist', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(null);

      await expect(service.getProductReviews(validProductId)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when product is inactive', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      await expect(service.getProductReviews(validProductId)).rejects.toThrow(NotFoundError);
    });

    it('returns approved reviews and summary for an active product', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(mockReviewRepo, 'findByProductId').mockResolvedValue([mockReview]);
      vi.spyOn(mockReviewRepo, 'getRatingSummary').mockResolvedValue({
        averageRating: 5.0,
        totalReviews: 1,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
      });

      const result = await service.getProductReviews(validProductId);

      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].id).toBe(validReviewId);
      expect(result.reviews[0].user.firstName).toBe('Aarav');
      expect(result.summary.averageRating).toBe(5.0);
      expect(result.summary.totalReviews).toBe(1);
    });

    it('returns empty review list and 0 summary when product has no reviews', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(mockReviewRepo, 'findByProductId').mockResolvedValue([]);
      vi.spyOn(mockReviewRepo, 'getRatingSummary').mockResolvedValue({
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });

      const result = await service.getProductReviews(validProductId);

      expect(result.reviews).toEqual([]);
      expect(result.summary.totalReviews).toBe(0);
      expect(result.summary.averageRating).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. checkEligibility
  // --------------------------------------------------------------------------
  describe('checkEligibility', () => {
    it('returns isEligible: false when customer has no paid orders for this product', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(mockReviewRepo, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(mockReviewRepo, 'findEligiblePurchase').mockResolvedValue(null);

      const result = await service.checkEligibility(validUserId, validProductId);

      expect(result.isEligible).toBe(false);
      expect(result.hasReviewed).toBe(false);
      expect(result.existingReview).toBeNull();
      expect(result.reason).toContain('verified purchasers');
    });

    it('returns isEligible: true and hasReviewed: false when customer purchased but has not reviewed', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(mockReviewRepo, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(mockReviewRepo, 'findEligiblePurchase').mockResolvedValue({ orderId: validOrderId });

      const result = await service.checkEligibility(validUserId, validProductId);

      expect(result.isEligible).toBe(true);
      expect(result.hasReviewed).toBe(false);
      expect(result.existingReview).toBeNull();
    });

    it('returns isEligible: true, hasReviewed: true, and existingReview when already reviewed', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(mockReviewRepo, 'findByUserAndProduct').mockResolvedValue(mockReview);
      vi.spyOn(mockReviewRepo, 'findEligiblePurchase').mockResolvedValue({ orderId: validOrderId });

      const result = await service.checkEligibility(validUserId, validProductId);

      expect(result.isEligible).toBe(true);
      expect(result.hasReviewed).toBe(true);
      expect(result.existingReview?.id).toBe(validReviewId);
    });
  });

  // --------------------------------------------------------------------------
  // 3. createReview
  // --------------------------------------------------------------------------
  describe('createReview', () => {
    it('rejects invalid ratings outside 1-5 or non-integers', async () => {
      await expect(
        service.createReview(validUserId, {
          productId: validProductId,
          rating: 6,
          body: 'Great painting!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        service.createReview(validUserId, {
          productId: validProductId,
          rating: 4.5,
          body: 'Great painting!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        service.createReview(validUserId, {
          productId: validProductId,
          rating: 0,
          body: 'Great painting!',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects empty or excessively short review text (< 5 characters)', async () => {
      await expect(
        service.createReview(validUserId, {
          productId: validProductId,
          rating: 5,
          body: 'Good',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects excessively long review text (> 2000 characters)', async () => {
      const longBody = 'a'.repeat(2001);
      await expect(
        service.createReview(validUserId, {
          productId: validProductId,
          rating: 5,
          body: longBody,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ForbiddenError when customer has not purchased the artwork', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(mockReviewRepo, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(mockReviewRepo, 'findEligiblePurchase').mockResolvedValue(null);

      await expect(
        service.createReview(validUserId, {
          productId: validProductId,
          rating: 5,
          body: 'Stunning art, looks great in photos!',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError when customer has already submitted a review', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(mockReviewRepo, 'findByUserAndProduct').mockResolvedValue(mockReview);

      await expect(
        service.createReview(validUserId, {
          productId: validProductId,
          rating: 5,
          body: 'Trying to review twice!',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('successfully creates review and sets isVerifiedPurchase: true', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(mockReviewRepo, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(mockReviewRepo, 'findEligiblePurchase').mockResolvedValue({ orderId: validOrderId });
      vi.spyOn(mockReviewRepo, 'create').mockResolvedValue(mockReview);

      const result = await service.createReview(validUserId, {
        productId: validProductId,
        rating: 5,
        title: 'Exquisite Artwork',
        body: 'The detailing on this mandala is mesmerizing. Truly mastercrafted!',
      });

      expect(mockReviewRepo.create).toHaveBeenCalledWith({
        productId: validProductId,
        userId: validUserId,
        orderId: validOrderId,
        rating: 5,
        title: 'Exquisite Artwork',
        body: 'The detailing on this mandala is mesmerizing. Truly mastercrafted!',
        status: 'APPROVED',
        isVerifiedPurchase: true,
      });

      expect(result.id).toBe(validReviewId);
      expect(result.isVerifiedPurchase).toBe(true);
    });

    it('translates Prisma P2002 conflict error to ConflictError', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(mockReviewRepo, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(mockReviewRepo, 'findEligiblePurchase').mockResolvedValue({ orderId: validOrderId });

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      });
      vi.spyOn(mockReviewRepo, 'create').mockRejectedValue(prismaError);

      await expect(
        service.createReview(validUserId, {
          productId: validProductId,
          rating: 5,
          body: 'Valid review text here',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  // --------------------------------------------------------------------------
  // 4. updateReview
  // --------------------------------------------------------------------------
  describe('updateReview', () => {
    it('throws NotFoundError when review does not exist (IDOR protection)', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue(null);

      await expect(service.updateReview(validUserId, validReviewId, { rating: 4 })).rejects.toThrow(
        NotFoundError
      );
    });

    it('throws NotFoundError when trying to edit another customer review (IDOR protection)', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue({
        ...mockReview,
        userId: otherUserId,
      });

      await expect(service.updateReview(validUserId, validReviewId, { rating: 4 })).rejects.toThrow(
        NotFoundError
      );
    });

    it('throws ValidationError when no fields provided for update', async () => {
      await expect(service.updateReview(validUserId, validReviewId, {})).rejects.toThrow(
        ValidationError
      );
    });

    it('successfully updates rating and body', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue(mockReview);
      vi.spyOn(mockReviewRepo, 'update').mockResolvedValue({
        ...mockReview,
        rating: 4,
        body: 'Updated review content that is long enough.',
      });

      const updated = await service.updateReview(validUserId, validReviewId, {
        rating: 4,
        body: 'Updated review content that is long enough.',
      });

      expect(updated.rating).toBe(4);
      expect(mockReviewRepo.update).toHaveBeenCalledWith(validReviewId, {
        rating: 4,
        body: 'Updated review content that is long enough.',
      });
    });
  });

  // --------------------------------------------------------------------------
  // 5. deleteReview
  // --------------------------------------------------------------------------
  describe('deleteReview', () => {
    it('throws NotFoundError when review belongs to someone else (IDOR protection)', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue({
        ...mockReview,
        userId: otherUserId,
      });

      await expect(service.deleteReview(validUserId, validReviewId)).rejects.toThrow(NotFoundError);
    });

    it('successfully deletes customer own review', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue(mockReview);
      vi.spyOn(mockReviewRepo, 'delete').mockResolvedValue({} as never);

      await expect(service.deleteReview(validUserId, validReviewId)).resolves.not.toThrow();
      expect(mockReviewRepo.delete).toHaveBeenCalledWith(validReviewId);
    });
  });

  // ==========================================================================
  // ADMIN REVIEW MODERATION TESTS
  // ==========================================================================

  const mockReviewWithDetails: ReviewWithDetails = {
    id: validReviewId,
    productId: validProductId,
    userId: validUserId,
    orderId: validOrderId,
    rating: 5,
    title: 'Divine Artwork',
    body: 'Truly sacred energy and vibrant colors.',
    status: 'PENDING',
    isVerifiedPurchase: true,
    createdAt: new Date('2026-01-10T10:00:00.000Z'),
    updatedAt: new Date('2026-01-10T10:00:00.000Z'),
    user: {
      id: validUserId,
      firstName: 'Aarav',
      lastName: 'Patel',
      email: 'aarav@mandala.test',
    },
    product: {
      id: validProductId,
      name: 'Sacred Lotus Mandala',
      slug: 'sacred-lotus-mandala',
      sku: 'MND-LOTUS-01',
    },
  };

  // --------------------------------------------------------------------------
  // 6. listAdminReviews
  // --------------------------------------------------------------------------
  describe('listAdminReviews', () => {
    it('returns paginated reviews mapped to AdminReviewDto', async () => {
      mockReviewRepo.findAdminReviews = vi.fn().mockResolvedValue({
        items: [mockReviewWithDetails],
        totalItems: 1,
      });

      const result = await service.listAdminReviews({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: validReviewId,
        productId: validProductId,
        product: {
          id: validProductId,
          name: 'Sacred Lotus Mandala',
          slug: 'sacred-lotus-mandala',
          sku: 'MND-LOTUS-01',
        },
        userId: validUserId,
        user: {
          id: validUserId,
          firstName: 'Aarav',
          lastName: 'Patel',
          email: 'aarav@mandala.test',
        },
        customer: {
          id: validUserId,
          firstName: 'Aarav',
          lastName: 'Patel',
          email: 'aarav@mandala.test',
        },
        orderId: validOrderId,
        rating: 5,
        title: 'Divine Artwork',
        body: 'Truly sacred energy and vibrant colors.',
        status: 'PENDING',
        isVerifiedPurchase: true,
        createdAt: '2026-01-10T10:00:00.000Z',
        updatedAt: '2026-01-10T10:00:00.000Z',
      });
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      });
    });

    it('passes validated filters and sorting options to repository', async () => {
      mockReviewRepo.findAdminReviews = vi.fn().mockResolvedValue({
        items: [],
        totalItems: 0,
      });

      const result = await service.listAdminReviews({
        page: '2',
        pageSize: '10',
        status: 'APPROVED',
        productId: validProductId,
        search: 'Lotus',
        sort: 'rating_desc',
      });

      expect(mockReviewRepo.findAdminReviews).toHaveBeenCalledWith(
        {
          status: 'APPROVED',
          productId: validProductId,
          search: 'Lotus',
        },
        {
          page: 2,
          pageSize: 10,
          sort: 'rating_desc',
        }
      );
      expect(result.pagination.totalPages).toBe(0);
    });

    it('throws ValidationError for invalid page number', async () => {
      await expect(service.listAdminReviews({ page: 0 })).rejects.toThrow(ValidationError);
      await expect(service.listAdminReviews({ page: 'abc' })).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid page size', async () => {
      await expect(service.listAdminReviews({ pageSize: 150 })).rejects.toThrow(ValidationError);
      await expect(service.listAdminReviews({ pageSize: 0 })).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid status filter', async () => {
      await expect(service.listAdminReviews({ status: 'INVALID_STATUS' })).rejects.toThrow(
        ValidationError
      );
    });

    it('throws ValidationError for invalid sort parameter', async () => {
      await expect(service.listAdminReviews({ sort: 'unsupported' })).rejects.toThrow(
        ValidationError
      );
    });
  });

  // --------------------------------------------------------------------------
  // 7. updateReviewStatusByAdmin
  // --------------------------------------------------------------------------
  describe('updateReviewStatusByAdmin', () => {
    it('throws ValidationError for invalid review ID format', async () => {
      await expect(
        service.updateReviewStatusByAdmin('not-a-uuid', { status: 'APPROVED' })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when status is missing', async () => {
      await expect(service.updateReviewStatusByAdmin(validReviewId, {})).rejects.toThrow(
        ValidationError
      );
    });

    it('throws ValidationError when invalid status is provided', async () => {
      await expect(
        service.updateReviewStatusByAdmin(validReviewId, { status: 'UNKNOWN' })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when extra writable fields are passed', async () => {
      await expect(
        service.updateReviewStatusByAdmin(validReviewId, {
          status: 'APPROVED',
          rating: 5,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when review does not exist', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue(null);

      await expect(
        service.updateReviewStatusByAdmin(validReviewId, { status: 'APPROVED' })
      ).rejects.toThrow(NotFoundError);
    });

    it('successfully updates review status to APPROVED', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue(mockReview);
      mockReviewRepo.updateStatus = vi.fn().mockResolvedValue({
        ...mockReviewWithDetails,
        status: 'APPROVED',
      });

      const result = await service.updateReviewStatusByAdmin(validReviewId, {
        status: 'APPROVED',
      });

      expect(result.status).toBe('APPROVED');
      expect(mockReviewRepo.updateStatus).toHaveBeenCalledWith(validReviewId, 'APPROVED');
    });

    it('successfully updates review status to REJECTED', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue(mockReview);
      mockReviewRepo.updateStatus = vi.fn().mockResolvedValue({
        ...mockReviewWithDetails,
        status: 'REJECTED',
      });

      const result = await service.updateReviewStatusByAdmin(validReviewId, {
        status: 'REJECTED',
      });

      expect(result.status).toBe('REJECTED');
      expect(mockReviewRepo.updateStatus).toHaveBeenCalledWith(validReviewId, 'REJECTED');
    });

    it('successfully updates review status back to PENDING', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue(mockReview);
      mockReviewRepo.updateStatus = vi.fn().mockResolvedValue({
        ...mockReviewWithDetails,
        status: 'PENDING',
      });

      const result = await service.updateReviewStatusByAdmin(validReviewId, {
        status: 'PENDING',
      });

      expect(result.status).toBe('PENDING');
      expect(mockReviewRepo.updateStatus).toHaveBeenCalledWith(validReviewId, 'PENDING');
    });
  });

  // --------------------------------------------------------------------------
  // 8. deleteReviewByAdmin
  // --------------------------------------------------------------------------
  describe('deleteReviewByAdmin', () => {
    it('throws ValidationError for invalid review ID format', async () => {
      await expect(service.deleteReviewByAdmin('not-a-uuid')).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when review does not exist', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue(null);

      await expect(service.deleteReviewByAdmin(validReviewId)).rejects.toThrow(NotFoundError);
    });

    it('successfully deletes review by admin regardless of user ownership', async () => {
      vi.spyOn(mockReviewRepo, 'findById').mockResolvedValue({
        ...mockReview,
        userId: otherUserId,
      });
      vi.spyOn(mockReviewRepo, 'delete').mockResolvedValue({} as never);

      await expect(service.deleteReviewByAdmin(validReviewId)).resolves.not.toThrow();
      expect(mockReviewRepo.delete).toHaveBeenCalledWith(validReviewId);
    });
  });
});
