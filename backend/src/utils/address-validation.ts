import { ValidationError } from '../errors';
import type { CreateAddressInput, UpdateAddressInput } from '../types';

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const INDIAN_PIN_REGEX = /^[1-9][0-9]{5}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function cleanIndianPhone(rawPhone: string): string {
  return rawPhone
    .trim()
    .replace(/[\s\-()]/g, '')
    .replace(/^(?:\+91|0)/, '');
}

export function validateAddressId(id: unknown): string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
    throw new ValidationError('Invalid address ID format.');
  }
  return id.trim();
}

export function validateCreateAddressInput(input: unknown): CreateAddressInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Address information is required.');
  }

  const raw = input as Partial<CreateAddressInput>;

  // Recipient Name
  if (!raw.recipientName || typeof raw.recipientName !== 'string') {
    throw new ValidationError('Recipient name is required.');
  }
  const recipientName = raw.recipientName.trim();
  if (recipientName.length < 2 || recipientName.length > 100) {
    throw new ValidationError('Recipient name must be between 2 and 100 characters.');
  }

  // Phone
  if (!raw.phone || typeof raw.phone !== 'string') {
    throw new ValidationError('Phone number is required.');
  }
  const cleanedPhone = cleanIndianPhone(raw.phone);
  if (!INDIAN_PHONE_REGEX.test(cleanedPhone)) {
    throw new ValidationError('Please enter a valid 10-digit Indian mobile number.');
  }

  // Address Line 1
  if (!raw.addressLine1 || typeof raw.addressLine1 !== 'string') {
    throw new ValidationError('Address line 1 is required.');
  }
  const addressLine1 = raw.addressLine1.trim();
  if (addressLine1.length < 5 || addressLine1.length > 255) {
    throw new ValidationError('Address line 1 must be between 5 and 255 characters.');
  }

  // Address Line 2
  let addressLine2: string | null = null;
  if (raw.addressLine2 !== undefined && raw.addressLine2 !== null) {
    if (typeof raw.addressLine2 !== 'string') {
      throw new ValidationError('Address line 2 must be a string.');
    }
    const trimmedLine2 = raw.addressLine2.trim();
    if (trimmedLine2.length > 255) {
      throw new ValidationError('Address line 2 cannot exceed 255 characters.');
    }
    addressLine2 = trimmedLine2.length > 0 ? trimmedLine2 : null;
  }

  // City
  if (!raw.city || typeof raw.city !== 'string') {
    throw new ValidationError('City is required.');
  }
  const city = raw.city.trim();
  if (city.length < 2 || city.length > 100) {
    throw new ValidationError('City must be between 2 and 100 characters.');
  }

  // State
  if (!raw.state || typeof raw.state !== 'string') {
    throw new ValidationError('State is required.');
  }
  const state = raw.state.trim();
  if (state.length < 2 || state.length > 100) {
    throw new ValidationError('State must be between 2 and 100 characters.');
  }

  // Postal Code (PIN code)
  if (!raw.postalCode || typeof raw.postalCode !== 'string') {
    throw new ValidationError('PIN code is required.');
  }
  const postalCode = raw.postalCode.trim();
  if (!INDIAN_PIN_REGEX.test(postalCode)) {
    throw new ValidationError('Please enter a valid 6-digit Indian PIN code.');
  }

  // Country
  if (raw.country !== undefined && typeof raw.country === 'string') {
    if (raw.country.trim().toLowerCase() !== 'india') {
      throw new ValidationError('Currently deliveries are supported across India only.');
    }
  }

  // Default flag
  const isDefault = typeof raw.isDefault === 'boolean' ? raw.isDefault : false;

  return {
    recipientName,
    phone: cleanedPhone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country: 'India',
    isDefault,
  };
}

export function validateUpdateAddressInput(input: unknown): UpdateAddressInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Address update payload is required.');
  }

  const raw = input as Record<string, unknown>;
  const validated: UpdateAddressInput = {};
  let fieldCount = 0;

  // Recipient Name
  if (raw.recipientName !== undefined) {
    if (typeof raw.recipientName !== 'string') {
      throw new ValidationError('Recipient name must be a string.');
    }
    const recipientName = raw.recipientName.trim();
    if (recipientName.length < 2 || recipientName.length > 100) {
      throw new ValidationError('Recipient name must be between 2 and 100 characters.');
    }
    validated.recipientName = recipientName;
    fieldCount++;
  }

  // Phone
  if (raw.phone !== undefined) {
    if (typeof raw.phone !== 'string') {
      throw new ValidationError('Phone number must be a string.');
    }
    const cleanedPhone = cleanIndianPhone(raw.phone);
    if (!INDIAN_PHONE_REGEX.test(cleanedPhone)) {
      throw new ValidationError('Please enter a valid 10-digit Indian mobile number.');
    }
    validated.phone = cleanedPhone;
    fieldCount++;
  }

  // Address Line 1
  if (raw.addressLine1 !== undefined) {
    if (typeof raw.addressLine1 !== 'string') {
      throw new ValidationError('Address line 1 must be a string.');
    }
    const addressLine1 = raw.addressLine1.trim();
    if (addressLine1.length < 5 || addressLine1.length > 255) {
      throw new ValidationError('Address line 1 must be between 5 and 255 characters.');
    }
    validated.addressLine1 = addressLine1;
    fieldCount++;
  }

  // Address Line 2
  if (raw.addressLine2 !== undefined) {
    if (raw.addressLine2 === null) {
      validated.addressLine2 = null;
      fieldCount++;
    } else if (typeof raw.addressLine2 === 'string') {
      const trimmedLine2 = raw.addressLine2.trim();
      if (trimmedLine2.length > 255) {
        throw new ValidationError('Address line 2 cannot exceed 255 characters.');
      }
      validated.addressLine2 = trimmedLine2.length > 0 ? trimmedLine2 : null;
      fieldCount++;
    } else {
      throw new ValidationError('Address line 2 must be a string or null.');
    }
  }

  // City
  if (raw.city !== undefined) {
    if (typeof raw.city !== 'string') {
      throw new ValidationError('City must be a string.');
    }
    const city = raw.city.trim();
    if (city.length < 2 || city.length > 100) {
      throw new ValidationError('City must be between 2 and 100 characters.');
    }
    validated.city = city;
    fieldCount++;
  }

  // State
  if (raw.state !== undefined) {
    if (typeof raw.state !== 'string') {
      throw new ValidationError('State must be a string.');
    }
    const state = raw.state.trim();
    if (state.length < 2 || state.length > 100) {
      throw new ValidationError('State must be between 2 and 100 characters.');
    }
    validated.state = state;
    fieldCount++;
  }

  // Postal Code
  if (raw.postalCode !== undefined) {
    if (typeof raw.postalCode !== 'string') {
      throw new ValidationError('PIN code must be a string.');
    }
    const postalCode = raw.postalCode.trim();
    if (!INDIAN_PIN_REGEX.test(postalCode)) {
      throw new ValidationError('Please enter a valid 6-digit Indian PIN code.');
    }
    validated.postalCode = postalCode;
    fieldCount++;
  }

  // Country
  if (raw.country !== undefined) {
    if (typeof raw.country !== 'string' || raw.country.trim().toLowerCase() !== 'india') {
      throw new ValidationError('Currently deliveries are supported across India only.');
    }
    validated.country = 'India';
    fieldCount++;
  }

  // isDefault
  if (raw.isDefault !== undefined) {
    if (typeof raw.isDefault !== 'boolean') {
      throw new ValidationError('isDefault must be a boolean.');
    }
    validated.isDefault = raw.isDefault;
    fieldCount++;
  }

  if (fieldCount === 0) {
    throw new ValidationError('At least one address field must be provided for update.');
  }

  return validated;
}
