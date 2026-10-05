import { Router } from 'express';
import { createOrder, initializePayment } from '../controllers/checkout.controller';

const checkoutRouter = Router();

// POST /api/checkout/orders
checkoutRouter.post('/orders', createOrder);

// POST /api/checkout/orders/:orderId/payment
checkoutRouter.post('/orders/:orderId/payment', initializePayment);

export default checkoutRouter;
