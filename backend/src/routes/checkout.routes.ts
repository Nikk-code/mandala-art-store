import { Router } from 'express';
import { createOrder } from '../controllers/checkout.controller';

const checkoutRouter = Router();

// POST /api/checkout/orders
checkoutRouter.post('/orders', createOrder);

export default checkoutRouter;
