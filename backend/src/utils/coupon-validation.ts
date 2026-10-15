import { DiscountType } from '@prisma/client';
import { ValidationError, BadRequestError } from '../errors';
import type {
  CreateCouponInput,
  UpdateCouponInput,
  AdminCouponFilters,
  AdminCouponListOptions,
} from '../types/coupon';

/**
 * Normalizes and validates a coupon code:
 * - Trims whitespace
 * - Converts to uppercase
 * - Enforces 3 to 50 characters, alphanumeric, hyphens, and underscores only
 */
export function normalizeCouponCode(code: unknown): string {
  if (typeof code !== 'string') {
    throw new ValidationError('Coupon code must be a string.');
  }

  const normalized = code.trim().toUpperCase();

  if (normalized.length < 3 || normalized.length > 50) {
    throw new ValidationError('Coupon code must be between 3 and 50 characters long.');
  }

  const codeRegex = /^[A-Z0-9_-]+$/;
  if (!codeRegex.test(normalized)) {
    throw new ValidationError(
      'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores.'
    );
  }

  return normalized;
}

/**
 * Authoritatively calculates discount in integer paise:
 * 1. PERCENTAGE: Math.round((subtotal * discountValue) / 100), capped by maxDiscountAmount if configured.
 * 2. FIXED_AMOUNT: Fixed paise amount.
 * 3. Enforces the Razorpay minimum payable floor:
 *    The final payable total (subtotal - discount) cannot be less than 100 paise (₹1.00).
 *    Free orders are not supported by the payment gateway flow.
 */
export function calculateDiscountAmount(
  subtotalPaise: number,
  coupon: {
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number | null;
  }
): number {
  if (!Number.isInteger(subtotalPaise) || subtotalPaise < 0) {
    throw new ValidationError('Subtotal must be a non-negative integer in paise.');
  }

  if (subtotalPaise === 0) {
    return 0;
  }

  let calculatedDiscount = 0;

  if (coupon.discountType === DiscountType.PERCENTAGE) {
    const rawDiscount = Math.round((subtotalPaise * coupon.discountValue) / 100);
    if (
      coupon.maxDiscountAmount !== null &&
      coupon.maxDiscountAmount !== undefined &&
      coupon.maxDiscountAmount > 0
    ) {
      calculatedDiscount = Math.min(rawDiscount, coupon.maxDiscountAmount);
    } else {
      calculatedDiscount = rawDiscount;
    }
  } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
    calculatedDiscount = coupon.discountValue;
  } else {
    throw new ValidationError(`Unsupported discount type: "${coupon.discountType}".`);
  }

  // Razorpay constraint: Must leave at least 100 paise (₹1.00) payable
  const maxAllowableDiscount = Math.max(0, subtotalPaise - 100);
  const finalDiscount = Math.min(calculatedDiscount, maxAllowableDiscount);

  return Math.max(0, finalDiscount);
}

/**
 * Validates baseline coupon eligibility (active status, date window, minimum order amount).
 * Usage capacity is checked in conjunction with reservation counting in the database.
 */
export function validateCouponEligibility(
  coupon: {
    code: string;
    isActive: boolean;
    validFrom: Date;
    validUntil: Date;
    minOrderAmount?: number | null;
  },
  subtotalPaise: number,
  now = new Date()
): void {
  if (!coupon.isActive) {
    throw new BadRequestError(`Coupon "${coupon.code}" is currently inactive.`);
  }

  if (now < coupon.validFrom) {
    throw new BadRequestError(`Coupon "${coupon.code}" is not yet active.`);
  }

  if (now > coupon.validUntil) {
    throw new BadRequestError(`Coupon "${coupon.code}" has expired.`);
  }

  if (
    coupon.minOrderAmount !== null &&
    coupon.minOrderAmount !== undefined &&
    coupon.minOrderAmount > 0 &&
    subtotalPaise < coupon.minOrderAmount
  ) {
    const minRupees = (coupon.minOrderAmount / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    throw new BadRequestError(
      `Coupon "${coupon.code}" requires a minimum order subtotal of ₹${minRupees}.`
    );
  }
}

/**
 * Validates administrative input for creating a new promotional coupon.
 */
export function validateCreateCouponInput(body: unknown): CreateCouponInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const raw = body as Record<string, unknown>;

  // Code
  const code = normalizeCouponCode(raw.code);

  // Discount Type
  const rawType = String(raw.discountType || '')
    .trim()
    .toUpperCase();
  if (rawType !== DiscountType.PERCENTAGE && rawType !== DiscountType.FIXED_AMOUNT) {
    throw new ValidationError(
      `Discount type must be either "${DiscountType.PERCENTAGE}" or "${DiscountType.FIXED_AMOUNT}".`
    );
  }
  const discountType = rawType as DiscountType;

  // Discount Value
  if (
    raw.discountValue === undefined ||
    raw.discountValue === null ||
    typeof raw.discountValue !== 'number' ||
    !Number.isInteger(raw.discountValue)
  ) {
    throw new ValidationError('Discount value is required and must be an integer.');
  }
  const discountValue = raw.discountValue;

  if (discountType === DiscountType.PERCENTAGE) {
    if (discountValue < 1 || discountValue > 100) {
      throw new ValidationError('Percentage discount value must be an integer between 1 and 100.');
    }
  } else {
    // FIXED_AMOUNT in paise (minimum 100 paise = ₹1.00)
    if (discountValue < 100) {
      throw new ValidationError('Fixed discount value must be at least 100 paise (₹1.00).');
    }
  }

  // Min Order Amount (optional, in paise)
  let minOrderAmount: number | null = null;
  if (raw.minOrderAmount !== undefined && raw.minOrderAmount !== null) {
    if (
      typeof raw.minOrderAmount !== 'number' ||
      !Number.isInteger(raw.minOrderAmount) ||
      raw.minOrderAmount < 0
    ) {
      throw new ValidationError('Minimum order amount must be a non-negative integer in paise.');
    }
    minOrderAmount = raw.minOrderAmount;
  }

  // Max Discount Amount (optional, in paise - relevant for percentage discounts)
  let maxDiscountAmount: number | null = null;
  if (raw.maxDiscountAmount !== undefined && raw.maxDiscountAmount !== null) {
    if (
      typeof raw.maxDiscountAmount !== 'number' ||
      !Number.isInteger(raw.maxDiscountAmount) ||
      raw.maxDiscountAmount <= 0
    ) {
      throw new ValidationError('Maximum discount amount must be a positive integer in paise.');
    }
    maxDiscountAmount = raw.maxDiscountAmount;
  }

  // Usage Limit (optional, positive integer)
  let usageLimit: number | null = null;
  if (raw.usageLimit !== undefined && raw.usageLimit !== null) {
    if (
      typeof raw.usageLimit !== 'number' ||
      !Number.isInteger(raw.usageLimit) ||
      raw.usageLimit <= 0
    ) {
      throw new ValidationError('Usage limit must be a positive integer.');
    }
    usageLimit = raw.usageLimit;
  }

  // Validity Dates
  if (!raw.validFrom || typeof raw.validFrom !== 'string') {
    throw new ValidationError('validFrom is required and must be a valid ISO date string.');
  }
  const validFromDate = new Date(raw.validFrom);
  if (isNaN(validFromDate.getTime())) {
    throw new ValidationError('validFrom must be a valid ISO date.');
  }

  if (!raw.validUntil || typeof raw.validUntil !== 'string') {
    throw new ValidationError('validUntil is required and must be a valid ISO date string.');
  }
  const validUntilDate = new Date(raw.validUntil);
  if (isNaN(validUntilDate.getTime())) {
    throw new ValidationError('validUntil must be a valid ISO date.');
  }

  if (validUntilDate <= validFromDate) {
    throw new ValidationError('validUntil must be strictly after validFrom.');
  }

  // isActive (optional, defaults to true)
  const isActive = raw.isActive !== undefined ? Boolean(raw.isActive) : true;

  return {
    code,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    usageLimit,
    validFrom: validFromDate.toISOString(),
    validUntil: validUntilDate.toISOString(),
    isActive,
  };
}

/**
 * Validates administrative input for updating an existing promotional coupon.
 */
export function validateUpdateCouponInput(body: unknown): UpdateCouponInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const raw = body as Record<string, unknown>;
  const result: UpdateCouponInput = {};

  if (raw.code !== undefined) {
    result.code = normalizeCouponCode(raw.code);
  }

  if (raw.discountType !== undefined) {
    const rawType = String(raw.discountType).trim().toUpperCase();
    if (rawType !== DiscountType.PERCENTAGE && rawType !== DiscountType.FIXED_AMOUNT) {
      throw new ValidationError(
        `Discount type must be either "${DiscountType.PERCENTAGE}" or "${DiscountType.FIXED_AMOUNT}".`
      );
    }
    result.discountType = rawType as DiscountType;
  }

  if (raw.discountValue !== undefined) {
    if (typeof raw.discountValue !== 'number' || !Number.isInteger(raw.discountValue)) {
      throw new ValidationError('Discount value must be an integer.');
    }
    result.discountValue = raw.discountValue;
  }

  if (raw.minOrderAmount !== undefined) {
    if (raw.minOrderAmount === null) {
      result.minOrderAmount = null;
    } else if (
      typeof raw.minOrderAmount !== 'number' ||
      !Number.isInteger(raw.minOrderAmount) ||
      raw.minOrderAmount < 0
    ) {
      throw new ValidationError(
        'Minimum order amount must be a non-negative integer in paise or null.'
      );
    } else {
      result.minOrderAmount = raw.minOrderAmount;
    }
  }

  if (raw.maxDiscountAmount !== undefined) {
    if (raw.maxDiscountAmount === null) {
      result.maxDiscountAmount = null;
    } else if (
      typeof raw.maxDiscountAmount !== 'number' ||
      !Number.isInteger(raw.maxDiscountAmount) ||
      raw.maxDiscountAmount <= 0
    ) {
      throw new ValidationError(
        'Maximum discount amount must be a positive integer in paise or null.'
      );
    } else {
      result.maxDiscountAmount = raw.maxDiscountAmount;
    }
  }

  if (raw.usageLimit !== undefined) {
    if (raw.usageLimit === null) {
      result.usageLimit = null;
    } else if (
      typeof raw.usageLimit !== 'number' ||
      !Number.isInteger(raw.usageLimit) ||
      raw.usageLimit <= 0
    ) {
      throw new ValidationError('Usage limit must be a positive integer or null.');
    } else {
      result.usageLimit = raw.usageLimit;
    }
  }

  if (raw.validFrom !== undefined) {
    if (typeof raw.validFrom !== 'string') {
      throw new ValidationError('validFrom must be an ISO date string.');
    }
    const d = new Date(raw.validFrom);
    if (isNaN(d.getTime())) {
      throw new ValidationError('validFrom must be a valid date.');
    }
    result.validFrom = d.toISOString();
  }

  if (raw.validUntil !== undefined) {
    if (typeof raw.validUntil !== 'string') {
      throw new ValidationError('validUntil must be an ISO date string.');
    }
    const d = new Date(raw.validUntil);
    if (isNaN(d.getTime())) {
      throw new ValidationError('validUntil must be a valid date.');
    }
    result.validUntil = d.toISOString();
  }

  if (result.validFrom && result.validUntil) {
    if (new Date(result.validUntil) <= new Date(result.validFrom)) {
      throw new ValidationError('validUntil must be strictly after validFrom.');
    }
  }

  if (raw.isActive !== undefined) {
    result.isActive = Boolean(raw.isActive);
  }

  return result;
}

/**
 * Validates query parameters for admin coupon listing.
 */
export function validateAdminCouponListQuery(rawQuery: Record<string, unknown>): {
  filters: AdminCouponFilters;
  options: AdminCouponListOptions;
} {
  const pageRaw = rawQuery.page ? Number(rawQuery.page) : 1;
  const pageSizeRaw = rawQuery.pageSize ? Number(rawQuery.pageSize) : 20;

  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize =
    Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 && pageSizeRaw <= 100 ? pageSizeRaw : 20;

  const filters: AdminCouponFilters = {};

  if (typeof rawQuery.search === 'string' && rawQuery.search.trim()) {
    filters.search = rawQuery.search.trim();
  }

  if (rawQuery.isActive !== undefined && rawQuery.isActive !== '') {
    if (rawQuery.isActive === 'true' || rawQuery.isActive === true) {
      filters.isActive = true;
    } else if (rawQuery.isActive === 'false' || rawQuery.isActive === false) {
      filters.isActive = false;
    }
  }

  if (typeof rawQuery.discountType === 'string' && rawQuery.discountType.trim()) {
    const upper = rawQuery.discountType.trim().toUpperCase();
    if (upper === DiscountType.PERCENTAGE || upper === DiscountType.FIXED_AMOUNT) {
      filters.discountType = upper as DiscountType;
    }
  }

  let sort: AdminCouponListOptions['sort'] = 'newest';
  if (typeof rawQuery.sort === 'string') {
    const s = rawQuery.sort.trim().toLowerCase();
    if (['newest', 'oldest', 'code_asc', 'times_used_desc'].includes(s)) {
      sort = s as AdminCouponListOptions['sort'];
    }
  }

  return {
    filters,
    options: {
      page,
      pageSize,
      sort,
    },
  };
}
