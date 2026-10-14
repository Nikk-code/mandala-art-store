import { ValidationError } from '../errors';
import { ProductAvailability } from '@prisma/client';

export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new ValidationError('Text is required to generate a slug');
  }

  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric except space & hyphen
    .replace(/\s+/g, '-') // collapse whitespace to dashes
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes

  if (!slug) {
    throw new ValidationError('Failed to generate valid slug from given text');
  }

  return slug;
}

export function validateSlug(slug: string, maxLength = 220): string {
  if (!slug || typeof slug !== 'string') {
    throw new ValidationError('Slug is required');
  }

  const trimmed = slug.trim();
  if (trimmed.length < 2 || trimmed.length > maxLength) {
    throw new ValidationError(`Slug length must be between 2 and ${maxLength} characters`);
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(trimmed)) {
    throw new ValidationError(
      'Slug format is invalid. It must contain only lowercase letters, numbers, and hyphens without consecutive or leading/trailing hyphens'
    );
  }

  return trimmed;
}

export function validateSku(sku: string): string {
  if (!sku || typeof sku !== 'string') {
    throw new ValidationError('SKU is required');
  }

  const formatted = sku.trim().toUpperCase();
  if (formatted.length < 2 || formatted.length > 50) {
    throw new ValidationError('SKU length must be between 2 and 50 characters');
  }

  const skuRegex = /^[A-Z0-9_-]+$/;
  if (!skuRegex.test(formatted)) {
    throw new ValidationError(
      'SKU format is invalid. It must contain only alphanumeric characters, underscores, and hyphens'
    );
  }

  return formatted;
}

export function validatePriceInPaise(price: unknown, fieldName = 'Price'): number {
  if (typeof price !== 'number' || !Number.isInteger(price) || price < 0) {
    throw new ValidationError(
      `${fieldName} must be a valid non-negative integer representing paise`
    );
  }

  return price;
}

export function validateStockQuantity(stock: unknown): number {
  if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
    throw new ValidationError('Stock quantity must be a valid non-negative integer');
  }

  return stock;
}

export function validateAvailability(availability: unknown): ProductAvailability {
  if (
    typeof availability !== 'string' ||
    !Object.values(ProductAvailability).includes(availability as ProductAvailability)
  ) {
    throw new ValidationError(
      `Invalid product availability status. Must be one of: ${Object.values(ProductAvailability).join(', ')}`
    );
  }

  return availability as ProductAvailability;
}

export function validateCategoryName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Category name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    throw new ValidationError('Category name must be between 2 and 100 characters');
  }

  return trimmed;
}

export function validateProductName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Product name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 200) {
    throw new ValidationError('Product name must be between 2 and 200 characters');
  }

  return trimmed;
}

export function validateImageUrl(url: unknown, fieldName = 'Image URL'): string {
  if (!url || typeof url !== 'string') {
    throw new ValidationError(`${fieldName} is required`);
  }

  const trimmed = url.trim();
  if (trimmed.length < 5 || trimmed.length > 500) {
    throw new ValidationError(`${fieldName} must be between 5 and 500 characters`);
  }

  // Allow root-relative paths like /images/lotus.jpg or valid http/https URLs
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || trimmed.includes('\\')) {
      throw new ValidationError(`${fieldName} contains invalid format`);
    }
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new ValidationError(`${fieldName} must use HTTP or HTTPS protocol`);
    }
    if (!parsed.hostname || parsed.hostname.includes(' ')) {
      throw new ValidationError(`${fieldName} must contain a valid domain`);
    }
  } catch {
    throw new ValidationError(`${fieldName} must be a valid URL`);
  }

  return trimmed;
}

export function validateOptionalImageUrl(url: unknown, fieldName = 'Image URL'): string | null {
  if (url === undefined || url === null || url === '') {
    return null;
  }
  return validateImageUrl(url, fieldName);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUuid(id: unknown, fieldName = 'ID'): string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
    throw new ValidationError(`Invalid ${fieldName} format.`);
  }
  return id.trim();
}
