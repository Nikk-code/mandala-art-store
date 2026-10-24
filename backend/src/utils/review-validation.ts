import { ReviewStatus } from '@prisma/client';
import { ValidationError } from '../errors';
import type {
  CreateReviewInput,
  UpdateReviewInput,
  AdminReviewFilters,
  AdminReviewListOptions,
  AdminReviewSortOption,
} from '../types/review';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_REVIEW_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED']);
const VALID_SORT_OPTIONS = new Set(['newest', 'oldest', 'rating_asc', 'rating_desc']);

export function validateProductId(productId: unknown): string {
  if (typeof productId !== 'string' || !productId.trim()) {
    throw new ValidationError('Product ID is required');
  }

  const trimmed = productId.trim();
  if (!UUID_REGEX.test(trimmed)) {
    throw new ValidationError('Invalid product ID format. Must be a valid UUID');
  }

  return trimmed;
}

export function validateReviewId(reviewId: unknown): string {
  if (typeof reviewId !== 'string' || !reviewId.trim()) {
    throw new ValidationError('Review ID is required');
  }

  const trimmed = reviewId.trim();
  if (!UUID_REGEX.test(trimmed)) {
    throw new ValidationError('Invalid review ID format. Must be a valid UUID');
  }

  return trimmed;
}

export function validateRating(rating: unknown): number {
  if (typeof rating !== 'number' || !Number.isInteger(rating) || Number.isNaN(rating)) {
    throw new ValidationError('Rating must be an integer between 1 and 5');
  }

  if (rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }

  return rating;
}

export function validateReviewTitle(title: unknown): string | null {
  if (title === null || title === undefined) {
    return null;
  }

  if (typeof title !== 'string') {
    throw new ValidationError('Review title must be a string');
  }

  const trimmed = title.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > 200) {
    throw new ValidationError('Review title cannot exceed 200 characters');
  }

  return trimmed;
}

export function validateReviewBody(body: unknown, isRequired = false): string | null {
  if (body === null || body === undefined) {
    if (isRequired) {
      throw new ValidationError('Review text is required');
    }
    return null;
  }

  if (typeof body !== 'string') {
    throw new ValidationError('Review text must be a string');
  }

  const trimmed = body.trim();
  if (!trimmed) {
    if (isRequired) {
      throw new ValidationError('Review text cannot be empty');
    }
    return null;
  }

  if (trimmed.length < 5) {
    throw new ValidationError('Review text must be at least 5 characters long');
  }

  if (trimmed.length > 2000) {
    throw new ValidationError('Review text cannot exceed 2000 characters');
  }

  return trimmed;
}

export function validateCreateReviewInput(input: unknown): CreateReviewInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Request body must be a JSON object');
  }

  const payload = input as Record<string, unknown>;

  const productId = validateProductId(payload.productId);
  const rating = validateRating(payload.rating);
  const title = validateReviewTitle(payload.title);
  const body = validateReviewBody(payload.body, true);

  return {
    productId,
    rating,
    title,
    body,
  };
}

export function validateUpdateReviewInput(input: unknown): UpdateReviewInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Request body must be a JSON object');
  }

  const payload = input as Record<string, unknown>;

  const hasRating = payload.rating !== undefined;
  const hasTitle = payload.title !== undefined;
  const hasBody = payload.body !== undefined;

  if (!hasRating && !hasTitle && !hasBody) {
    throw new ValidationError(
      'At least one field (rating, title, or body) must be provided for update'
    );
  }

  const rating = hasRating ? validateRating(payload.rating) : undefined;
  const title = hasTitle ? validateReviewTitle(payload.title) : undefined;
  const body = hasBody ? validateReviewBody(payload.body, true) : undefined;

  return {
    ...(rating !== undefined ? { rating } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(body !== undefined ? { body } : {}),
  };
}

// ============================================================================
// ADMIN REVIEW MODERATION VALIDATION
// ============================================================================

export function validateReviewStatus(status: unknown): ReviewStatus {
  if (typeof status !== 'string' || !VALID_REVIEW_STATUSES.has(status)) {
    throw new ValidationError(
      'Invalid review status. Allowed values: PENDING, APPROVED, REJECTED.'
    );
  }
  return status as ReviewStatus;
}

export function validateUpdateReviewStatusInput(input: unknown): { status: ReviewStatus } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const payload = input as Record<string, unknown>;
  const keys = Object.keys(payload);

  if (!keys.includes('status') || payload.status === undefined || payload.status === null) {
    throw new ValidationError('Field "status" is required.');
  }

  const extraKeys = keys.filter(k => k !== 'status');
  if (extraKeys.length > 0) {
    throw new ValidationError(
      `Unexpected fields: ${extraKeys.join(', ')}. Only "status" can be updated.`
    );
  }

  const status = validateReviewStatus(payload.status);
  return { status };
}

export function validateAdminReviewQuery(rawQuery: Record<string, unknown>): {
  filters: AdminReviewFilters;
  options: AdminReviewListOptions;
} {
  // Page Validation
  let page = 1;
  if (rawQuery.page !== undefined && rawQuery.page !== null && rawQuery.page !== '') {
    const parsedPage = Number(rawQuery.page);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new ValidationError(
        'Query parameter "page" must be an integer greater than or equal to 1.'
      );
    }
    page = parsedPage;
  }

  // PageSize Validation
  let pageSize = 20;
  if (rawQuery.pageSize !== undefined && rawQuery.pageSize !== null && rawQuery.pageSize !== '') {
    const parsedPageSize = Number(rawQuery.pageSize);
    if (!Number.isInteger(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
      throw new ValidationError('Query parameter "pageSize" must be an integer between 1 and 100.');
    }
    pageSize = parsedPageSize;
  }

  // Status Filter Validation
  let status: ReviewStatus | undefined;
  if (rawQuery.status !== undefined && rawQuery.status !== null && rawQuery.status !== '') {
    if (typeof rawQuery.status !== 'string' || !VALID_REVIEW_STATUSES.has(rawQuery.status)) {
      throw new ValidationError(
        'Invalid status filter. Allowed values: PENDING, APPROVED, REJECTED.'
      );
    }
    status = rawQuery.status as ReviewStatus;
  }

  // Product ID Filter Validation
  let productId: string | undefined;
  if (
    rawQuery.productId !== undefined &&
    rawQuery.productId !== null &&
    rawQuery.productId !== ''
  ) {
    productId = validateProductId(rawQuery.productId);
  }

  // Search Filter Validation
  let search: string | undefined;
  if (typeof rawQuery.search === 'string') {
    const trimmed = rawQuery.search.trim();
    if (trimmed.length > 100) {
      throw new ValidationError('Search query must not exceed 100 characters.');
    }
    if (trimmed.length > 0) {
      search = trimmed;
    }
  }

  // Sort Option Validation
  let sort: AdminReviewSortOption = 'newest';
  if (rawQuery.sort !== undefined && rawQuery.sort !== null && rawQuery.sort !== '') {
    if (typeof rawQuery.sort !== 'string' || !VALID_SORT_OPTIONS.has(rawQuery.sort)) {
      throw new ValidationError(
        `Invalid sort parameter. Allowed values: ${Array.from(VALID_SORT_OPTIONS).join(', ')}.`
      );
    }
    sort = rawQuery.sort as AdminReviewSortOption;
  }

  return {
    filters: {
      ...(status ? { status } : {}),
      ...(productId ? { productId } : {}),
      ...(search ? { search } : {}),
    },
    options: {
      page,
      pageSize,
      sort,
    },
  };
}
