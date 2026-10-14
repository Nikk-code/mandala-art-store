import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const adminRoutes = Router();

// Protected Administrator Dashboard
adminRoutes.get('/dashboard', requireAuth, requireAdmin, adminController.getDashboard);

export default adminRoutes;
