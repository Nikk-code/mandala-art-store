import { Router } from 'express';
import { createOrder, initializePayment, verifyPayment } from '../controllers/checkout.controller';
import { optionalAuth } from '../middleware/auth';

const checkoutRouter = Router();

// POST /api/checkout/orders
checkoutRouter.post('/orders', optionalAuth, createOrder);

// POST /api/checkout/orders/:orderId/payment
checkoutRouter.post('/orders/:orderId/payment', initializePayment);

// POST /api/checkout/orders/:orderId/payment/verify
checkoutRouter.post('/orders/:orderId/payment/verify', verifyPayment);

export default checkoutRouter;
