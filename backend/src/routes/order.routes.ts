import { Router } from 'express';
import { getOrderById, getOrderHistory } from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth';

const orderRouter = Router();

// GET /api/orders — Retrieve paginated order history for authenticated customer
orderRouter.get('/', requireAuth, getOrderHistory);

// GET /api/orders/:orderId — Retrieve single customer order details
orderRouter.get('/:orderId', requireAuth, getOrderById);

export default orderRouter;
