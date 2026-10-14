import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
} from '../src/services/review-service';
import * as apiClient from '../src/services/api-client';
import type { ReviewDto, ReviewListResponseData, ReviewEligibilityDto } from '../src/types';

describe('Review Service (frontend/src/services/review-service.ts)', () => {
  const sampleProductId = '11111111-1111-4111-8111-111111111111';
  const sampleReviewId = '22222222-2222-4222-8222-222222222222';

  const mockReview: ReviewDto = {
    id: sampleReviewId,
    productId: sampleProductId,
    userId: 'user-1',
    user: {
      id: 'user-1',
      firstName: 'Aarav',
      lastName: 'Patel',
    },
    orderId: 'order-1',
    rating: 5,
    title: 'Great mandala',
    body: 'Mesmerizing spiritual geometry.',
    status: 'APPROVED',
    isVerifiedPurchase: true,
    createdAt: '2026-10-10T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  };

  const mockReviewData: ReviewListResponseData = {
    reviews: [mockReview],
    summary: {
      averageRating: 5.0,
      totalReviews: 1,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchProductReviews calls GET /reviews/product/:productId and unwraps data', async () => {
    vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: mockReviewData,
    });

    const result = await fetchProductReviews(sampleProductId);

    expect(apiClient.apiGet).toHaveBeenCalledWith(`reviews/product/${sampleProductId}`);
    expect(result.reviews).toHaveLength(1);
    expect(result.summary.averageRating).toBe(5.0);
  });

  it('checkReviewEligibility calls GET /reviews/eligibility/:productId', async () => {
    const mockEligibility: ReviewEligibilityDto = {
      isEligible: true,
      hasReviewed: false,
      existingReview: null,
    };

    vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: mockEligibility,
    });

    const result = await checkReviewEligibility(sampleProductId);

    expect(apiClient.apiGet).toHaveBeenCalledWith(`reviews/eligibility/${sampleProductId}`);
    expect(result.isEligible).toBe(true);
  });

  it('createReview calls POST /reviews with input payload', async () => {
    vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
      success: true,
      data: mockReview,
    });

    const input = {
      productId: sampleProductId,
      rating: 5,
      title: 'Great mandala',
      body: 'Mesmerizing spiritual geometry.',
    };

    const result = await createReview(input);

    expect(apiClient.apiPost).toHaveBeenCalledWith('reviews', input);
    expect(result.id).toBe(sampleReviewId);
  });

  it('updateReview calls PUT /reviews/:reviewId with input payload', async () => {
    vi.spyOn(apiClient, 'apiPut').mockResolvedValue({
      success: true,
      data: { ...mockReview, rating: 4 },
    });

    const input = { rating: 4, body: 'Updated comments after one month.' };
    const result = await updateReview(sampleReviewId, input);

    expect(apiClient.apiPut).toHaveBeenCalledWith(`reviews/${sampleReviewId}`, input);
    expect(result.rating).toBe(4);
  });

  it('deleteReview calls DELETE /reviews/:reviewId', async () => {
    vi.spyOn(apiClient, 'apiDelete').mockResolvedValue({
      success: true,
      message: 'Review deleted successfully.',
    });

    await deleteReview(sampleReviewId);

    expect(apiClient.apiDelete).toHaveBeenCalledWith(`reviews/${sampleReviewId}`);
  });
});
