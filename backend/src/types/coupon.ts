import type { DiscountType } from '@prisma/client';

export interface CouponDto {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  timesUsed: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ordersCount?: number;
}

export interface ValidateCouponRequest {
  code: string;
  subtotal: number; // in integer paise
}

export interface ValidateCouponResultDto {
  valid: boolean;
  couponCode: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number; // in integer paise
  newTotal: number; // in integer paise
  message?: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
}

export interface UpdateCouponInput {
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

export interface AdminCouponFilters {
  search?: string;
  isActive?: boolean;
  discountType?: DiscountType;
}

export interface AdminCouponListOptions {
  page: number;
  pageSize: number;
  sort?: 'newest' | 'oldest' | 'code_asc' | 'times_used_desc';
}

export interface PaginatedAdminCouponsResponse {
  items: CouponDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
