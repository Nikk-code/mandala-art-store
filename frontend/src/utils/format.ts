import type { ProductAvailability } from '@/types';
import type { BadgeVariant } from '@/components/ui';

/**
 * Format price in integer paise to INR currency string (e.g. 149900 -> ₹1,499)
 * Avoids floating-point arithmetic errors.
 */
export function formatPrice(priceInPaise: number): string {
  if (!Number.isFinite(priceInPaise) || priceInPaise < 0) {
    return '₹0';
  }

  const integerPaise = Math.round(priceInPaise);
  const rupees = Math.floor(integerPaise / 100);
  const remainderPaise = integerPaise % 100;

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: remainderPaise === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const numericValue = remainderPaise === 0 ? rupees : rupees + remainderPaise / 100;
  return formatter.format(numericValue);
}

/**
 * Maps backend product availability enum to user-friendly label and badge variant
 */
export function getAvailabilityInfo(availability: ProductAvailability | string): {
  label: string;
  badgeVariant: BadgeVariant;
  isAvailable: boolean;
} {
  switch (availability) {
    case 'IN_STOCK':
      return {
        label: 'In Stock',
        badgeVariant: 'success',
        isAvailable: true,
      };
    case 'MADE_TO_ORDER':
      return {
        label: 'Made to Order',
        badgeVariant: 'ochre',
        isAvailable: true,
      };
    case 'SOLD_OUT':
      return {
        label: 'Sold Out',
        badgeVariant: 'stone',
        isAvailable: false,
      };
    default:
      return {
        label: availability,
        badgeVariant: 'stone',
        isAvailable: false,
      };
  }
}
