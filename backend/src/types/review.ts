import type { PaginationMeta } from './catalog';

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
  averageRating: number; // e.g. 4.8, or 0 if no reviews
  totalReviews: number;
  distribution: RatingDistributionDto;
}

export interface ReviewListResponseData {
  reviews: ReviewDto[];
  summary: RatingSummaryDto;
}

export interface CreateReviewInput {
  productId: string;
  rating: number; // integer 1-5
  title?: string | null;
  body?: string | null;
}

export interface UpdateReviewInput {
  rating?: number; // integer 1-5
  title?: string | null;
  body?: string | null;
}

export interface ReviewEligibilityDto {
  isEligible: boolean;
  hasReviewed: boolean;
  existingReview?: ReviewDto | null;
  reason?: string;
}

// ============================================================================
// ADMIN REVIEW MODERATION TYPES
// ============================================================================

export interface AdminReviewProductDto {
  id: string;
  name: string;
  slug: string;
  sku: string;
}

export interface AdminReviewCustomerDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AdminReviewDto {
  id: string;
  productId: string;
  product: AdminReviewProductDto;
  userId: string;
  user: AdminReviewCustomerDto;
  customer: AdminReviewCustomerDto;
  orderId: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatusType;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewFilters {
  status?: ReviewStatusType;
  productId?: string;
  search?: string;
}

export type AdminReviewSortOption = 'newest' | 'oldest' | 'rating_asc' | 'rating_desc';

export interface AdminReviewListOptions {
  page: number;
  pageSize: number;
  sort?: AdminReviewSortOption;
}

export interface PaginatedAdminReviewsResponse {
  items: AdminReviewDto[];
  pagination: PaginationMeta;
}

export interface UpdateReviewStatusInput {
  status: ReviewStatusType;
}
