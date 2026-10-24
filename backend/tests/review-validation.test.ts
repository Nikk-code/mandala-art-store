import { describe, it, expect } from 'vitest';
import {
  validateProductId,
  validateReviewId,
  validateRating,
  validateReviewTitle,
  validateReviewBody,
  validateCreateReviewInput,
  validateUpdateReviewInput,
  validateReviewStatus,
  validateUpdateReviewStatusInput,
  validateAdminReviewQuery,
} from '../src/utils/review-validation';
import { ValidationError } from '../src/errors';

describe('Review Validation Utilities', () => {
  const validUuid = '11111111-2222-4333-8444-555555555555';

  describe('validateProductId and validateReviewId', () => {
    it('accepts valid UUID strings', () => {
      expect(validateProductId(validUuid)).toBe(validUuid);
      expect(validateReviewId(validUuid)).toBe(validUuid);
    });

    it('rejects missing or non-string IDs', () => {
      expect(() => validateProductId('')).toThrow(ValidationError);
      expect(() => validateProductId(null)).toThrow(ValidationError);
      expect(() => validateReviewId(123)).toThrow(ValidationError);
    });

    it('rejects non-UUID formats', () => {
      expect(() => validateProductId('invalid-uuid')).toThrow(ValidationError);
      expect(() => validateReviewId('12345')).toThrow(ValidationError);
    });
  });

  describe('validateRating', () => {
    it('accepts integer ratings 1 through 5', () => {
      expect(validateRating(1)).toBe(1);
      expect(validateRating(3)).toBe(3);
      expect(validateRating(5)).toBe(5);
    });

    it('rejects non-integers, decimals, and numbers outside 1-5', () => {
      expect(() => validateRating(0)).toThrow(ValidationError);
      expect(() => validateRating(6)).toThrow(ValidationError);
      expect(() => validateRating(4.5)).toThrow(ValidationError);
      expect(() => validateRating('5')).toThrow(ValidationError);
    });
  });

  describe('validateReviewTitle', () => {
    it('normalizes string titles and trims whitespace', () => {
      expect(validateReviewTitle('  Breathtaking Art  ')).toBe('Breathtaking Art');
      expect(validateReviewTitle(null)).toBeNull();
      expect(validateReviewTitle(undefined)).toBeNull();
      expect(validateReviewTitle('   ')).toBeNull();
    });

    it('rejects non-string titles or titles longer than 200 chars', () => {
      expect(() => validateReviewTitle(123)).toThrow(ValidationError);
      expect(() => validateReviewTitle('A'.repeat(201))).toThrow(ValidationError);
    });
  });

  describe('validateReviewBody', () => {
    it('accepts valid review bodies', () => {
      expect(validateReviewBody('This artwork is breathtaking.')).toBe(
        'This artwork is breathtaking.'
      );
    });

    it('enforces min length of 5 and max length of 2000', () => {
      expect(() => validateReviewBody('Good')).toThrow(ValidationError);
      expect(() => validateReviewBody('A'.repeat(2001))).toThrow(ValidationError);
    });

    it('handles required vs optional bodies', () => {
      expect(validateReviewBody(null, false)).toBeNull();
      expect(() => validateReviewBody(null, true)).toThrow(ValidationError);
      expect(() => validateReviewBody('   ', true)).toThrow(ValidationError);
    });
  });

  describe('validateCreateReviewInput and validateUpdateReviewInput', () => {
    it('validates complete create review input', () => {
      const input = {
        productId: validUuid,
        rating: 5,
        title: 'Sacred Harmony',
        body: 'Exquisite details and radiant geometry.',
      };
      const result = validateCreateReviewInput(input);
      expect(result.productId).toBe(validUuid);
      expect(result.rating).toBe(5);
      expect(result.title).toBe('Sacred Harmony');
      expect(result.body).toBe('Exquisite details and radiant geometry.');
    });

    it('rejects create input when not an object', () => {
      expect(() => validateCreateReviewInput(null)).toThrow(ValidationError);
    });

    it('validates partial update review input', () => {
      const result = validateUpdateReviewInput({ rating: 4 });
      expect(result.rating).toBe(4);
      expect(result.title).toBeUndefined();
      expect(result.body).toBeUndefined();
    });

    it('rejects update review input with no update fields', () => {
      expect(() => validateUpdateReviewInput({})).toThrow(ValidationError);
    });
  });

  describe('validateReviewStatus', () => {
    it('accepts valid statuses: PENDING, APPROVED, REJECTED', () => {
      expect(validateReviewStatus('PENDING')).toBe('PENDING');
      expect(validateReviewStatus('APPROVED')).toBe('APPROVED');
      expect(validateReviewStatus('REJECTED')).toBe('REJECTED');
    });

    it('rejects invalid or case-mismatched review statuses', () => {
      expect(() => validateReviewStatus('pending')).toThrow(ValidationError);
      expect(() => validateReviewStatus('SPAM')).toThrow(ValidationError);
      expect(() => validateReviewStatus(null)).toThrow(ValidationError);
    });
  });

  describe('validateUpdateReviewStatusInput', () => {
    it('accepts payload containing only status', () => {
      expect(validateUpdateReviewStatusInput({ status: 'APPROVED' })).toEqual({
        status: 'APPROVED',
      });
      expect(validateUpdateReviewStatusInput({ status: 'REJECTED' })).toEqual({
        status: 'REJECTED',
      });
      expect(validateUpdateReviewStatusInput({ status: 'PENDING' })).toEqual({
        status: 'PENDING',
      });
    });

    it('rejects non-object payloads or arrays', () => {
      expect(() => validateUpdateReviewStatusInput(null)).toThrow(ValidationError);
      expect(() => validateUpdateReviewStatusInput('APPROVED')).toThrow(ValidationError);
      expect(() => validateUpdateReviewStatusInput(['APPROVED'])).toThrow(ValidationError);
    });

    it('rejects payloads missing status', () => {
      expect(() => validateUpdateReviewStatusInput({})).toThrow(ValidationError);
    });

    it('rejects arbitrary extra writable fields to prevent parameter tampering', () => {
      expect(() =>
        validateUpdateReviewStatusInput({
          status: 'APPROVED',
          rating: 5,
        })
      ).toThrow(ValidationError);

      expect(() =>
        validateUpdateReviewStatusInput({
          status: 'APPROVED',
          body: 'tampered review',
        })
      ).toThrow(ValidationError);
    });
  });

  describe('validateAdminReviewQuery', () => {
    it('applies defaults when empty query is provided', () => {
      const result = validateAdminReviewQuery({});
      expect(result).toEqual({
        filters: {},
        options: {
          page: 1,
          pageSize: 20,
          sort: 'newest',
        },
      });
    });

    it('parses valid pagination, filters, and sort options', () => {
      const result = validateAdminReviewQuery({
        page: '3',
        pageSize: '50',
        status: 'APPROVED',
        productId: validUuid,
        search: 'Lotus Mandala',
        sort: 'rating_desc',
      });

      expect(result).toEqual({
        filters: {
          status: 'APPROVED',
          productId: validUuid,
          search: 'Lotus Mandala',
        },
        options: {
          page: 3,
          pageSize: 50,
          sort: 'rating_desc',
        },
      });
    });

    it('rejects invalid page', () => {
      expect(() => validateAdminReviewQuery({ page: '0' })).toThrow(ValidationError);
      expect(() => validateAdminReviewQuery({ page: '-5' })).toThrow(ValidationError);
      expect(() => validateAdminReviewQuery({ page: 'one' })).toThrow(ValidationError);
    });

    it('rejects invalid pageSize outside 1-100 bounds', () => {
      expect(() => validateAdminReviewQuery({ pageSize: '0' })).toThrow(ValidationError);
      expect(() => validateAdminReviewQuery({ pageSize: '101' })).toThrow(ValidationError);
      expect(() => validateAdminReviewQuery({ pageSize: 'lots' })).toThrow(ValidationError);
    });

    it('rejects invalid status filter', () => {
      expect(() => validateAdminReviewQuery({ status: 'ACTIVE' })).toThrow(ValidationError);
    });

    it('rejects invalid productId UUID', () => {
      expect(() => validateAdminReviewQuery({ productId: 'invalid' })).toThrow(ValidationError);
    });

    it('rejects overly long search strings', () => {
      expect(() => validateAdminReviewQuery({ search: 'A'.repeat(101) })).toThrow(ValidationError);
    });

    it('rejects invalid sort parameter', () => {
      expect(() => validateAdminReviewQuery({ sort: 'popular' })).toThrow(ValidationError);
    });
  });
});
