import { Router } from 'express';
import {
  createOrder,
  initializePayment,
  verifyPayment,
  updateOrder,
  cancelOrder,
  getCheckoutOrder,
} from '../controllers/checkout.controller';
import { optionalAuth } from '../middleware/auth';

const checkoutRouter = Router();

// POST /api/checkout/orders
checkoutRouter.post('/orders', optionalAuth, createOrder);

// GET /api/checkout/orders/:orderId
checkoutRouter.get('/orders/:orderId', optionalAuth, getCheckoutOrder);

// PATCH /api/checkout/orders/:orderId
checkoutRouter.patch('/orders/:orderId', optionalAuth, updateOrder);

// POST /api/checkout/orders/:orderId/cancel
checkoutRouter.post('/orders/:orderId/cancel', optionalAuth, cancelOrder);

// POST /api/checkout/orders/:orderId/payment
checkoutRouter.post('/orders/:orderId/payment', initializePayment);

// POST /api/checkout/orders/:orderId/payment/verify
checkoutRouter.post('/orders/:orderId/payment/verify', verifyPayment);

export default checkoutRouter;
