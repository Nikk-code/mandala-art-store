import { Router } from 'express';
import healthRoutes from './health.routes';
import catalogRoutes from './catalog.routes';
import checkoutRoutes from './checkout.routes';

const apiRouter = Router();

// Health check endpoint -> /api/health
apiRouter.use('/health', healthRoutes);

// Checkout endpoints -> /api/checkout/orders
apiRouter.use('/checkout', checkoutRoutes);

// Catalog public endpoints -> /api/categories, /api/products, /api/products/:slug
apiRouter.use('/', catalogRoutes);

export default apiRouter;
