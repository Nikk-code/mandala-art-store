import { Prisma } from '@prisma/client';
import {
  reviewRepository,
  type ReviewRepository,
  type ReviewWithAuthor,
  type ReviewWithDetails,
} from '../repositories/review.repository';
import { productRepository, type ProductRepository } from '../repositories/product.repository';
import { NotFoundError, ConflictError, ForbiddenError } from '../errors';
import {
  validateProductId,
  validateReviewId,
  validateCreateReviewInput,
  validateUpdateReviewInput,
  validateAdminReviewQuery,
  validateUpdateReviewStatusInput,
} from '../utils/review-validation';
import type {
  ReviewDto,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewListResponseData,
  ReviewEligibilityDto,
  AdminReviewDto,
  PaginatedAdminReviewsResponse,
} from '../types/review';

export class ReviewService {
  constructor(
    private readonly repo: ReviewRepository = reviewRepository,
    private readonly prodRepo: ProductRepository = productRepository
  ) {}

  private mapToDto(review: ReviewWithAuthor): ReviewDto {
    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      user: {
        id: review.user.id,
        firstName: review.user.firstName,
        lastName: review.user.lastName,
      },
      orderId: review.orderId,
      rating: review.rating,
      title: review.title,
      body: review.body,
      status: review.status,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }

  private mapToAdminDto(review: ReviewWithDetails): AdminReviewDto {
    const customerInfo = {
      id: review.user.id,
      firstName: review.user.firstName,
      lastName: review.user.lastName,
      email: review.user.email,
    };

    return {
      id: review.id,
      productId: review.productId,
      product: {
        id: review.product.id,
        name: review.product.name,
        slug: review.product.slug,
        sku: review.product.sku,
      },
      userId: review.userId,
      user: customerInfo,
      customer: customerInfo,
      orderId: review.orderId,
      rating: review.rating,
      title: review.title,
      body: review.body,
      status: review.status,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves public approved reviews and rating summary for an active product.
   */
  async getProductReviews(productId: string): Promise<ReviewListResponseData> {
    const validProductId = validateProductId(productId);

    const product = await this.prodRepo.findById(validProductId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found');
    }

    const [reviews, summary] = await Promise.all([
      this.repo.findByProductId(validProductId, 'APPROVED'),
      this.repo.getRatingSummary(validProductId),
    ]);

    return {
      reviews: reviews.map(r => this.mapToDto(r)),
      summary,
    };
  }

  /**
   * Checks whether the authenticated customer is eligible to review a product.
   */
  async checkEligibility(userId: string, productId: string): Promise<ReviewEligibilityDto> {
    const validProductId = validateProductId(productId);

    const product = await this.prodRepo.findById(validProductId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found');
    }

    const [existingReview, purchase] = await Promise.all([
      this.repo.findByUserAndProduct(userId, validProductId),
      this.repo.findEligiblePurchase(userId, validProductId),
    ]);

    const hasReviewed = existingReview !== null;
    const isEligible = purchase !== null;

    return {
      isEligible,
      hasReviewed,
      existingReview: existingReview ? this.mapToDto(existingReview) : null,
      reason: !isEligible
        ? 'Only verified purchasers who have ordered this artwork can leave a review.'
        : undefined,
    };
  }

  /**
   * Creates a verified review for a product.
   */
  async createReview(userId: string, input: CreateReviewInput): Promise<ReviewDto> {
    const validated = validateCreateReviewInput(input);

    const product = await this.prodRepo.findById(validated.productId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found');
    }

    // Check if customer already submitted a review
    const existingReview = await this.repo.findByUserAndProduct(userId, validated.productId);
    if (existingReview) {
      throw new ConflictError('You have already submitted a review for this product.');
    }

    // Check verified purchase eligibility from authoritative backend order records
    const purchase = await this.repo.findEligiblePurchase(userId, validated.productId);
    if (!purchase) {
      throw new ForbiddenError(
        'Only customers who have purchased this product can leave a review.'
      );
    }

    try {
      const review = await this.repo.create({
        productId: validated.productId,
        userId,
        orderId: purchase.orderId,
        rating: validated.rating,
        title: validated.title,
        body: validated.body,
        status: 'APPROVED',
        isVerifiedPurchase: true,
      });

      return this.mapToDto(review);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('You have already submitted a review for this product.');
      }
      throw error;
    }
  }

  /**
   * Updates an existing review belonging to the authenticated customer.
   */
  async updateReview(
    userId: string,
    reviewId: string,
    input: UpdateReviewInput
  ): Promise<ReviewDto> {
    const validReviewId = validateReviewId(reviewId);
    const validated = validateUpdateReviewInput(input);

    const review = await this.repo.findById(validReviewId);
    if (!review || review.userId !== userId) {
      throw new NotFoundError('Review not found.');
    }

    const updated = await this.repo.update(validReviewId, validated);
    return this.mapToDto(updated);
  }

  /**
   * Deletes an existing review belonging to the authenticated customer.
   */
  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const validReviewId = validateReviewId(reviewId);

    const review = await this.repo.findById(validReviewId);
    if (!review || review.userId !== userId) {
      throw new NotFoundError('Review not found.');
    }

    await this.repo.delete(validReviewId);
  }

  // ============================================================================
  // ADMIN REVIEW MODERATION
  // ============================================================================

  /**
   * Lists reviews for administrator moderation with filtering and pagination.
   */
  async listAdminReviews(
    rawQuery: Record<string, unknown>
  ): Promise<PaginatedAdminReviewsResponse> {
    const { filters, options } = validateAdminReviewQuery(rawQuery);
    const { items, totalItems } = await this.repo.findAdminReviews(filters, options);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / options.pageSize);

    return {
      items: items.map(item => this.mapToAdminDto(item)),
      pagination: {
        page: options.page,
        pageSize: options.pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  /**
   * Updates moderation status (PENDING, APPROVED, REJECTED) of a review by admin.
   */
  async updateReviewStatusByAdmin(id: string, rawInput: unknown): Promise<AdminReviewDto> {
    const validReviewId = validateReviewId(id);
    const { status } = validateUpdateReviewStatusInput(rawInput);

    const existing = await this.repo.findById(validReviewId);
    if (!existing) {
      throw new NotFoundError('Review not found.');
    }

    const updated = await this.repo.updateStatus(validReviewId, status);
    return this.mapToAdminDto(updated);
  }

  /**
   * Authoritatively deletes a review by admin.
   */
  async deleteReviewByAdmin(id: string): Promise<void> {
    const validReviewId = validateReviewId(id);

    const existing = await this.repo.findById(validReviewId);
    if (!existing) {
      throw new NotFoundError('Review not found.');
    }

    await this.repo.delete(validReviewId);
  }
}

export const reviewService = new ReviewService();
