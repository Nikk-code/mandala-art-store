import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { couponController } from '../controllers/coupon.controller';
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

// Order Management & Fulfillment
adminRoutes.get('/orders', adminController.listOrders);
adminRoutes.get('/orders/:id', adminController.getOrder);
adminRoutes.patch('/orders/:id/status', adminController.updateOrderStatus);

// Coupon & Promotion Management
adminRoutes.get('/coupons', couponController.listCoupons);
adminRoutes.post('/coupons', couponController.createCoupon);
adminRoutes.get('/coupons/:id', couponController.getCoupon);
adminRoutes.put('/coupons/:id', couponController.updateCoupon);
adminRoutes.patch('/coupons/:id/status', couponController.toggleCouponStatus);
adminRoutes.delete('/coupons/:id', couponController.deleteCoupon);

// Review Moderation
adminRoutes.get('/reviews', adminController.listReviews);
adminRoutes.patch('/reviews/:id/status', adminController.updateReviewStatus);
adminRoutes.delete('/reviews/:id', adminController.deleteReview);

export default adminRoutes;
