import type { CheckoutFormData, CheckoutFormErrors } from '@/types';

export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Full name is required';
  }
  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (trimmed.length > 100) {
    return 'Name cannot exceed 100 characters';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email address is required';
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address';
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return 'Phone number is required';
  }
  // Strip whitespace, hyphens, and leading +91 or 0
  const cleaned = trimmed.replace(/[\s\-()]/g, '').replace(/^(?:\+91|0)/, '');
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleaned)) {
    return 'Please enter a valid 10-digit Indian phone number';
  }
  return null;
}

export function validateAddressLine1(address: string): string | null {
  const trimmed = address.trim();
  if (!trimmed) {
    return 'Street address is required';
  }
  if (trimmed.length < 5) {
    return 'Address must be at least 5 characters';
  }
  return null;
}

export function validateCity(city: string): string | null {
  const trimmed = city.trim();
  if (!trimmed) {
    return 'City is required';
  }
  if (trimmed.length < 2) {
    return 'City must be at least 2 characters';
  }
  return null;
}

export function validateState(state: string): string | null {
  const trimmed = state.trim();
  if (!trimmed) {
    return 'State is required';
  }
  if (trimmed.length < 2) {
    return 'State must be at least 2 characters';
  }
  return null;
}

export function validatePostalCode(postalCode: string): string | null {
  const trimmed = postalCode.trim();
  if (!trimmed) {
    return 'PIN code is required';
  }
  // Indian 6-digit postal code (110001 to 899999)
  const pinRegex = /^[1-9][0-9]{5}$/;
  if (!pinRegex.test(trimmed)) {
    return 'Please enter a valid 6-digit PIN code';
  }
  return null;
}

export function validateCheckoutForm(formData: CheckoutFormData): {
  isValid: boolean;
  errors: CheckoutFormErrors;
} {
  const errors: CheckoutFormErrors = {};

  const nameError = validateFullName(formData.fullName);
  if (nameError) errors.fullName = nameError;

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;

  const addressError = validateAddressLine1(formData.addressLine1);
  if (addressError) errors.addressLine1 = addressError;

  const cityError = validateCity(formData.city);
  if (cityError) errors.city = cityError;

  const stateError = validateState(formData.state);
  if (stateError) errors.state = stateError;

  const postalCodeError = validatePostalCode(formData.postalCode);
  if (postalCodeError) errors.postalCode = postalCodeError;

  const isValid = Object.keys(errors).length === 0;

  return { isValid, errors };
}
