import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { categoryService, productService } from '../src/services';
import { NotFoundError } from '../src/errors';
import { ProductAvailability, type Category } from '@prisma/client';
import type { ProductWithDetails } from '../src/repositories/product.repository';

describe('Catalog REST API Endpoints', () => {
  const sampleCategory: Category = {
    id: 'cat-1',
    name: 'Mandala Art',
    slug: 'mandala-art',
    description: 'Sacred geometric patterns and spiritual art',
    imageUrl: 'https://images.example.com/cat-mandala.jpg',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const sampleProduct: ProductWithDetails = {
    id: 'prod-1',
    sku: 'MND-LOTUS-01',
    name: 'Sacred Lotus Mandala',
    slug: 'sacred-lotus-mandala',
    description: '12x12 inch acrylic mandala on stretched canvas',
    shortDescription: 'Intricate lotus mandala on canvas',
    price: 149900, // ₹1,499.00
    compareAtPrice: 199900, // ₹1,999.00
    categoryId: 'cat-1',
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 1,
    dimensions: '12 × 12 inches',
    material: 'Acrylic on canvas',
    weightGrams: 850,
    isHandmade: true,
    isFeatured: true,
    isActive: true,
    metaTitle: 'Sacred Lotus Mandala - Handmade Art',
    metaDescription: 'Buy handmade Sacred Lotus Mandala painting.',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    category: sampleCategory,
    images: [
      {
        id: 'img-1',
        productId: 'prod-1',
        url: 'https://images.example.com/lotus-1.jpg',
        altText: 'Sacred Lotus Mandala full view',
        displayOrder: 0,
        isPrimary: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ----------------------------------------------------------------------------
  // 1. GET /api/categories
  // ----------------------------------------------------------------------------
  describe('GET /api/categories', () => {
    it('returns 200 with list of active categories in standard response format', async () => {
      vi.spyOn(categoryService, 'listActiveCategories').mockResolvedValue([sampleCategory]);

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toEqual({
        id: 'cat-1',
        name: 'Mandala Art',
        slug: 'mandala-art',
        description: 'Sacred geometric patterns and spiritual art',
        imageUrl: 'https://images.example.com/cat-mandala.jpg',
        displayOrder: 1,
      });
    });

    it('handles unexpected errors via centralized error middleware', async () => {
      vi.spyOn(categoryService, 'listActiveCategories').mockRejectedValue(
        new Error('Database query failed')
      );

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  // ----------------------------------------------------------------------------
  // 2. GET /api/products
  // ----------------------------------------------------------------------------
  describe('GET /api/products', () => {
    it('returns 200 with paginated active products and default pagination', async () => {
      vi.spyOn(productService, 'listActiveProductsPaginated').mockResolvedValue({
        items: [sampleProduct],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      });

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      });
      expect(res.body.data.items).toHaveLength(1);

      const item = res.body.data.items[0];
      expect(item.id).toBe('prod-1');
      expect(item.sku).toBe('MND-LOTUS-01');
      expect(item.name).toBe('Sacred Lotus Mandala');
      expect(item.price).toBe(149900);
      expect(item.compareAtPrice).toBe(199900);
      expect(item.availability).toBe('IN_STOCK');
      expect(item.category).toEqual({
        id: 'cat-1',
        name: 'Mandala Art',
        slug: 'mandala-art',
      });
      expect(item.images).toHaveLength(1);
      // Confirms raw stockQuantity is NOT exposed
      expect(item.stockQuantity).toBeUndefined();
    });

    it('passes pagination and filter query params correctly to service', async () => {
      const spy = vi.spyOn(productService, 'listActiveProductsPaginated').mockResolvedValue({
        items: [],
        pagination: {
          page: 2,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
        },
      });

      const res = await request(app).get(
        '/api/products?page=2&pageSize=10&category=mandala-art&availability=IN_STOCK&featured=true&sort=price_asc'
      );

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        category: 'mandala-art',
        availability: 'IN_STOCK',
        featured: true,
        sort: 'price_asc',
      });
    });

    it('returns 400 when page is invalid', async () => {
      const res = await request(app).get('/api/products?page=0');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when pageSize exceeds maximum limit', async () => {
      const res = await request(app).get('/api/products?pageSize=200');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when featured is not boolean string', async () => {
      const res = await request(app).get('/api/products?featured=yes');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when sort option is unsupported', async () => {
      const res = await request(app).get('/api/products?sort=popularity');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when requested category slug is not found or inactive', async () => {
      vi.spyOn(productService, 'listActiveProductsPaginated').mockRejectedValue(
        new NotFoundError('Active category not found with slug: nonexistent')
      );

      const res = await request(app).get('/api/products?category=nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ----------------------------------------------------------------------------
  // 3. GET /api/products/:slug
  // ----------------------------------------------------------------------------
  describe('GET /api/products/:slug', () => {
    it('returns 200 with product details for valid active product slug', async () => {
      vi.spyOn(productService, 'getProductBySlug').mockResolvedValue(sampleProduct);

      const res = await request(app).get('/api/products/sacred-lotus-mandala');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.id).toBe('prod-1');
      expect(data.slug).toBe('sacred-lotus-mandala');
      expect(data.name).toBe('Sacred Lotus Mandala');
      expect(data.price).toBe(149900);
      expect(data.metaTitle).toBe('Sacred Lotus Mandala - Handmade Art');
      expect(data.category).toEqual({
        id: 'cat-1',
        name: 'Mandala Art',
        slug: 'mandala-art',
        description: 'Sacred geometric patterns and spiritual art',
      });
      expect(data.images).toHaveLength(1);
      expect(data.images[0].isPrimary).toBe(true);
      // Raw stockQuantity must not be exposed
      expect(data.stockQuantity).toBeUndefined();
    });

    it('returns 404 when product slug is not found or inactive', async () => {
      vi.spyOn(productService, 'getProductBySlug').mockRejectedValue(
        new NotFoundError('Product not found with slug: nonexistent-art')
      );

      const res = await request(app).get('/api/products/nonexistent-art');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
