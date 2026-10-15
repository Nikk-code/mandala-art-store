import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAdminDashboard,
  fetchAdminProducts,
  fetchAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  toggleAdminProductStatus,
  addAdminProductImage,
  removeAdminProductImage,
  setPrimaryAdminProductImage,
  fetchAdminCategories,
  fetchAdminCategoryById,
  createAdminCategory,
  updateAdminCategory,
  toggleAdminCategoryStatus,
  deleteAdminCategory,
  fetchAdminInventory,
  adjustAdminInventory,
  fetchAdminOrders,
  fetchAdminOrderById,
  updateAdminOrderStatus,
} from '@/services/admin-service';
import * as apiClient from '@/services/api-client';
import type {
  AdminDashboardResponseData,
  AdminProductDto,
  AdminCategoryDto,
  AdminInventoryItemDto,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types';

describe('Admin Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAdminDashboard', () => {
    it('calls GET /api/admin/dashboard and returns payload data', async () => {
      const mockData: AdminDashboardResponseData = {
        admin: {
          id: 'admin-uuid-1',
          email: 'admin@mandala.test',
          firstName: 'Meera',
          lastName: 'Deshmukh',
          role: 'ADMIN',
        },
        system: {
          environment: 'test',
          serverTime: '2026-10-14T10:00:00.000Z',
          version: '0.1.0',
        },
        modules: [
          {
            id: 'catalog',
            name: 'Art Catalog Management',
            description: 'Catalog management tools',
            status: 'AVAILABLE',
            path: '/admin/products',
          },
        ],
      };

      const apiGetSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
        success: true,
        data: mockData,
      });

      const result = await fetchAdminDashboard();

      expect(apiGetSpy).toHaveBeenCalledWith('admin/dashboard');
      expect(result).toEqual(mockData);
      expect(result.admin.role).toBe('ADMIN');
    });

    it('propagates error when apiGet fails', async () => {
      vi.spyOn(apiClient, 'apiGet').mockRejectedValue(
        new Error('Forbidden: Admin access required')
      );

      await expect(fetchAdminDashboard()).rejects.toThrow('Forbidden: Admin access required');
    });
  });

  describe('Product Management API Calls', () => {
    const mockProduct: AdminProductDto = {
      id: 'prod-1',
      sku: 'MND-LOTUS-01',
      name: 'Sacred Lotus Mandala',
      slug: 'sacred-lotus-mandala',
      description: 'Hand-painted sacred geometry artwork.',
      shortDescription: 'Sacred art piece.',
      price: 1500000,
      compareAtPrice: 1800000,
      categoryId: 'cat-1',
      availability: 'IN_STOCK',
      stockQuantity: 5,
      dimensions: '30x30 cm',
      material: 'Acrylic on Canvas',
      weightGrams: 800,
      isHandmade: true,
      isFeatured: true,
      isActive: true,
      metaTitle: 'Sacred Lotus',
      metaDescription: 'Hand-painted mandala',
      createdAt: '2026-10-14T00:00:00.000Z',
      updatedAt: '2026-10-14T00:00:00.000Z',
      category: { id: 'cat-1', name: 'Mandalas', slug: 'mandalas' },
      images: [
        {
          id: 'img-1',
          url: 'https://images.mandala.test/lotus.jpg',
          altText: 'Lotus art',
          isPrimary: true,
          displayOrder: 0,
        },
      ],
    };

    it('fetchAdminProducts passes query params correctly', async () => {
      const getSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
        success: true,
        data: [mockProduct],
        pagination: { page: 2, pageSize: 10, totalItems: 1, totalPages: 1 },
      });

      const res = await fetchAdminProducts({
        page: 2,
        pageSize: 10,
        search: 'lotus',
        categoryId: 'cat-1',
        availability: 'IN_STOCK',
        isActive: true,
        sort: 'price_asc',
      });

      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('admin/products?'));
      const callArg = getSpy.mock.calls[0][0];
      expect(callArg).toContain('page=2');
      expect(callArg).toContain('pageSize=10');
      expect(callArg).toContain('search=lotus');
      expect(callArg).toContain('categoryId=cat-1');
      expect(callArg).toContain('availability=IN_STOCK');
      expect(callArg).toContain('isActive=true');
      expect(callArg).toContain('sort=price_asc');
      expect(res.items).toEqual([mockProduct]);
    });

    it('fetchAdminProductById calls GET admin/products/:id', async () => {
      const getSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
        success: true,
        data: mockProduct,
      });

      const res = await fetchAdminProductById('prod-1');
      expect(getSpy).toHaveBeenCalledWith('admin/products/prod-1');
      expect(res).toEqual(mockProduct);
    });

    it('createAdminProduct calls POST admin/products with input payload', async () => {
      const input: CreateProductInput = {
        name: 'New Art',
        sku: 'NEW-01',
        description: 'New art piece',
        price: 1200000,
        categoryId: 'cat-1',
        stockQuantity: 4,
      };

      const postSpy = vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
        success: true,
        data: mockProduct,
      });

      const res = await createAdminProduct(input);
      expect(postSpy).toHaveBeenCalledWith('admin/products', input);
      expect(res).toEqual(mockProduct);
    });

    it('updateAdminProduct calls PUT admin/products/:id with update payload', async () => {
      const updateData: UpdateProductInput = {
        name: 'Updated Name',
        price: 2000000,
      };

      const putSpy = vi.spyOn(apiClient, 'apiPut').mockResolvedValue({
        success: true,
        data: { ...mockProduct, name: 'Updated Name', price: 2000000 },
      });

      const res = await updateAdminProduct('prod-1', updateData);
      expect(putSpy).toHaveBeenCalledWith('admin/products/prod-1', updateData);
      expect(res.name).toBe('Updated Name');
    });

    it('toggleAdminProductStatus calls PATCH admin/products/:id/status', async () => {
      const patchSpy = vi.spyOn(apiClient, 'apiPatch').mockResolvedValue({
        success: true,
        data: { ...mockProduct, isActive: false },
      });

      const res = await toggleAdminProductStatus('prod-1', false);
      expect(patchSpy).toHaveBeenCalledWith('admin/products/prod-1/status', { isActive: false });
      expect(res.isActive).toBe(false);
    });

    it('addAdminProductImage calls POST admin/products/:id/images', async () => {
      const newImg = {
        id: 'img-2',
        url: 'https://images.mandala.test/detail.jpg',
        altText: 'Detail view',
        isPrimary: false,
        displayOrder: 1,
      };

      const postSpy = vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
        success: true,
        data: newImg,
      });

      const res = await addAdminProductImage('prod-1', {
        url: newImg.url,
        altText: newImg.altText,
        displayOrder: 1,
      });

      expect(postSpy).toHaveBeenCalledWith('admin/products/prod-1/images', {
        url: newImg.url,
        altText: newImg.altText,
        displayOrder: 1,
      });
      expect(res).toEqual(newImg);
    });

    it('removeAdminProductImage calls DELETE admin/products/:id/images/:imageId', async () => {
      const delSpy = vi.spyOn(apiClient, 'apiDelete').mockResolvedValue({
        success: true,
      });

      await removeAdminProductImage('prod-1', 'img-2');
      expect(delSpy).toHaveBeenCalledWith('admin/products/prod-1/images/img-2');
    });

    it('setPrimaryAdminProductImage calls POST admin/products/:id/images/:imageId/primary', async () => {
      const postSpy = vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
        success: true,
      });

      await setPrimaryAdminProductImage('prod-1', 'img-2');
      expect(postSpy).toHaveBeenCalledWith('admin/products/prod-1/images/img-2/primary');
    });
  });

  describe('Category Management API Calls', () => {
    const mockCat: AdminCategoryDto = {
      id: 'cat-1',
      name: 'Mandalas',
      slug: 'mandalas',
      description: 'Sacred circular geometric patterns',
      imageUrl: 'https://images.mandala.test/category.jpg',
      displayOrder: 1,
      isActive: true,
      productCount: 8,
      createdAt: '2026-10-14T00:00:00.000Z',
      updatedAt: '2026-10-14T00:00:00.000Z',
    };

    it('fetchAdminCategories calls GET admin/categories', async () => {
      const getSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
        success: true,
        data: [mockCat],
      });

      const res = await fetchAdminCategories();
      expect(getSpy).toHaveBeenCalledWith('admin/categories');
      expect(res).toEqual([mockCat]);
    });

    it('fetchAdminCategoryById calls GET admin/categories/:id', async () => {
      const getSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
        success: true,
        data: mockCat,
      });

      const res = await fetchAdminCategoryById('cat-1');
      expect(getSpy).toHaveBeenCalledWith('admin/categories/cat-1');
      expect(res).toEqual(mockCat);
    });

    it('createAdminCategory calls POST admin/categories with category payload', async () => {
      const input: CreateCategoryInput = {
        name: 'Lippan Art',
        description: 'Mud and mirror work',
        displayOrder: 2,
      };

      const postSpy = vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
        success: true,
        data: { ...mockCat, name: 'Lippan Art' },
      });

      const res = await createAdminCategory(input);
      expect(postSpy).toHaveBeenCalledWith('admin/categories', input);
      expect(res.name).toBe('Lippan Art');
    });

    it('updateAdminCategory calls PUT admin/categories/:id', async () => {
      const input: UpdateCategoryInput = {
        name: 'Updated Mandalas',
      };

      const putSpy = vi.spyOn(apiClient, 'apiPut').mockResolvedValue({
        success: true,
        data: { ...mockCat, name: 'Updated Mandalas' },
      });

      const res = await updateAdminCategory('cat-1', input);
      expect(putSpy).toHaveBeenCalledWith('admin/categories/cat-1', input);
      expect(res.name).toBe('Updated Mandalas');
    });

    it('toggleAdminCategoryStatus calls PATCH admin/categories/:id/status', async () => {
      const patchSpy = vi.spyOn(apiClient, 'apiPatch').mockResolvedValue({
        success: true,
        data: { ...mockCat, isActive: false },
      });

      const res = await toggleAdminCategoryStatus('cat-1', false);
      expect(patchSpy).toHaveBeenCalledWith('admin/categories/cat-1/status', { isActive: false });
      expect(res.isActive).toBe(false);
    });

    it('deleteAdminCategory calls DELETE admin/categories/:id', async () => {
      const delSpy = vi.spyOn(apiClient, 'apiDelete').mockResolvedValue({
        success: true,
      });

      await deleteAdminCategory('cat-1');
      expect(delSpy).toHaveBeenCalledWith('admin/categories/cat-1');
    });
  });

  describe('Inventory Management API Calls', () => {
    const mockInvItem: AdminInventoryItemDto = {
      id: 'prod-1',
      sku: 'MND-LOTUS-01',
      name: 'Sacred Lotus Mandala',
      slug: 'sacred-lotus-mandala',
      description: 'Artwork',
      shortDescription: null,
      price: 1500000,
      compareAtPrice: null,
      categoryId: 'cat-1',
      availability: 'IN_STOCK',
      stockQuantity: 2,
      dimensions: null,
      material: null,
      weightGrams: null,
      isHandmade: true,
      isFeatured: false,
      isActive: true,
      metaTitle: null,
      metaDescription: null,
      createdAt: '2026-10-14T00:00:00.000Z',
      updatedAt: '2026-10-14T00:00:00.000Z',
      category: { id: 'cat-1', name: 'Mandalas', slug: 'mandalas' },
      images: [],
      isLowStock: true,
    };

    it('fetchAdminInventory passes query options to GET admin/inventory', async () => {
      const getSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
        success: true,
        data: [mockInvItem],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      });

      const res = await fetchAdminInventory({
        page: 1,
        pageSize: 20,
        search: 'Lotus',
        availability: 'IN_STOCK',
      });

      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('admin/inventory?'));
      const urlArg = getSpy.mock.calls[0][0];
      expect(urlArg).toContain('page=1');
      expect(urlArg).toContain('pageSize=20');
      expect(urlArg).toContain('search=Lotus');
      expect(urlArg).toContain('availability=IN_STOCK');
      expect(res.items[0].isLowStock).toBe(true);
    });

    it('adjustAdminInventory calls PATCH admin/inventory/:id', async () => {
      const patchSpy = vi.spyOn(apiClient, 'apiPatch').mockResolvedValue({
        success: true,
        data: { ...mockInvItem, stockQuantity: 10, isLowStock: false },
      });

      const res = await adjustAdminInventory('prod-1', {
        stockQuantity: 10,
        availability: 'IN_STOCK',
      });

      expect(patchSpy).toHaveBeenCalledWith('admin/inventory/prod-1', {
        stockQuantity: 10,
        availability: 'IN_STOCK',
      });
      expect(res.stockQuantity).toBe(10);
    });
  });

  describe('Admin Order Management Service', () => {
    const mockOrderSummary = {
      id: 'order-1',
      orderNumber: 'MAT-20261005-7F2A9C',
      customerEmail: 'customer@mandala.test',
      customerPhone: '9876543210',
      shippingRecipientName: 'Priya Sharma',
      isGuest: false,
      userId: 'user-1',
      status: 'CONFIRMED' as const,
      paymentStatus: 'CAPTURED' as const,
      total: 149900,
      itemCount: 1,
      trackingNumber: null,
      courierName: null,
      createdAt: '2026-10-05T10:00:00.000Z',
      updatedAt: '2026-10-05T10:05:00.000Z',
    };

    const mockOrderDetails = {
      ...mockOrderSummary,
      subtotal: 149900,
      discountAmount: 0,
      shippingFee: 0,
      taxAmount: 0,
      currency: 'INR',
      couponCode: null,
      customer: {
        userId: 'user-1',
        email: 'customer@mandala.test',
        phone: '9876543210',
        isGuest: false,
        registeredName: 'Priya Sharma',
      },
      shippingAddress: {
        recipientName: 'Priya Sharma',
        phone: '9876543210',
        addressLine1: 'Flat 101, Lotus Apts',
        addressLine2: null,
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productName: 'Sacred Lotus Mandala',
          productSku: 'MND-LOTUS-01',
          unitPrice: 149900,
          quantity: 1,
          total: 149900,
        },
      ],
      payments: [
        {
          id: 'pay-1',
          provider: 'razorpay',
          providerOrderId: 'order_123',
          providerPaymentId: 'pay_123',
          amount: 149900,
          currency: 'INR',
          status: 'CAPTURED' as const,
          paidAt: '2026-10-05T10:05:00.000Z',
          failureReason: null,
          createdAt: '2026-10-05T10:00:00.000Z',
        },
      ],
      fulfillment: {
        trackingNumber: null,
        courierName: null,
        customerNotes: null,
      },
    };

    it('fetchAdminOrders calls GET admin/orders with query parameters', async () => {
      const getSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
        success: true,
        data: [mockOrderSummary],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      });

      const res = await fetchAdminOrders({
        page: 1,
        pageSize: 20,
        search: 'MAT',
        status: 'CONFIRMED',
        paymentStatus: 'CAPTURED',
      });

      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('admin/orders?'));
      const urlArg = getSpy.mock.calls[0][0];
      expect(urlArg).toContain('page=1');
      expect(urlArg).toContain('pageSize=20');
      expect(urlArg).toContain('search=MAT');
      expect(urlArg).toContain('status=CONFIRMED');
      expect(urlArg).toContain('paymentStatus=CAPTURED');
      expect(res.items).toHaveLength(1);
      expect(res.items[0].orderNumber).toBe('MAT-20261005-7F2A9C');
    });

    it('fetchAdminOrderById calls GET admin/orders/:id', async () => {
      const getSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
        success: true,
        data: mockOrderDetails,
      });

      const res = await fetchAdminOrderById('order-1');
      expect(getSpy).toHaveBeenCalledWith('admin/orders/order-1');
      expect(res.id).toBe('order-1');
      expect(res.customer.email).toBe('customer@mandala.test');
    });

    it('updateAdminOrderStatus calls PATCH admin/orders/:id/status', async () => {
      const patchSpy = vi.spyOn(apiClient, 'apiPatch').mockResolvedValue({
        success: true,
        data: {
          ...mockOrderDetails,
          status: 'SHIPPED',
          fulfillment: {
            trackingNumber: 'TRK-98765',
            courierName: 'Delhivery',
            customerNotes: null,
          },
        },
      });

      const res = await updateAdminOrderStatus('order-1', {
        status: 'SHIPPED',
        trackingNumber: 'TRK-98765',
        courierName: 'Delhivery',
      });

      expect(patchSpy).toHaveBeenCalledWith('admin/orders/order-1/status', {
        status: 'SHIPPED',
        trackingNumber: 'TRK-98765',
        courierName: 'Delhivery',
      });
      expect(res.status).toBe('SHIPPED');
      expect(res.fulfillment.courierName).toBe('Delhivery');
    });
  });
});
