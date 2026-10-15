import { prisma } from '../db/prisma';
import { PrismaClient, type Coupon } from '@prisma/client';
import {
  couponRepository,
  type CouponRepository,
  type AdminCouponRecord,
} from '../repositories/coupon.repository';
import {
  normalizeCouponCode,
  calculateDiscountAmount,
  validateCouponEligibility,
  validateCreateCouponInput,
  validateUpdateCouponInput,
  validateAdminCouponListQuery,
} from '../utils/coupon-validation';
import { validateUuid } from '../utils/catalog-validation';
import { NotFoundError, ConflictError } from '../errors';
import type {
  CouponDto,
  ValidateCouponResultDto,
  PaginatedAdminCouponsResponse,
} from '../types/coupon';

export class CouponService {
  private readonly repository: CouponRepository;
  private readonly prismaClient: PrismaClient;

  constructor(
    repository: CouponRepository = couponRepository,
    prismaClient: PrismaClient = prisma
  ) {
    this.repository = repository;
    this.prismaClient = prismaClient;
  }

  /**
   * Validates a coupon code for customer checkout and returns authoritative discount calculations.
   * Client-submitted discount numbers or totals are never trusted.
   */
  async validatePublicCoupon(
    rawCode: string,
    subtotalPaise: number
  ): Promise<ValidateCouponResultDto> {
    const code = normalizeCouponCode(rawCode);

    const coupon = await this.repository.findByCode(code);
    if (!coupon) {
      throw new NotFoundError(`Coupon code "${code}" is invalid.`);
    }

    // 1. Baseline eligibility (active status, validity dates, minimum order amount)
    validateCouponEligibility(coupon, subtotalPaise);

    // 2. Capacity Check: Evaluates committed redemptions + active 15-minute reservations
    if (coupon.usageLimit !== null) {
      const pendingReservations = await this.prismaClient.$transaction(async tx => {
        return this.repository.countActivePendingReservations(tx, coupon.id, 15);
      });

      const totalOccupied = coupon.timesUsed + pendingReservations;
      if (totalOccupied >= coupon.usageLimit) {
        throw new ConflictError(`Coupon "${coupon.code}" has reached its maximum usage limit.`);
      }
    }

    // 3. Integer paise discount calculation with Razorpay payable floor
    const discountAmount = calculateDiscountAmount(subtotalPaise, coupon);
    const newTotal = Math.max(100, subtotalPaise - discountAmount);

    return {
      valid: true,
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      newTotal,
    };
  }

  /**
   * Retrieves paginated coupons for administration with search and status filtering.
   */
  async getAdminCoupons(rawQuery: Record<string, unknown>): Promise<PaginatedAdminCouponsResponse> {
    const { filters, options } = validateAdminCouponListQuery(rawQuery);

    const { coupons, total } = await this.repository.findAdminCoupons(filters, options);
    const totalPages = total === 0 ? 0 : Math.ceil(total / options.pageSize);

    return {
      items: coupons.map(c => this.mapToDto(c)),
      pagination: {
        page: options.page,
        pageSize: options.pageSize,
        totalItems: total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves single coupon details for administrative review.
   */
  async getAdminCouponById(id: string): Promise<CouponDto> {
    const cleanId = validateUuid(id, 'Coupon ID');
    const coupon = await this.repository.findById(cleanId);
    if (!coupon) {
      throw new NotFoundError(`Coupon with ID "${cleanId}" was not found.`);
    }

    return this.mapToDto(coupon);
  }

  /**
   * Creates a new promotional coupon with server-side validation and code uniqueness enforcement.
   */
  async createCoupon(rawBody: unknown): Promise<CouponDto> {
    const validatedInput = validateCreateCouponInput(rawBody);

    const existing = await this.repository.findByCode(validatedInput.code);
    if (existing) {
      throw new ConflictError(`A coupon with code "${validatedInput.code}" already exists.`);
    }

    const created = await this.repository.create(validatedInput);
    return this.mapToDto(created);
  }

  /**
   * Updates an existing coupon with partial changes and code uniqueness check if code is changed.
   */
  async updateCoupon(id: string, rawBody: unknown): Promise<CouponDto> {
    const cleanId = validateUuid(id, 'Coupon ID');
    const validatedInput = validateUpdateCouponInput(rawBody);

    const current = await this.repository.findById(cleanId);
    if (!current) {
      throw new NotFoundError(`Coupon with ID "${cleanId}" was not found.`);
    }

    if (validatedInput.code && validatedInput.code !== current.code) {
      const existing = await this.repository.findByCode(validatedInput.code);
      if (existing && existing.id !== cleanId) {
        throw new ConflictError(`A coupon with code "${validatedInput.code}" already exists.`);
      }
    }

    const updated = await this.repository.update(cleanId, validatedInput);
    return this.mapToDto(updated);
  }

  /**
   * Toggles the active status of a coupon.
   */
  async toggleCouponStatus(id: string, explicitStatus?: boolean): Promise<CouponDto> {
    const cleanId = validateUuid(id, 'Coupon ID');

    const current = await this.repository.findById(cleanId);
    if (!current) {
      throw new NotFoundError(`Coupon with ID "${cleanId}" was not found.`);
    }

    const nextStatus = explicitStatus !== undefined ? explicitStatus : !current.isActive;
    const updated = await this.repository.toggleStatus(cleanId, nextStatus);

    return this.mapToDto(updated);
  }

  /**
   * Safely deletes a coupon if no orders reference it. If orders exist, throws ConflictError.
   */
  async deleteCoupon(id: string): Promise<{ deleted: true; id: string }> {
    const cleanId = validateUuid(id, 'Coupon ID');
    await this.repository.delete(cleanId);
    return { deleted: true, id: cleanId };
  }

  private mapToDto(coupon: Coupon | AdminCouponRecord): CouponDto {
    const dto: CouponDto = {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      usageLimit: coupon.usageLimit,
      timesUsed: coupon.timesUsed,
      validFrom: coupon.validFrom.toISOString(),
      validUntil: coupon.validUntil.toISOString(),
      isActive: coupon.isActive,
      createdAt: coupon.createdAt.toISOString(),
      updatedAt: coupon.updatedAt.toISOString(),
    };

    if ('_count' in coupon && coupon._count && typeof coupon._count.orders === 'number') {
      dto.ordersCount = coupon._count.orders;
    }

    return dto;
  }
}

export const couponService = new CouponService();
