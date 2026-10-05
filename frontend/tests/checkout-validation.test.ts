import { describe, it, expect } from 'vitest';
import {
  validateFullName,
  validateEmail,
  validatePhone,
  validateAddressLine1,
  validateCity,
  validateState,
  validatePostalCode,
  validateCheckoutForm,
} from '@/utils/checkout-validation';
import type { CheckoutFormData } from '@/types';

describe('Checkout Form Validation Utilities', () => {
  describe('validateFullName', () => {
    it('returns error when name is empty or only whitespace', () => {
      expect(validateFullName('')).toBe('Full name is required');
      expect(validateFullName('   ')).toBe('Full name is required');
    });

    it('returns error when name is less than 2 characters', () => {
      expect(validateFullName('A')).toBe('Name must be at least 2 characters');
    });

    it('returns error when name exceeds 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(validateFullName(longName)).toBe('Name cannot exceed 100 characters');
    });

    it('returns null for valid names', () => {
      expect(validateFullName('Radhika Sharma')).toBeNull();
      expect(validateFullName('Aarav Patel')).toBeNull();
    });
  });

  describe('validateEmail', () => {
    it('returns error when email is empty', () => {
      expect(validateEmail('')).toBe('Email address is required');
      expect(validateEmail('   ')).toBe('Email address is required');
    });

    it('returns error for invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe('Please enter a valid email address');
      expect(validateEmail('test@')).toBe('Please enter a valid email address');
      expect(validateEmail('@domain.com')).toBe('Please enter a valid email address');
      expect(validateEmail('test@domain')).toBe('Please enter a valid email address');
    });

    it('returns null for valid emails', () => {
      expect(validateEmail('radhika@example.com')).toBeNull();
      expect(validateEmail('art.lover_99@sub.domain.co.in')).toBeNull();
    });
  });

  describe('validatePhone', () => {
    it('returns error when phone is empty', () => {
      expect(validatePhone('')).toBe('Phone number is required');
      expect(validatePhone('   ')).toBe('Phone number is required');
    });

    it('returns error for invalid Indian phone numbers', () => {
      expect(validatePhone('12345')).toBe('Please enter a valid 10-digit Indian phone number');
      expect(validatePhone('1234567890')).toBe('Please enter a valid 10-digit Indian phone number'); // starts with 1
      expect(validatePhone('abcdefghij')).toBe('Please enter a valid 10-digit Indian phone number');
    });

    it('accepts valid 10-digit Indian numbers starting with 6, 7, 8, 9', () => {
      expect(validatePhone('9876543210')).toBeNull();
      expect(validatePhone('8123456789')).toBeNull();
      expect(validatePhone('7012345678')).toBeNull();
      expect(validatePhone('6987654321')).toBeNull();
    });

    it('handles +91 prefix, dashes, and spaces cleanly', () => {
      expect(validatePhone('+91 98765 43210')).toBeNull();
      expect(validatePhone('+91-9876543210')).toBeNull();
      expect(validatePhone('09876543210')).toBeNull();
    });
  });

  describe('validateAddressLine1', () => {
    it('returns error when address is empty or too short', () => {
      expect(validateAddressLine1('')).toBe('Street address is required');
      expect(validateAddressLine1('123')).toBe('Address must be at least 5 characters');
    });

    it('returns null for valid street addresses', () => {
      expect(validateAddressLine1('402, Lotus Heritage, MG Road')).toBeNull();
    });
  });

  describe('validateCity & validateState', () => {
    it('validates city', () => {
      expect(validateCity('')).toBe('City is required');
      expect(validateCity('A')).toBe('City must be at least 2 characters');
      expect(validateCity('Ahmedabad')).toBeNull();
    });

    it('validates state', () => {
      expect(validateState('')).toBe('State is required');
      expect(validateState('G')).toBe('State must be at least 2 characters');
      expect(validateState('Gujarat')).toBeNull();
    });
  });

  describe('validatePostalCode', () => {
    it('returns error when PIN code is empty', () => {
      expect(validatePostalCode('')).toBe('PIN code is required');
    });

    it('returns error for invalid Indian PIN codes', () => {
      expect(validatePostalCode('012345')).toBe('Please enter a valid 6-digit PIN code'); // starts with 0
      expect(validatePostalCode('38001')).toBe('Please enter a valid 6-digit PIN code'); // 5 digits
      expect(validatePostalCode('3800155')).toBe('Please enter a valid 6-digit PIN code'); // 7 digits
      expect(validatePostalCode('38001A')).toBe('Please enter a valid 6-digit PIN code');
    });

    it('accepts valid 6-digit PIN codes', () => {
      expect(validatePostalCode('380015')).toBeNull();
      expect(validatePostalCode('110001')).toBeNull();
      expect(validatePostalCode('560001')).toBeNull();
    });
  });

  describe('validateCheckoutForm', () => {
    const validForm: CheckoutFormData = {
      fullName: 'Radhika Sharma',
      email: 'radhika@example.com',
      phone: '9876543210',
      addressLine1: '402, Lotus Heritage, MG Road',
      addressLine2: 'Near Shanti Stupa',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380015',
      country: 'India',
    };

    it('passes validation when all required fields are valid', () => {
      const result = validateCheckoutForm(validForm);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('fails validation and returns errors when required fields are missing', () => {
      const invalidForm: CheckoutFormData = {
        ...validForm,
        fullName: '',
        email: 'invalid-email',
        phone: '123',
        addressLine1: '12',
        city: '',
        state: '',
        postalCode: '000000',
      };

      const result = validateCheckoutForm(invalidForm);
      expect(result.isValid).toBe(false);
      expect(result.errors.fullName).toBe('Full name is required');
      expect(result.errors.email).toBe('Please enter a valid email address');
      expect(result.errors.phone).toBe('Please enter a valid 10-digit Indian phone number');
      expect(result.errors.addressLine1).toBe('Address must be at least 5 characters');
      expect(result.errors.city).toBe('City is required');
      expect(result.errors.state).toBe('State is required');
      expect(result.errors.postalCode).toBe('Please enter a valid 6-digit PIN code');
    });
  });
});
