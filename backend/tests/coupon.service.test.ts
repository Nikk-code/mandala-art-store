import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CouponService } from '../src/services/coupon.service';
import { CouponRepository } from '../src/repositories/coupon.repository';
import { DiscountType } from '@prisma/client';
import { NotFoundError, ConflictError, BadRequestError } from '../src/errors';
import { prisma } from '../src/db/prisma';

describe('CouponService Domain Logic', () => {
  let mockRepo: CouponRepository;
  let service: CouponService;

  const validCoupon = {
    id: 'c1111111-1111-4111-8111-111111111111',
    code: 'ART10',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    minOrderAmount: 100000, // ₹1,000.00
    maxDiscountAmount: 50000, // ₹500.00
    usageLimit: 5,
    timesUsed: 2,
    validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepo = new CouponRepository(prisma);
    service = new CouponService(mockRepo, prisma);
  });

  describe('validatePublicCoupon', () => {
    it('successfully validates an active coupon and calculates authoritative discount and payable total', async () => {
      vi.spyOn(mockRepo, 'findByCode').mockResolvedValue(validCoupon);
      // Spy on countActivePendingReservations to return 1 active pending reservation
      vi.spyOn(prisma, '$transaction').mockImplementation(async cb => {
        return cb({} as any);
      });
      vi.spyOn(mockRepo, 'countActivePendingReservations').mockResolvedValue(1);

      // Subtotal = ₹2,000 (200000 paise). 10% = ₹200 (20000 paise). Total = ₹1,800 (180000 paise)
      const result = await service.validatePublicCoupon('art10', 200000);

      expect(result.valid).toBe(true);
      expect(result.couponCode).toBe('ART10');
      expect(result.discountType).toBe(DiscountType.PERCENTAGE);
      expect(result.discountValue).toBe(10);
      expect(result.discountAmount).toBe(20000);
      expect(result.newTotal).toBe(180000);
    });

    it('rejects nonexistent coupon with 404 NotFoundError', async () => {
      vi.spyOn(mockRepo, 'findByCode').mockResolvedValue(null);

      await expect(service.validatePublicCoupon('NOPE', 200000)).rejects.toThrow(NotFoundError);
    });

    it('rejects coupon when subtotal does not meet minOrderAmount', async () => {
      vi.spyOn(mockRepo, 'findByCode').mockResolvedValue(validCoupon);

      // Subtotal ₹500 < ₹1,000 required
      await expect(service.validatePublicCoupon('ART10', 50000)).rejects.toThrow(BadRequestError);
    });

    it('rejects coupon when usage limit is reached via timesUsed + pending reservations', async () => {
      vi.spyOn(mockRepo, 'findByCode').mockResolvedValue({
        ...validCoupon,
        usageLimit: 3,
        timesUsed: 2,
      });

      // 1 active pending reservation in flight: 2 + 1 = 3 >= usageLimit (3)
      vi.spyOn(prisma, '$transaction').mockImplementation(async cb => {
        return cb({} as any);
      });
      vi.spyOn(mockRepo, 'countActivePendingReservations').mockResolvedValue(1);

      await expect(service.validatePublicCoupon('ART10', 200000)).rejects.toThrow(ConflictError);
    });
  });

  describe('Administrative Coupon Management', () => {
    it('creates a new coupon if code does not already exist', async () => {
      vi.spyOn(mockRepo, 'findByCode').mockResolvedValue(null);
      vi.spyOn(mockRepo, 'create').mockResolvedValue(validCoupon);

      const result = await service.createCoupon({
        code: 'ART10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        validFrom: validCoupon.validFrom.toISOString(),
        validUntil: validCoupon.validUntil.toISOString(),
      });

      expect(result.code).toBe('ART10');
      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it('rejects creation if coupon code already exists with 409 Conflict', async () => {
      vi.spyOn(mockRepo, 'findByCode').mockResolvedValue(validCoupon);

      await expect(
        service.createCoupon({
          code: 'ART10',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          validFrom: validCoupon.validFrom.toISOString(),
          validUntil: validCoupon.validUntil.toISOString(),
        })
      ).rejects.toThrow(ConflictError);
    });

    it('toggles coupon status safely', async () => {
      vi.spyOn(mockRepo, 'findById').mockResolvedValue(validCoupon);
      vi.spyOn(mockRepo, 'toggleStatus').mockResolvedValue({
        ...validCoupon,
        isActive: false,
      });

      const result = await service.toggleCouponStatus(validCoupon.id, false);
      expect(result.isActive).toBe(false);
      expect(mockRepo.toggleStatus).toHaveBeenCalledWith(validCoupon.id, false);
    });

    it('safely deletes coupon if no orders reference it', async () => {
      vi.spyOn(mockRepo, 'delete').mockResolvedValue(true);

      const result = await service.deleteCoupon(validCoupon.id);
      expect(result.deleted).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith(validCoupon.id);
    });
  });
});
