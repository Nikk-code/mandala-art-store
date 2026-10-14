export type ReviewStatusType = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReviewAuthorDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ReviewDto {
  id: string;
  productId: string;
  userId: string;
  user: ReviewAuthorDto;
  orderId: string | null;
  rating: number; // 1 to 5
  title: string | null;
  body: string | null;
  status: ReviewStatusType;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RatingDistributionDto {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface RatingSummaryDto {
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistributionDto;
}

export interface ReviewListResponseData {
  reviews: ReviewDto[];
  summary: RatingSummaryDto;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title?: string | null;
  body?: string | null;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string | null;
  body?: string | null;
}

export interface ReviewEligibilityDto {
  isEligible: boolean;
  hasReviewed: boolean;
  existingReview?: ReviewDto | null;
  reason?: string;
}
