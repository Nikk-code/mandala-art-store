import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const authRoutes = Router();

// Public Authentication Endpoints
authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.post('/logout', authController.logout);

// Protected Customer Profile Endpoint
authRoutes.get('/me', requireAuth, authController.getMe);

export default authRoutes;
