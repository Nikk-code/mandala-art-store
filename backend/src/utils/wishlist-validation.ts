import { ValidationError } from '../errors';
import type { AddWishlistItemInput } from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateProductId(id: unknown): string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
    throw new ValidationError('Invalid product ID format.');
  }
  return id.trim();
}

export function validateAddWishlistInput(input: unknown): AddWishlistItemInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Product ID is required.');
  }

  const raw = input as Partial<AddWishlistItemInput>;

  if (!raw.productId) {
    throw new ValidationError('Product ID is required.');
  }

  return {
    productId: validateProductId(raw.productId),
  };
}
