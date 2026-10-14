import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../src/app';
import { userRepository } from '../src/repositories/user.repository';
import { productService, categoryService } from '../src/services';
import { ConflictError, ValidationError } from '../src/errors';
import { config } from '../src/config/env';

describe('Admin REST API Endpoints (/api/admin)', () => {
  const adminUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const customerUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  const sampleAdmin = {
    id: adminUserId,
    email: 'admin@mandala.test',
    passwordHash: 'secret_hash_not_exposed',
    firstName: 'Meera',
    lastName: 'Deshmukh',
    phone: '9876543210',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
  };

  const sampleCustomer = {
    id: customerUserId,
    email: 'customer@mandala.test',
    passwordHash: 'customer_secret_hash',
    firstName: 'Rohan',
    lastName: 'Verma',
    phone: '9123456780',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T10:00:00.000Z'),
    updatedAt: new Date('2026-10-05T10:00:00.000Z'),
  };

  function createToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/admin/dashboard', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/dashboard');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects tampered or forged JWT signature with 401 Unauthorized', async () => {
      const forgedToken = jwt.sign(
        { id: adminUserId, email: sampleAdmin.email, role: 'ADMIN' },
        'wrong_secret_signature'
      );

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects authenticated CUSTOMER with 403 Forbidden', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleCustomer);

      const customerToken = createToken({
        id: customerUserId,
        email: sampleCustomer.email,
        role: 'CUSTOMER',
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('Administrator access required');
    });

    it('rejects customer even if role: ADMIN is injected in query or body', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleCustomer);

      const customerToken = createToken({
        id: customerUserId,
        email: sampleCustomer.email,
        role: 'CUSTOMER',
      });

      const res = await request(app)
        .get('/api/admin/dashboard?role=ADMIN')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects deactivated administrator with 401 Unauthorized', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue({
        ...sampleAdmin,
        isActive: false,
      });

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('deactivated');
    });

    it('successfully returns dashboard metadata to authenticated ADMIN via Authorization header', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin).toEqual({
        id: adminUserId,
        email: 'admin@mandala.test',
        firstName: 'Meera',
        lastName: 'Deshmukh',
        role: 'ADMIN',
      });
      expect(res.body.data.system).toBeDefined();
      expect(res.body.data.system.environment).toBe(config.nodeEnv);
      expect(Array.isArray(res.body.data.modules)).toBe(true);
      expect(res.body.data.modules.length).toBeGreaterThan(0);

      // Verify no passwords, hashes, or secrets are leaked
      expect(res.body.data.admin.passwordHash).toBeUndefined();
      expect(res.body.data.admin.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('secret_hash_not_exposed');
    });

    it('successfully returns dashboard metadata to authenticated ADMIN via HttpOnly cookie', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `auth_token=${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.role).toBe('ADMIN');
    });
  });

  describe('Non-Admin Access Rejection Across All Admin Endpoints', () => {
    it('rejects unauthenticated requests to mutating admin routes with 401 Unauthorized', async () => {
      const endpoints = [
        { method: 'post', path: '/api/admin/products' },
        { method: 'put', path: '/api/admin/products/11111111-1111-4111-8111-111111111111' },
        {
          method: 'patch',
          path: '/api/admin/products/11111111-1111-4111-8111-111111111111/status',
        },
        { method: 'post', path: '/api/admin/categories' },
        { method: 'patch', path: '/api/admin/inventory/11111111-1111-4111-8111-111111111111' },
      ];

      for (const ep of endpoints) {
        // @ts-expect-error dynamic method
        const res = await request(app)[ep.method](ep.path);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('rejects customer requests to admin routes with 403 Forbidden', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleCustomer);
      const customerToken = createToken({
        id: customerUserId,
        email: sampleCustomer.email,
        role: 'CUSTOMER',
      });

      const endpoints = [
        { method: 'get', path: '/api/admin/products' },
        { method: 'post', path: '/api/admin/products' },
        { method: 'get', path: '/api/admin/categories' },
        { method: 'post', path: '/api/admin/categories' },
        { method: 'get', path: '/api/admin/inventory' },
      ];

      for (const ep of endpoints) {
        // @ts-expect-error dynamic method
        const res = await request(app)
          [ep.method](ep.path)
          .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('Product Management API (/api/admin/products)', () => {
    const categoryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const productId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const imageId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

    const testCategory = {
      id: categoryId,
      name: 'Mandala Art',
      slug: 'mandala-art',
      description: 'Sacred artworks',
      imageUrl: 'https://example.com/cat.jpg',
      displayOrder: 1,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const testProduct = {
      id: productId,
      sku: 'MND-LOTUS-01',
      name: 'Sacred Lotus Mandala',
      slug: 'sacred-lotus-mandala',
      description: 'Acrylic painting on canvas',
      shortDescription: 'Lotus mandala',
      price: 149900,
      compareAtPrice: 199900,
      categoryId,
      availability: 'IN_STOCK' as const,
      stockQuantity: 5,
      dimensions: '12x12 inches',
      material: 'Acrylic on canvas',
      weightGrams: 800,
      isHandmade: true,
      isFeatured: true,
      isActive: true,
      metaTitle: 'Sacred Lotus Mandala',
      metaDescription: 'Handmade painting',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      category: testCategory,
      images: [
        {
          id: imageId,
          productId,
          url: 'https://example.com/lotus.jpg',
          altText: 'Primary image',
          displayOrder: 0,
          isPrimary: true,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
    };

    it('GET /api/admin/products returns paginated products to admin', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'listAdminProductsPaginated').mockResolvedValue({
        items: [testProduct as any],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      });

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/admin/products?search=Lotus&page=1&pageSize=20')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.totalItems).toBe(1);
    });

    it('POST /api/admin/products creates product with paise pricing', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'createProduct').mockResolvedValue(testProduct as any);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const payload = {
        name: 'Sacred Lotus Mandala',
        sku: 'MND-LOTUS-01',
        description: 'Acrylic painting on canvas',
        price: 149900,
        categoryId,
        stockQuantity: 5,
        availability: 'IN_STOCK',
      };

      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(149900);
    });

    it('POST /api/admin/products rejects negative price with 400 Validation Error', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Price Artwork',
          sku: 'MND-BAD-01',
          description: 'A test piece',
          price: -500, // Invalid negative paise
          categoryId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('PUT /api/admin/products/:id updates product attributes', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'updateProduct').mockResolvedValue({
        ...testProduct,
        name: 'Updated Lotus Mandala',
      } as any);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .put(`/api/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Lotus Mandala' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Lotus Mandala');
    });

    it('PATCH /api/admin/products/:id/status toggles product active state', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'toggleProductActive').mockResolvedValue({
        ...testProduct,
        isActive: false,
      } as any);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .patch(`/api/admin/products/${productId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });

    it('POST /api/admin/products/:id/images adds an image to gallery', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'addImage').mockResolvedValue(testProduct.images[0] as any);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .post(`/api/admin/products/${productId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          url: 'https://example.com/lotus.jpg',
          altText: 'Primary image',
          displayOrder: 0,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toBe('https://example.com/lotus.jpg');
    });

    it('DELETE /api/admin/products/:id/images/:imageId removes an image', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'removeImage').mockResolvedValue(testProduct.images[0] as any);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .delete(`/api/admin/products/${productId}/images/${imageId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Category Management API (/api/admin/categories)', () => {
    const categoryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    const testCategoryWithCount = {
      id: categoryId,
      name: 'Mandala Art',
      slug: 'mandala-art',
      description: 'Sacred artworks',
      imageUrl: 'https://example.com/cat.jpg',
      displayOrder: 1,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      productCount: 4,
    };

    it('GET /api/admin/categories returns all categories with productCount', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(categoryService, 'listAllCategories').mockResolvedValue([testCategoryWithCount]);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].productCount).toBe(4);
    });

    it('POST /api/admin/categories creates a new category', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(categoryService, 'createCategory').mockResolvedValue(testCategoryWithCount);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Mandala Art',
          description: 'Sacred artworks',
          imageUrl: 'https://example.com/cat.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Mandala Art');
    });

    it('PATCH /api/admin/categories/:id/status rejects deactivation when active products depend on category', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(categoryService, 'toggleCategoryActive').mockRejectedValue(
        new ConflictError('Cannot deactivate category because 4 active products belong to it.')
      );

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .patch(`/api/admin/categories/${categoryId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('Inventory Management API (/api/admin/inventory)', () => {
    const productId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

    const testInventoryProduct = {
      id: productId,
      sku: 'MND-LOTUS-01',
      name: 'Sacred Lotus Mandala',
      stockQuantity: 2,
      availability: 'IN_STOCK',
      category: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Mandala Art' },
      images: [],
    };

    it('GET /api/admin/inventory returns inventory items with low-stock flags', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'listAdminProductsPaginated').mockResolvedValue({
        items: [testInventoryProduct as any],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      });

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].stockQuantity).toBe(2);
      expect(res.body.data[0].isLowStock).toBe(true); // <= 3 and IN_STOCK
    });

    it('PATCH /api/admin/inventory/:productId adjusts stock quantity', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'adjustStock').mockResolvedValue({
        ...testInventoryProduct,
        stockQuantity: 10,
      } as any);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .patch(`/api/admin/inventory/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stockQuantity: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stockQuantity).toBe(10);
    });

    it('PATCH /api/admin/inventory/:productId rejects negative stock adjustment with 400', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'adjustStock').mockRejectedValue(
        new ValidationError('Cannot reduce stock below 0.')
      );

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .patch(`/api/admin/inventory/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: -100 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('PATCH /api/admin/inventory/:productId rejects stale stock adjustment with 409 Conflict', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'adjustStock').mockRejectedValue(
        new ConflictError('Stock quantity conflict. Expected stock was 10, but current stock is 8.')
      );

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .patch(`/api/admin/inventory/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stockQuantity: 10, expectedStock: 10 });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('PATCH /api/admin/inventory/:productId accepts forced physical recount with 200', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'adjustStock').mockResolvedValue({
        ...testInventoryProduct,
        stockQuantity: 15,
      } as any);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .patch(`/api/admin/inventory/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stockQuantity: 15, expectedStock: 10, force: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stockQuantity).toBe(15);
    });

    it('PATCH /api/admin/inventory/:productId rejects concurrent depletion conflict with 409', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);
      vi.spyOn(productService, 'adjustStock').mockRejectedValue(
        new ConflictError('Cannot reduce stock by 5. Available stock is 2.')
      );

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .patch(`/api/admin/inventory/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: -5 });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });
});
