import type { Request, Response, NextFunction } from 'express';
import { couponService, type CouponService } from '../services/coupon.service';
import { ValidationError } from '../errors';

export class CouponController {
  private readonly service: CouponService;

  constructor(service: CouponService = couponService) {
    this.service = service;
  }

  /**
   * POST /api/coupons/validate
   * Public storefront endpoint to validate a coupon code and preview discount.
   */
  validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, subtotal } = req.body || {};

      if (!code || typeof code !== 'string') {
        throw new ValidationError('Coupon code is required.');
      }

      if (
        subtotal === undefined ||
        subtotal === null ||
        typeof subtotal !== 'number' ||
        !Number.isInteger(subtotal) ||
        subtotal < 0
      ) {
        throw new ValidationError('Subtotal must be a non-negative integer in paise.');
      }

      const result = await this.service.validatePublicCoupon(code, subtotal);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/coupons
   * Paginated listing of coupons with search and active status filters.
   */
  listCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getAdminCoupons(req.query as Record<string, unknown>);
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/coupons/:id
   * Detailed coupon profile.
   */
  getCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupon = await this.service.getAdminCouponById(req.params.id);
      res.status(200).json({
        success: true,
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/coupons
   * Creates a new promotional coupon.
   */
  createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.service.createCoupon(req.body);
      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/coupons/:id
   * Updates an existing coupon.
   */
  updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.service.updateCoupon(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/coupons/:id/status
   * Toggles active status of a coupon.
   */
  toggleCouponStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const explicitStatus =
        req.body?.isActive !== undefined ? Boolean(req.body.isActive) : undefined;
      const updated = await this.service.toggleCouponStatus(req.params.id, explicitStatus);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/admin/coupons/:id
   * Safely deletes a coupon if no orders reference it.
   */
  deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.deleteCoupon(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const couponController = new CouponController();
