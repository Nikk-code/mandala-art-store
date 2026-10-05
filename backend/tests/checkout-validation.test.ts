import { describe, it, expect } from 'vitest';
import {
  validateCustomer,
  validateShippingAddress,
  validateOrderItems,
  validateCreateOrderRequest,
} from '../src/utils/checkout-validation';
import { ValidationError } from '../src/errors';

describe('Checkout Validation Utilities', () => {
  describe('validateCustomer', () => {
    it('accepts valid customer details and normalizes email and phone', () => {
      const result = validateCustomer({
        fullName: '  Priya Sharma  ',
        email: '  PRIYA.Sharma@Example.COM  ',
        phone: '+91 98765 43210',
      });

      expect(result).toEqual({
        fullName: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '9876543210',
      });
    });

    it('handles 0-prefixed Indian phone number correctly', () => {
      const result = validateCustomer({
        fullName: 'Aarav Patel',
        email: 'aarav@example.com',
        phone: '09876543210',
      });
      expect(result.phone).toBe('9876543210');
    });

    it('rejects missing customer object', () => {
      expect(() => validateCustomer(null)).toThrow(ValidationError);
      expect(() => validateCustomer(undefined)).toThrow(ValidationError);
    });

    it('rejects short or overly long full name', () => {
      expect(() =>
        validateCustomer({ fullName: 'A', email: 'a@example.com', phone: '9876543210' })
      ).toThrow(ValidationError);

      expect(() =>
        validateCustomer({
          fullName: 'A'.repeat(101),
          email: 'a@example.com',
          phone: '9876543210',
        })
      ).toThrow(ValidationError);
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@com'];
      for (const email of invalidEmails) {
        expect(() =>
          validateCustomer({ fullName: 'Valid Name', email, phone: '9876543210' })
        ).toThrow(ValidationError);
      }
    });

    it('rejects invalid Indian phone numbers', () => {
      const invalidPhones = ['1234567890', '5987654321', '987654321', '98765432100', 'abc'];
      for (const phone of invalidPhones) {
        expect(() =>
          validateCustomer({ fullName: 'Valid Name', email: 'valid@example.com', phone })
        ).toThrow(ValidationError);
      }
    });
  });

  describe('validateShippingAddress', () => {
    it('accepts valid shipping address with all fields', () => {
      const result = validateShippingAddress({
        addressLine1: 'Flat 402, Lotus Residency, MG Road',
        addressLine2: 'Near Central Mall',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      });

      expect(result).toEqual({
        addressLine1: 'Flat 402, Lotus Residency, MG Road',
        addressLine2: 'Near Central Mall',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      });
    });

    it('defaults country to India when omitted', () => {
      const result = validateShippingAddress({
        addressLine1: '42 Sacred Grove Street',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        postalCode: '221001',
      });
      expect(result.country).toBe('India');
      expect(result.addressLine2).toBeUndefined();
    });

    it('rejects short address line 1 (< 5 chars)', () => {
      expect(() =>
        validateShippingAddress({
          addressLine1: 'Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
        })
      ).toThrow(ValidationError);
    });

    it('rejects invalid 6-digit Indian PIN codes', () => {
      const invalidPins = ['012345', '12345', '1234567', '56000A', 'abcdef'];
      for (const postalCode of invalidPins) {
        expect(() =>
          validateShippingAddress({
            addressLine1: '123 Art Gallery Lane',
            city: 'Jaipur',
            state: 'Rajasthan',
            postalCode,
          })
        ).toThrow(ValidationError);
      }
    });

    it('rejects non-Indian destinations', () => {
      expect(() =>
        validateShippingAddress({
          addressLine1: '123 Main Street',
          city: 'London',
          state: 'Greater London',
          postalCode: '560001',
          country: 'United Kingdom',
        })
      ).toThrow(ValidationError);
    });
  });

  describe('validateOrderItems', () => {
    const validUuid1 = 'a0000000-0000-4000-8000-000000000001';
    const validUuid2 = 'a0000000-0000-4000-8000-000000000002';

    it('accepts valid items list and returns merged items', () => {
      const result = validateOrderItems([
        { productId: validUuid1, quantity: 2 },
        { productId: validUuid2, quantity: 1 },
      ]);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { productId: validUuid1, quantity: 2 },
        { productId: validUuid2, quantity: 1 },
      ]);
    });

    it('merges quantities for duplicate product IDs safely', () => {
      const result = validateOrderItems([
        { productId: validUuid1, quantity: 2 },
        { productId: validUuid1, quantity: 3 },
      ]);

      expect(result).toEqual([{ productId: validUuid1, quantity: 5 }]);
    });

    it('rejects empty items array', () => {
      expect(() => validateOrderItems([])).toThrow(ValidationError);
    });

    it('rejects invalid product UUID format', () => {
      expect(() => validateOrderItems([{ productId: 'invalid-id', quantity: 1 }])).toThrow(
        ValidationError
      );
    });

    it('rejects zero, negative, decimal, NaN, or absurd quantities', () => {
      expect(() => validateOrderItems([{ productId: validUuid1, quantity: 0 }])).toThrow(
        ValidationError
      );
      expect(() => validateOrderItems([{ productId: validUuid1, quantity: -1 }])).toThrow(
        ValidationError
      );
      expect(() => validateOrderItems([{ productId: validUuid1, quantity: 1.5 }])).toThrow(
        ValidationError
      );
      expect(() => validateOrderItems([{ productId: validUuid1, quantity: NaN }])).toThrow(
        ValidationError
      );
      expect(() => validateOrderItems([{ productId: validUuid1, quantity: 1000 }])).toThrow(
        ValidationError
      );
    });
  });

  describe('validateCreateOrderRequest', () => {
    const validUuid = 'a0000000-0000-4000-8000-000000000001';

    it('accepts complete valid payload and normalizes values', () => {
      const request = {
        customer: {
          fullName: 'Ananya Roy',
          email: 'ananya@example.com',
          phone: '9876543210',
        },
        shippingAddress: {
          addressLine1: '108 Peace Enclave',
          city: 'Kolkata',
          state: 'West Bengal',
          postalCode: '700001',
        },
        items: [{ productId: validUuid, quantity: 1 }],
      };

      const result = validateCreateOrderRequest(request);
      expect(result.customer.fullName).toBe('Ananya Roy');
      expect(result.shippingAddress.country).toBe('India');
      expect(result.items[0].quantity).toBe(1);
    });

    it('rejects non-object request payload', () => {
      expect(() => validateCreateOrderRequest(null)).toThrow(ValidationError);
      expect(() => validateCreateOrderRequest('string')).toThrow(ValidationError);
    });
  });
});
