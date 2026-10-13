import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rate-limit';

const authRoutes = Router();

// Public Authentication Endpoints (Rate Limited)
authRoutes.post('/register', registerRateLimiter, authController.register);
authRoutes.post('/login', loginRateLimiter, authController.login);
authRoutes.post('/logout', authController.logout);

// Protected Customer Profile Endpoints
authRoutes.get('/me', requireAuth, authController.getMe);
authRoutes.patch('/me', requireAuth, authController.updateMe);

export default authRoutes;
