import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  validateSlug,
  validateSku,
  validatePriceInPaise,
  validateStockQuantity,
  validateAvailability,
  validateCategoryName,
  validateProductName,
} from '../src/utils/catalog-validation';
import { ValidationError } from '../src/errors';
import { ProductAvailability } from '@prisma/client';

describe('Catalog Validation Utilities', () => {
  describe('generateSlug', () => {
    it('generates clean kebab-case slugs from strings with special characters and spaces', () => {
      expect(generateSlug('Mandala Art 100% Handmade!')).toBe('mandala-art-100-handmade');
      expect(generateSlug('  Lippan Art & Crafts  ')).toBe('lippan-art-crafts');
    });

    it('throws ValidationError on empty or invalid inputs', () => {
      expect(() => generateSlug('')).toThrow(ValidationError);
      expect(() => generateSlug('   ')).toThrow(ValidationError);
      expect(() => generateSlug('!@#$%')).toThrow(ValidationError);
    });
  });

  describe('validateSlug', () => {
    it('accepts valid slugs', () => {
      expect(validateSlug('mandala-art')).toBe('mandala-art');
      expect(validateSlug('lippan-mirror-art-12-inch')).toBe('lippan-mirror-art-12-inch');
    });

    it('rejects invalid slugs with uppercase, special characters, or consecutive dashes', () => {
      expect(() => validateSlug('Mandala-Art')).toThrow(ValidationError);
      expect(() => validateSlug('mandala--art')).toThrow(ValidationError);
      expect(() => validateSlug('mandala_art')).toThrow(ValidationError);
      expect(() => validateSlug('-mandala-art')).toThrow(ValidationError);
    });
  });

  describe('validateSku', () => {
    it('normalizes and validates valid SKU patterns', () => {
      expect(validateSku('mnd-001')).toBe('MND-001');
      expect(validateSku('LIP_CANVAS_12')).toBe('LIP_CANVAS_12');
    });

    it('rejects invalid SKUs with special characters or invalid lengths', () => {
      expect(() => validateSku('')).toThrow(ValidationError);
      expect(() => validateSku('M')).toThrow(ValidationError);
      expect(() => validateSku('SKU#123')).toThrow(ValidationError);
    });
  });

  describe('validatePriceInPaise', () => {
    it('accepts valid non-negative integer paise amounts', () => {
      expect(validatePriceInPaise(149900)).toBe(149900); // ₹1,499.00
      expect(validatePriceInPaise(0)).toBe(0);
    });

    it('rejects negative numbers or floating point decimals', () => {
      expect(() => validatePriceInPaise(-100)).toThrow(ValidationError);
      expect(() => validatePriceInPaise(1499.5)).toThrow(ValidationError);
      expect(() => validatePriceInPaise('149900')).toThrow(ValidationError);
    });
  });

  describe('validateStockQuantity', () => {
    it('accepts non-negative integers', () => {
      expect(validateStockQuantity(1)).toBe(1);
      expect(validateStockQuantity(0)).toBe(0);
      expect(validateStockQuantity(100)).toBe(100);
    });

    it('rejects negative numbers and decimals', () => {
      expect(() => validateStockQuantity(-1)).toThrow(ValidationError);
      expect(() => validateStockQuantity(1.5)).toThrow(ValidationError);
    });
  });

  describe('validateAvailability', () => {
    it('accepts valid ProductAvailability enums', () => {
      expect(validateAvailability(ProductAvailability.IN_STOCK)).toBe(ProductAvailability.IN_STOCK);
      expect(validateAvailability(ProductAvailability.MADE_TO_ORDER)).toBe(
        ProductAvailability.MADE_TO_ORDER
      );
      expect(validateAvailability(ProductAvailability.SOLD_OUT)).toBe(ProductAvailability.SOLD_OUT);
    });

    it('rejects unknown availability status values', () => {
      expect(() => validateAvailability('BACKORDER')).toThrow(ValidationError);
    });
  });

  describe('validateCategoryName and validateProductName', () => {
    it('accepts valid names within range', () => {
      expect(validateCategoryName('Mandala Art')).toBe('Mandala Art');
      expect(validateProductName('Sacred Geometry Mandala 12x12')).toBe(
        'Sacred Geometry Mandala 12x12'
      );
    });

    it('rejects names outside length limits or empty strings', () => {
      expect(() => validateCategoryName('')).toThrow(ValidationError);
      expect(() => validateProductName(' ')).toThrow(ValidationError);
    });
  });
});
