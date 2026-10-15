import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api-client';
import type {
  ApiSuccessResponse,
  PaginatedResponse,
  ValidateCouponResultDto,
  CouponDto,
  CreateCouponInput,
  UpdateCouponInput,
  AdminCouponFilters,
  AdminCouponListOptions,
} from '@/types';

/**
 * Public storefront coupon validation and discount preview.
 */
export async function validateCoupon(
  code: string,
  subtotalPaise: number
): Promise<ValidateCouponResultDto> {
  const response = await apiPost<ApiSuccessResponse<ValidateCouponResultDto>>('coupons/validate', {
    code: code.trim(),
    subtotal: subtotalPaise,
  });

  return response.data;
}

/**
 * Administrative coupon listing with search, filtering, and pagination.
 */
export async function fetchAdminCoupons(
  filters: AdminCouponFilters = {},
  options: AdminCouponListOptions = { page: 1, pageSize: 20 }
): Promise<{
  coupons: CouponDto[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}> {
  const params = new URLSearchParams();
  params.set('page', String(options.page));
  params.set('pageSize', String(options.pageSize));

  if (filters.search && filters.search.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.isActive !== undefined) {
    params.set('isActive', String(filters.isActive));
  }

  if (filters.discountType) {
    params.set('discountType', filters.discountType);
  }

  if (options.sort) {
    params.set('sort', options.sort);
  }

  const response = await apiGet<PaginatedResponse<CouponDto>>(`admin/coupons?${params.toString()}`);

  return {
    coupons: response.data,
    pagination: response.pagination,
  };
}

/**
 * Administrative coupon creation.
 */
export async function createAdminCoupon(input: CreateCouponInput): Promise<CouponDto> {
  const response = await apiPost<ApiSuccessResponse<CouponDto>>('admin/coupons', input);
  return response.data;
}

/**
 * Administrative coupon update.
 */
export async function updateAdminCoupon(id: string, input: UpdateCouponInput): Promise<CouponDto> {
  const response = await apiPut<ApiSuccessResponse<CouponDto>>(
    `admin/coupons/${encodeURIComponent(id)}`,
    input
  );
  return response.data;
}

/**
 * Administrative coupon status toggle (activate / deactivate).
 */
export async function toggleAdminCouponStatus(id: string, isActive?: boolean): Promise<CouponDto> {
  const response = await apiPatch<ApiSuccessResponse<CouponDto>>(
    `admin/coupons/${encodeURIComponent(id)}/status`,
    isActive !== undefined ? { isActive } : {}
  );
  return response.data;
}

/**
 * Administrative safe coupon deletion (fails if orders reference it).
 */
export async function deleteAdminCoupon(id: string): Promise<boolean> {
  const response = await apiDelete<ApiSuccessResponse<{ deleted: boolean }>>(
    `admin/coupons/${encodeURIComponent(id)}`
  );
  return response.data.deleted;
}
