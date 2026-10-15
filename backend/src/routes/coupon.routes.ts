import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller';

const couponRoutes = Router();

// Public storefront coupon validation & preview endpoint
couponRoutes.post('/validate', couponController.validateCoupon);

export default couponRoutes;
