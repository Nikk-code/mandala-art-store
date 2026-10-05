import crypto from 'crypto';

/**
 * Generates a unique, customer-facing order number.
 * Format: MAT-YYYYMMDD-XXXXXX (e.g. MAT-20261005-7F2A9C)
 */
export function generateOrderNumber(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `MAT-${dateStr}-${randomPart}`;
}
