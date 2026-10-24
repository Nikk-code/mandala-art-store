import type { Request, Response, NextFunction } from 'express';
import { adminService, type AdminService } from '../services/admin.service';
import { productService, type ProductService } from '../services/product.service';
import { categoryService, type CategoryService } from '../services/category.service';
import { orderService, type OrderService } from '../services/order.service';
import { reviewService, type ReviewService } from '../services/review.service';
import type { ApiSuccessResponse, PaginatedResponse } from '../types';
import type {
  AdminDashboardResponseData,
  AdminOrderListItemDto,
  AdminOrderDetailsDto,
} from '../types/admin';
import type { AdminReviewDto } from '../types/review';
import type { ProductWithDetails } from '../repositories/product.repository';
import type { CategoryWithProductCount } from '../services/category.service';
import type { Category, Product, ProductImage, ProductAvailability } from '@prisma/client';
import { validateUuid } from '../utils/catalog-validation';
import { ValidationError } from '../errors';

export class AdminController {
  constructor(
    private service: AdminService = adminService,
    private products: ProductService = productService,
    private categories: CategoryService = categoryService,
    private orders: OrderService = orderService,
    private reviews: ReviewService = reviewService
  ) {}

  /**
   * GET /api/admin/dashboard
   * Returns authenticated administrator profile and supported dashboard module metadata.
   */
  public getDashboard = async (
    req: Request,
    res: Response<ApiSuccessResponse<AdminDashboardResponseData>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dashboardData = await this.service.getDashboardData(req.user!.id);
      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // PRODUCT MANAGEMENT
  // ============================================================================

  /**
   * GET /api/admin/products
   * Paginated product listing with admin filters (search by name/SKU, category, availability, active).
   */
  public listProducts = async (
    req: Request,
    res: Response<PaginatedResponse<ProductWithDetails>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = req.query.page !== undefined ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize !== undefined ? Number(req.query.pageSize) : 20;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const categoryId =
        typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
      const availability =
        typeof req.query.availability === 'string'
          ? (req.query.availability as ProductAvailability)
          : undefined;

      let isActive: boolean | undefined;
      if (req.query.isActive === 'true') {
        isActive = true;
      } else if (req.query.isActive === 'false') {
        isActive = false;
      }

      const sort =
        typeof req.query.sort === 'string'
          ? (req.query.sort as
              'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'stock_asc' | 'stock_desc')
          : undefined;

      const result = await this.products.listAdminProductsPaginated({
        page,
        pageSize,
        search,
        categoryId,
        availability,
        isActive,
        sort,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/products/:id
   * Get single product details by ID for admin viewing/editing.
   */
  public getProduct = async (
    req: Request,
    res: Response<ApiSuccessResponse<ProductWithDetails>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Product ID');
      const product = await this.products.getProductById(id);
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/products
   * Create a new product.
   */
  public createProduct = async (
    req: Request,
    res: Response<ApiSuccessResponse<ProductWithDetails>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const product = await this.products.createProduct(req.body);
      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/products/:id
   * Update product attributes.
   */
  public updateProduct = async (
    req: Request,
    res: Response<ApiSuccessResponse<ProductWithDetails>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Product ID');
      const updated = await this.products.updateProduct(id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/products/:id/status
   * Toggle product active/inactive state.
   */
  public toggleProductStatus = async (
    req: Request,
    res: Response<ApiSuccessResponse<Product>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Product ID');
      if (typeof req.body.isActive !== 'boolean') {
        throw new ValidationError('isActive must be a boolean');
      }
      const updated = await this.products.toggleProductActive(id, req.body.isActive);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/products/:id/images
   * Add image to product gallery.
   */
  public addProductImage = async (
    req: Request,
    res: Response<ApiSuccessResponse<ProductImage>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Product ID');
      const image = await this.products.addImage(id, req.body);
      res.status(201).json({
        success: true,
        data: image,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/admin/products/:id/images/:imageId
   * Remove image from product gallery.
   */
  public removeProductImage = async (
    req: Request,
    res: Response<ApiSuccessResponse<ProductImage>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Product ID');
      const imageId = validateUuid(req.params.imageId, 'Image ID');
      const deleted = await this.products.removeImage(id, imageId);
      res.status(200).json({
        success: true,
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/products/:id/images/:imageId/primary
   * Set primary image for product.
   */
  public setPrimaryProductImage = async (
    req: Request,
    res: Response<ApiSuccessResponse<ProductImage>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Product ID');
      const imageId = validateUuid(req.params.imageId, 'Image ID');
      const primary = await this.products.setPrimaryImage(id, imageId);
      res.status(200).json({
        success: true,
        data: primary,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // CATEGORY MANAGEMENT
  // ============================================================================

  /**
   * GET /api/admin/categories
   * List all categories (active & inactive) with product count.
   */
  public listCategories = async (
    _req: Request,
    res: Response<ApiSuccessResponse<CategoryWithProductCount[]>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const categories = await this.categories.listAllCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/categories/:id
   * Get single category details.
   */
  public getCategory = async (
    req: Request,
    res: Response<ApiSuccessResponse<Category>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Category ID');
      const category = await this.categories.getCategoryById(id);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/categories
   * Create a new category.
   */
  public createCategory = async (
    req: Request,
    res: Response<ApiSuccessResponse<Category>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const category = await this.categories.createCategory(req.body);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/categories/:id
   * Update category attributes.
   */
  public updateCategory = async (
    req: Request,
    res: Response<ApiSuccessResponse<Category>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Category ID');
      const updated = await this.categories.updateCategory(id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/categories/:id/status
   * Toggle category active/inactive state with dependency check.
   */
  public toggleCategoryStatus = async (
    req: Request,
    res: Response<ApiSuccessResponse<Category>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Category ID');
      if (typeof req.body.isActive !== 'boolean') {
        throw new ValidationError('isActive must be a boolean');
      }
      const updated = await this.categories.toggleCategoryActive(id, req.body.isActive);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/admin/categories/:id
   * Delete category (prevented if any products depend on it).
   */
  public deleteCategory = async (
    req: Request,
    res: Response<ApiSuccessResponse<Category>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = validateUuid(req.params.id, 'Category ID');
      const deleted = await this.categories.deleteCategory(id);
      res.status(200).json({
        success: true,
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // INVENTORY MANAGEMENT
  // ============================================================================

  /**
   * GET /api/admin/inventory
   * List products with stock counts, availability states, and low-stock flags.
   */
  public getInventory = async (
    req: Request,
    res: Response<PaginatedResponse<ProductWithDetails & { isLowStock: boolean }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = req.query.page !== undefined ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize !== undefined ? Number(req.query.pageSize) : 20;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const categoryId =
        typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
      const availability =
        typeof req.query.availability === 'string'
          ? (req.query.availability as ProductAvailability)
          : undefined;

      const sort =
        typeof req.query.sort === 'string'
          ? (req.query.sort as
              'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'stock_asc' | 'stock_desc')
          : 'stock_asc';

      const result = await this.products.listAdminProductsPaginated({
        page,
        pageSize,
        search,
        categoryId,
        availability,
        sort,
      });

      // Enhance with low stock threshold indicator (stock <= 3 and in_stock)
      const enhancedItems = result.items.map(item => ({
        ...item,
        isLowStock:
          item.availability === 'IN_STOCK' && item.stockQuantity > 0 && item.stockQuantity <= 3,
      }));

      res.status(200).json({
        success: true,
        data: enhancedItems,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/inventory/:productId
   * Adjust product stock quantity (set direct quantity or delta adjustment) and availability.
   */
  public adjustInventory = async (
    req: Request,
    res: Response<ApiSuccessResponse<ProductWithDetails>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = validateUuid(req.params.productId, 'Product ID');
      const updated = await this.products.adjustStock(productId, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // ORDER MANAGEMENT
  // ============================================================================

  /**
   * GET /api/admin/orders
   * Paginated order listing with filters (search, status, paymentStatus, date range, sort).
   */
  public listOrders = async (
    req: Request,
    res: Response<PaginatedResponse<AdminOrderListItemDto>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.orders.getAdminOrders(req.query as Record<string, unknown>);
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          page: result.pagination.page,
          pageSize: result.pagination.pageSize,
          totalItems: result.pagination.totalItems,
          totalPages: result.pagination.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/orders/:id
   * Complete immutable order snapshot, items, payments, customer contact, and fulfillment details.
   */
  public getOrder = async (
    req: Request,
    res: Response<ApiSuccessResponse<AdminOrderDetailsDto>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const order = await this.orders.getAdminOrderById(req.params.id);
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/orders/:id/status
   * Authoritative fulfillment status transition with concurrency guards.
   */
  public updateOrderStatus = async (
    req: Request,
    res: Response<ApiSuccessResponse<AdminOrderDetailsDto>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const updated = await this.orders.updateOrderStatusByAdmin(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // REVIEW MODERATION
  // ============================================================================

  /**
   * GET /api/admin/reviews
   * Paginated review listing with moderation filters (status, productId, search, sort).
   */
  public listReviews = async (
    req: Request,
    res: Response<PaginatedResponse<AdminReviewDto>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.reviews.listAdminReviews(req.query as Record<string, unknown>);
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/reviews/:id/status
   * Updates moderation status (PENDING, APPROVED, REJECTED) of a product review.
   */
  public updateReviewStatus = async (
    req: Request,
    res: Response<ApiSuccessResponse<AdminReviewDto>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.reviews.updateReviewStatusByAdmin(id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/admin/reviews/:id
   * Authoritatively deletes a product review by admin.
   */
  public deleteReview = async (
    req: Request,
    res: Response<{ success: true; message: string }>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.reviews.deleteReviewByAdmin(id);
      res.status(200).json({
        success: true,
        message: 'Review deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
