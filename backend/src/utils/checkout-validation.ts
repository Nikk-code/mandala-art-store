import { ValidationError } from '../errors';
import type {
  CreateOrderCustomerInput,
  CreateOrderShippingAddressInput,
  CreateOrderItemInput,
  CreateOrderRequest,
} from '../types';

export function validateCustomer(customer: unknown): CreateOrderCustomerInput {
  if (!customer || typeof customer !== 'object') {
    throw new ValidationError('Customer information is required');
  }

  const raw = customer as Partial<CreateOrderCustomerInput>;

  if (!raw.fullName || typeof raw.fullName !== 'string') {
    throw new ValidationError('Customer full name is required');
  }
  const fullName = raw.fullName.trim();
  if (fullName.length < 2 || fullName.length > 100) {
    throw new ValidationError('Customer full name must be between 2 and 100 characters');
  }

  if (!raw.email || typeof raw.email !== 'string') {
    throw new ValidationError('Customer email is required');
  }
  const email = raw.email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Please provide a valid email address');
  }

  if (!raw.phone || typeof raw.phone !== 'string') {
    throw new ValidationError('Customer phone number is required');
  }
  const cleanedPhone = raw.phone
    .trim()
    .replace(/[\s\-()]/g, '')
    .replace(/^(?:\+91|0)/, '');
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanedPhone)) {
    throw new ValidationError('Please provide a valid 10-digit Indian phone number');
  }

  return {
    fullName,
    email,
    phone: cleanedPhone,
  };
}

export function validateShippingAddress(address: unknown): CreateOrderShippingAddressInput {
  if (!address || typeof address !== 'object') {
    throw new ValidationError('Shipping address information is required');
  }

  const raw = address as Partial<CreateOrderShippingAddressInput>;

  if (!raw.addressLine1 || typeof raw.addressLine1 !== 'string') {
    throw new ValidationError('Shipping address line 1 is required');
  }
  const addressLine1 = raw.addressLine1.trim();
  if (addressLine1.length < 5) {
    throw new ValidationError('Shipping address line 1 must be at least 5 characters');
  }

  const addressLine2 =
    raw.addressLine2 && typeof raw.addressLine2 === 'string' ? raw.addressLine2.trim() : undefined;

  if (!raw.city || typeof raw.city !== 'string') {
    throw new ValidationError('Shipping city is required');
  }
  const city = raw.city.trim();
  if (city.length < 2) {
    throw new ValidationError('Shipping city must be at least 2 characters');
  }

  if (!raw.state || typeof raw.state !== 'string') {
    throw new ValidationError('Shipping state is required');
  }
  const state = raw.state.trim();
  if (state.length < 2) {
    throw new ValidationError('Shipping state must be at least 2 characters');
  }

  if (!raw.postalCode || typeof raw.postalCode !== 'string') {
    throw new ValidationError('Shipping postal code is required');
  }
  const postalCode = raw.postalCode.trim();
  const pinRegex = /^[1-9][0-9]{5}$/;
  if (!pinRegex.test(postalCode)) {
    throw new ValidationError('Please provide a valid 6-digit Indian PIN code');
  }

  const country = raw.country ? raw.country.trim() : 'India';
  if (country.toLowerCase() !== 'india') {
    throw new ValidationError('Currently deliveries are supported across India only');
  }

  return {
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country: 'India',
  };
}

export function validateOrderItems(items: unknown): CreateOrderItemInput[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Order must contain at least one item');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const mergedMap = new Map<string, number>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== 'object') {
      throw new ValidationError(`Invalid item entry at index ${i}`);
    }

    const { productId, quantity } = item as Partial<CreateOrderItemInput>;

    if (!productId || typeof productId !== 'string' || !uuidRegex.test(productId)) {
      throw new ValidationError(`Invalid or missing productId for item at index ${i}`);
    }

    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      throw new ValidationError(
        `Quantity for product "${productId}" must be a positive integer between 1 and 100`
      );
    }

    const currentQty = mergedMap.get(productId) || 0;
    mergedMap.set(productId, currentQty + quantity);
  }

  const validatedItems: CreateOrderItemInput[] = [];
  for (const [productId, quantity] of mergedMap.entries()) {
    validatedItems.push({ productId, quantity });
  }

  return validatedItems;
}

export function validateCreateOrderRequest(body: unknown): CreateOrderRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required and must be a JSON object');
  }

  const raw = body as Partial<CreateOrderRequest>;

  const customer = validateCustomer(raw.customer);
  const shippingAddress = validateShippingAddress(raw.shippingAddress);
  const items = validateOrderItems(raw.items);

  return {
    customer,
    shippingAddress,
    items,
  };
}
