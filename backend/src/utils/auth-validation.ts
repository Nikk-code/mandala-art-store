import { ValidationError } from '../errors';

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export interface NormalizedRegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface NormalizedLoginInput {
  email: string;
  password: string;
}

export function validateEmail(email: unknown): string {
  if (typeof email !== 'string' || !email.trim()) {
    throw new ValidationError('A valid email address is required.', 'email');
  }

  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail.length > 255) {
    throw new ValidationError('Email address must not exceed 255 characters.', 'email');
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    throw new ValidationError(
      'Please enter a valid email address (e.g., customer@example.com).',
      'email'
    );
  }

  return cleanEmail;
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || !password) {
    throw new ValidationError('Password is required.', 'password');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long.', 'password');
  }

  if (password.length > 128) {
    throw new ValidationError('Password must not exceed 128 characters.', 'password');
  }

  // Must contain at least one letter and at least one digit
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasLetter || !hasDigit) {
    throw new ValidationError(
      'Password must contain at least one letter and one number.',
      'password'
    );
  }

  return password;
}

export function validateName(name: unknown, field = 'name'): string {
  if (typeof name !== 'string' || !name.trim()) {
    throw new ValidationError(`${field === 'name' ? 'Name' : field} is required.`, field);
  }

  const cleanName = name.trim();

  if (cleanName.length < 2) {
    throw new ValidationError(
      `${field === 'name' ? 'Name' : field} must be at least 2 characters.`,
      field
    );
  }

  if (cleanName.length > 100) {
    throw new ValidationError(
      `${field === 'name' ? 'Name' : field} must not exceed 100 characters.`,
      field
    );
  }

  return cleanName;
}

export function validateRegisterInput(body: unknown): NormalizedRegisterInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Registration payload must be a JSON object.');
  }

  const data = body as Record<string, unknown>;

  const email = validateEmail(data.email);
  const password = validatePassword(data.password);

  let firstName = '';
  let lastName = '';

  if (typeof data.name === 'string' && data.name.trim()) {
    const cleanFullName = validateName(data.name, 'name');
    const parts = cleanFullName.split(/\s+/);
    firstName = parts[0];
    lastName = parts.slice(1).join(' ') || parts[0];
  } else {
    firstName = validateName(data.firstName, 'firstName');
    lastName =
      typeof data.lastName === 'string' && data.lastName.trim()
        ? validateName(data.lastName, 'lastName')
        : firstName;
  }

  let phone: string | undefined;
  if (typeof data.phone === 'string' && data.phone.trim()) {
    const cleanPhone = data.phone.trim().replace(/[\s\-()+]/g, '');
    if (/^[6-9]\d{9}$/.test(cleanPhone)) {
      phone = cleanPhone;
    }
  }

  return {
    email,
    password,
    firstName,
    lastName,
    phone,
  };
}

export function validateLoginInput(body: unknown): NormalizedLoginInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Login payload must be a JSON object.');
  }

  const data = body as Record<string, unknown>;

  const email = validateEmail(data.email);

  if (typeof data.password !== 'string' || !data.password) {
    throw new ValidationError('Password is required.', 'password');
  }

  return {
    email,
    password: data.password,
  };
}
