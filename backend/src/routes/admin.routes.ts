import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const adminRoutes = Router();

// Enforce authentication and administrative authorization across all admin routes
adminRoutes.use(requireAuth, requireAdmin);

// Protected Administrator Dashboard
adminRoutes.get('/dashboard', adminController.getDashboard);

// Product Management
adminRoutes.get('/products', adminController.listProducts);
adminRoutes.post('/products', adminController.createProduct);
adminRoutes.get('/products/:id', adminController.getProduct);
adminRoutes.put('/products/:id', adminController.updateProduct);
adminRoutes.patch('/products/:id/status', adminController.toggleProductStatus);
adminRoutes.post('/products/:id/images', adminController.addProductImage);
adminRoutes.delete('/products/:id/images/:imageId', adminController.removeProductImage);
adminRoutes.post('/products/:id/images/:imageId/primary', adminController.setPrimaryProductImage);

// Category Management
adminRoutes.get('/categories', adminController.listCategories);
adminRoutes.post('/categories', adminController.createCategory);
adminRoutes.get('/categories/:id', adminController.getCategory);
adminRoutes.put('/categories/:id', adminController.updateCategory);
adminRoutes.patch('/categories/:id/status', adminController.toggleCategoryStatus);
adminRoutes.delete('/categories/:id', adminController.deleteCategory);

// Inventory Management
adminRoutes.get('/inventory', adminController.getInventory);
adminRoutes.patch('/inventory/:productId', adminController.adjustInventory);

export default adminRoutes;
