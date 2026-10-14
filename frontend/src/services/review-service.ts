import { apiGet, apiPost, apiPut, apiDelete } from './api-client';
import type {
  ApiSuccessResponse,
  ReviewDto,
  ReviewListResponseData,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewEligibilityDto,
} from '@/types';

/**
 * Fetches public approved reviews and rating summary for a product.
 */
export async function fetchProductReviews(productId: string): Promise<ReviewListResponseData> {
  const response = await apiGet<ApiSuccessResponse<ReviewListResponseData>>(
    `reviews/product/${productId}`
  );
  return response.data;
}

/**
 * Checks whether the authenticated patron is eligible to review the product.
 */
export async function checkReviewEligibility(productId: string): Promise<ReviewEligibilityDto> {
  const response = await apiGet<ApiSuccessResponse<ReviewEligibilityDto>>(
    `reviews/eligibility/${productId}`
  );
  return response.data;
}

/**
 * Submits a new review for a product by an eligible verified purchaser.
 */
export async function createReview(input: CreateReviewInput): Promise<ReviewDto> {
  const response = await apiPost<ApiSuccessResponse<ReviewDto>>('reviews', input);
  return response.data;
}

/**
 * Updates an existing review owned by the authenticated customer.
 */
export async function updateReview(reviewId: string, input: UpdateReviewInput): Promise<ReviewDto> {
  const response = await apiPut<ApiSuccessResponse<ReviewDto>>(`reviews/${reviewId}`, input);
  return response.data;
}

/**
 * Deletes an existing review owned by the authenticated customer.
 */
export async function deleteReview(reviewId: string): Promise<void> {
  await apiDelete<{ success: true; message: string }>(`reviews/${reviewId}`);
}
