import { ValidationError } from '../errors';
import type { CreateReviewInput, UpdateReviewInput } from '../types/review';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
