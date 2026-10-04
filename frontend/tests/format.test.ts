import { describe, it, expect } from 'vitest';
import { formatPrice, getAvailabilityInfo } from '@/utils/format';

describe('Price and Availability Formatting Utilities', () => {
  describe('formatPrice', () => {
    it('formats whole rupee amounts without decimal points in Indian numbering format', () => {
      // 149900 paise = 1,499 INR
      const formatted = formatPrice(149900);
      expect(formatted).toContain('1,499');
      expect(formatted).toContain('₹');
    });

    it('formats large values with Indian comma grouping (lakhs/thousands)', () => {
      // 12500000 paise = 1,25,000 INR
      const formatted = formatPrice(12500000);
      expect(formatted).toContain('1,25,000');
    });

    it('formats fractional paise amounts with two decimal places', () => {
      // 149950 paise = 1,499.50 INR
      const formatted = formatPrice(149950);
      expect(formatted).toContain('1,499.5');
    });

    it('handles zero and negative or invalid numbers safely', () => {
      expect(formatPrice(0)).toContain('0');
      expect(formatPrice(-500)).toBe('₹0');
      expect(formatPrice(NaN)).toBe('₹0');
    });
  });

  describe('getAvailabilityInfo', () => {
    it('returns In Stock for IN_STOCK', () => {
      const info = getAvailabilityInfo('IN_STOCK');
      expect(info.label).toBe('In Stock');
      expect(info.badgeVariant).toBe('success');
      expect(info.isAvailable).toBe(true);
    });

    it('returns Made to Order for MADE_TO_ORDER', () => {
      const info = getAvailabilityInfo('MADE_TO_ORDER');
      expect(info.label).toBe('Made to Order');
      expect(info.badgeVariant).toBe('ochre');
      expect(info.isAvailable).toBe(true);
    });

    it('returns Sold Out for SOLD_OUT', () => {
      const info = getAvailabilityInfo('SOLD_OUT');
      expect(info.label).toBe('Sold Out');
      expect(info.badgeVariant).toBe('stone');
      expect(info.isAvailable).toBe(false);
    });

    it('handles unexpected availability values gracefully', () => {
      const info = getAvailabilityInfo('BACKORDER');
      expect(info.label).toBe('BACKORDER');
      expect(info.badgeVariant).toBe('stone');
    });
  });
});
