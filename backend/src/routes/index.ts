import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import catalogRoutes from './catalog.routes';
import checkoutRoutes from './checkout.routes';
import webhookRoutes from './webhook.routes';
import orderRoutes from './order.routes';
import addressRoutes from './address.routes';
import wishlistRoutes from './wishlist.routes';
import reviewRoutes from './review.routes';

const apiRouter = Router();

// Health check endpoint -> /api/health
apiRouter.use('/health', healthRoutes);

// Customer Authentication endpoints -> /api/auth
apiRouter.use('/auth', authRoutes);

// Customer Address endpoints -> /api/addresses
apiRouter.use('/addresses', addressRoutes);

// Customer Wishlist endpoints -> /api/wishlist
apiRouter.use('/wishlist', wishlistRoutes);

// Product Reviews & Ratings endpoints -> /api/reviews
apiRouter.use('/reviews', reviewRoutes);

// Checkout endpoints -> /api/checkout/orders
apiRouter.use('/checkout', checkoutRoutes);

// Customer Orders endpoints -> /api/orders
apiRouter.use('/orders', orderRoutes);

// Webhook endpoints -> /api/webhooks/razorpay
apiRouter.use('/webhooks', webhookRoutes);

// Catalog public endpoints -> /api/categories, /api/products, /api/products/:slug
apiRouter.use('/', catalogRoutes);

export default apiRouter;
