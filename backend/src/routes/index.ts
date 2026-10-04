import { Router } from 'express';
import healthRoutes from './health.routes';

const apiRouter = Router();

// Health check endpoint -> /api/health
apiRouter.use('/health', healthRoutes);

// Future endpoints will be mounted here:
// apiRouter.use('/products', productRoutes);
// apiRouter.use('/categories', categoryRoutes);
// apiRouter.use('/orders', orderRoutes);
// apiRouter.use('/auth', authRoutes);
// apiRouter.use('/reviews', reviewRoutes);

export default apiRouter;
