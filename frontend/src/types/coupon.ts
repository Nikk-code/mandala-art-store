export interface CouponDto {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
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

export interface ValidateCouponResultDto {
  valid: boolean;
  couponCode: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  discountAmount: number; // in integer paise
  newTotal: number; // in integer paise
  message?: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
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
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
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
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
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
