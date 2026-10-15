import { describe, it, expect } from 'vitest';
import { DiscountType } from '@prisma/client';
import {
  normalizeCouponCode,
  calculateDiscountAmount,
  validateCouponEligibility,
  validateCreateCouponInput,
  validateUpdateCouponInput,
} from '../src/utils/coupon-validation';
import { ValidationError, BadRequestError } from '../src/errors';

describe('Coupon Validation & Calculation Utilities', () => {
  describe('normalizeCouponCode', () => {
    it('normalizes coupon code by trimming and converting to uppercase', () => {
      expect(normalizeCouponCode('  diwali2026  ')).toBe('DIWALI2026');
      expect(normalizeCouponCode('art-love-10')).toBe('ART-LOVE-10');
      expect(normalizeCouponCode('WELCOME_50')).toBe('WELCOME_50');
    });

    it('rejects non-string inputs', () => {
      expect(() => normalizeCouponCode(null)).toThrow(ValidationError);
      expect(() => normalizeCouponCode(123)).toThrow(ValidationError);
      expect(() => normalizeCouponCode(undefined)).toThrow(ValidationError);
    });

    it('rejects codes shorter than 3 or longer than 50 characters', () => {
      expect(() => normalizeCouponCode('AB')).toThrow(ValidationError);
      expect(() => normalizeCouponCode('A'.repeat(51))).toThrow(ValidationError);
    });

    it('rejects codes with invalid characters (spaces, special punctuation)', () => {
      expect(() => normalizeCouponCode('SAVE 10')).toThrow(ValidationError);
      expect(() => normalizeCouponCode('SAVE@10')).toThrow(ValidationError);
      expect(() => normalizeCouponCode('SAVE#10')).toThrow(ValidationError);
    });
  });

  describe('calculateDiscountAmount', () => {
    describe('Percentage Discounts', () => {
      it('calculates percentage discount rounded to nearest integer paise (round-half-up)', () => {
        // ₹1,499.00 = 149900 paise. 10% = 14990 paise (₹149.90)
        const discount1 = calculateDiscountAmount(149900, {
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
        });
        expect(discount1).toBe(14990);

        // Subtotal = 14995 paise. 15% = 2249.25 paise -> rounds to 2249 paise
        const discount2 = calculateDiscountAmount(14995, {
          discountType: DiscountType.PERCENTAGE,
          discountValue: 15,
        });
        expect(discount2).toBe(2249);

        // Subtotal = 1001 paise. 5% = 50.05 paise -> rounds to 50 paise
        const discount3 = calculateDiscountAmount(1001, {
          discountType: DiscountType.PERCENTAGE,
          discountValue: 5,
        });
        expect(discount3).toBe(50);
      });

      it('caps percentage discount at maxDiscountAmount if configured', () => {
        // Subtotal = ₹10,000 (1000000 paise). 20% = ₹2,000 (200000 paise). Cap = ₹500 (50000 paise)
        const discount = calculateDiscountAmount(1000000, {
          discountType: DiscountType.PERCENTAGE,
          discountValue: 20,
          maxDiscountAmount: 50000,
        });
        expect(discount).toBe(50000);
      });

      it('does not cap if calculated discount is below maxDiscountAmount', () => {
        // Subtotal = ₹1,000 (100000 paise). 10% = ₹100 (10000 paise). Cap = ₹500 (50000 paise)
        const discount = calculateDiscountAmount(1000000, {
          discountType: DiscountType.PERCENTAGE,
          discountValue: 2,
          maxDiscountAmount: 50000,
        });
        expect(discount).toBe(20000); // ₹200 < ₹500
      });
    });

    describe('Fixed Amount Discounts', () => {
      it('returns the exact fixed discount in integer paise', () => {
        const discount = calculateDiscountAmount(149900, {
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 20000, // ₹200.00
        });
        expect(discount).toBe(20000);
      });

      it('caps fixed discount so payable total is at least 100 paise (₹1.00) for Razorpay minimum floor', () => {
        // Subtotal = ₹500 (50000 paise). Coupon = ₹500 off (50000 paise).
        // Must leave at least 100 paise payable!
        const discount = calculateDiscountAmount(50000, {
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 50000,
        });
        expect(discount).toBe(49900); // 50000 - 100 = 49900
        expect(50000 - discount).toBe(100); // Exactly ₹1.00
      });

      it('caps fixed discount exceeding subtotal so payable total is 100 paise', () => {
        // Subtotal = ₹300 (30000 paise). Coupon = ₹1,000 off (100000 paise).
        const discount = calculateDiscountAmount(30000, {
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 100000,
        });
        expect(discount).toBe(29900);
        expect(30000 - discount).toBe(100);
      });

      it('returns 0 discount if subtotal is already <= 100 paise', () => {
        const discount = calculateDiscountAmount(100, {
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 5000,
        });
        expect(discount).toBe(0);
      });
    });
  });

  describe('validateCouponEligibility', () => {
    const validFrom = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

    it('passes for an active coupon within valid date window and meeting min order amount', () => {
      expect(() =>
        validateCouponEligibility(
          {
            code: 'VALID10',
            isActive: true,
            validFrom,
            validUntil,
            minOrderAmount: 100000, // ₹1,000
          },
          150000 // ₹1,500
        )
      ).not.toThrow();
    });

    it('rejects inactive coupon', () => {
      expect(() =>
        validateCouponEligibility(
          {
            code: 'INACTIVE',
            isActive: false,
            validFrom,
            validUntil,
          },
          150000
        )
      ).toThrow(BadRequestError);
    });

    it('rejects expired coupon', () => {
      const expiredDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      expect(() =>
        validateCouponEligibility(
          {
            code: 'EXPIRED',
            isActive: true,
            validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            validUntil: expiredDate,
          },
          150000
        )
      ).toThrow(BadRequestError);
    });

    it('rejects coupon not yet valid', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour in future
      expect(() =>
        validateCouponEligibility(
          {
            code: 'FUTURE',
            isActive: true,
            validFrom: futureDate,
            validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          },
          150000
        )
      ).toThrow(BadRequestError);
    });

    it('rejects order subtotal below minimum requirement', () => {
      expect(() =>
        validateCouponEligibility(
          {
            code: 'MIN1000',
            isActive: true,
            validFrom,
            validUntil,
            minOrderAmount: 200000, // ₹2,000 required
          },
          150000 // ₹1,500 provided
        )
      ).toThrow(BadRequestError);
    });
  });

  describe('validateCreateCouponInput', () => {
    const validData = {
      code: 'DIWALI2026',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 100000,
      maxDiscountAmount: 50000,
      usageLimit: 100,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    it('accepts valid percentage coupon creation payload', () => {
      const validated = validateCreateCouponInput(validData);
      expect(validated.code).toBe('DIWALI2026');
      expect(validated.discountType).toBe(DiscountType.PERCENTAGE);
      expect(validated.discountValue).toBe(15);
      expect(validated.isActive).toBe(true);
    });

    it('rejects percentage discount greater than 100 or less than 1', () => {
      expect(() => validateCreateCouponInput({ ...validData, discountValue: 0 })).toThrow(
        ValidationError
      );
      expect(() => validateCreateCouponInput({ ...validData, discountValue: 101 })).toThrow(
        ValidationError
      );
    });

    it('rejects fixed discount less than 100 paise', () => {
      expect(() =>
        validateCreateCouponInput({
          ...validData,
          discountType: 'FIXED_AMOUNT',
          discountValue: 50,
        })
      ).toThrow(ValidationError);
    });

    it('rejects validUntil earlier than or equal to validFrom', () => {
      expect(() =>
        validateCreateCouponInput({
          ...validData,
          validFrom: new Date(Date.now() + 5000).toISOString(),
          validUntil: new Date(Date.now()).toISOString(),
        })
      ).toThrow(ValidationError);
    });
  });
});
