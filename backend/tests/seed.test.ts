import { describe, it, expect, vi } from 'vitest';
import { SEED_CATEGORIES, SEED_PRODUCTS, seedCatalog } from '../prisma/seed';
import { ProductAvailability, PrismaClient } from '@prisma/client';

describe('Controlled Catalog Seed Foundation', () => {
  describe('Seed Data Integrity & Business Rules', () => {
    it('contains expected categories with unique slugs and valid display orders', () => {
      expect(SEED_CATEGORIES).toHaveLength(3);

      const slugs = SEED_CATEGORIES.map(c => c.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(SEED_CATEGORIES.length);
      expect(slugs).toContain('mandala-art');
      expect(slugs).toContain('lippan-art');
      expect(slugs).toContain('handmade-paintings');

      for (const cat of SEED_CATEGORIES) {
        expect(cat.name).toBeTruthy();
        expect(cat.description).toBeTruthy();
        expect(cat.imageUrl).toMatch(/^https?:\/\//);
        expect(cat.displayOrder).toBeGreaterThan(0);
      }
    });

    it('contains expected products with unique SKUs and unique slugs', () => {
      expect(SEED_PRODUCTS.length).toBeGreaterThanOrEqual(8);
      expect(SEED_PRODUCTS.length).toBeLessThanOrEqual(12);

      const skus = SEED_PRODUCTS.map(p => p.sku);
      const uniqueSkus = new Set(skus);
      expect(uniqueSkus.size).toBe(SEED_PRODUCTS.length);

      const slugs = SEED_PRODUCTS.map(p => p.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(SEED_PRODUCTS.length);
    });

    it('ensures all products belong to a valid seed category', () => {
      const validCategorySlugs = new Set(SEED_CATEGORIES.map(c => c.slug));

      for (const product of SEED_PRODUCTS) {
        expect(validCategorySlugs.has(product.categorySlug)).toBe(true);
      }
    });

    it('enforces pricing in integer paise and valid compareAtPrice rules', () => {
      for (const product of SEED_PRODUCTS) {
        expect(Number.isInteger(product.price)).toBe(true);
        expect(product.price).toBeGreaterThan(0);

        if (product.compareAtPrice !== null) {
          expect(Number.isInteger(product.compareAtPrice)).toBe(true);
          expect(product.compareAtPrice).toBeGreaterThanOrEqual(product.price);
        }
      }
    });

    it('enforces availability state consistency and stock quantity rules', () => {
      const inStock = SEED_PRODUCTS.filter(p => p.availability === ProductAvailability.IN_STOCK);
      const madeToOrder = SEED_PRODUCTS.filter(
        p => p.availability === ProductAvailability.MADE_TO_ORDER
      );
      const soldOut = SEED_PRODUCTS.filter(p => p.availability === ProductAvailability.SOLD_OUT);

      expect(inStock.length).toBeGreaterThan(0);
      expect(madeToOrder.length).toBeGreaterThanOrEqual(2);
      expect(soldOut.length).toBeGreaterThanOrEqual(1);

      // IN_STOCK must have stockQuantity > 0
      for (const p of inStock) {
        expect(p.stockQuantity).toBeGreaterThan(0);
      }

      // SOLD_OUT must have stockQuantity === 0
      for (const p of soldOut) {
        expect(p.stockQuantity).toBe(0);
      }
    });

    it('marks a proper subset of products as featured', () => {
      const featured = SEED_PRODUCTS.filter(p => p.isFeatured);
      expect(featured.length).toBeGreaterThanOrEqual(2);
      expect(featured.length).toBeLessThan(SEED_PRODUCTS.length);
    });

    it('ensures every product has at least one image and exactly one primary image', () => {
      for (const product of SEED_PRODUCTS) {
        expect(product.images.length).toBeGreaterThanOrEqual(1);

        const primaryImages = product.images.filter(img => img.isPrimary);
        expect(primaryImages).toHaveLength(1);

        for (const img of product.images) {
          expect(img.url).toMatch(/^https?:\/\//);
          expect(img.altText).toBeTruthy();
        }
      }
    });
  });

  describe('seedCatalog Function Idempotency Contract', () => {
    it('executes upsert operations without duplicating categories or products', async () => {
      const mockCategoryUpsert = vi.fn().mockImplementation(({ where }) => ({
        id: `cat-id-${where.slug}`,
        ...where,
      }));

      const mockProductUpsert = vi.fn().mockImplementation(({ where }) => ({
        id: `prod-id-${where.sku}`,
        ...where,
      }));

      const mockProductImageDeleteMany = vi.fn().mockResolvedValue({ count: 2 });
      const mockProductImageCreateMany = vi.fn().mockResolvedValue({ count: 2 });

      const mockPrisma = {
        category: {
          upsert: mockCategoryUpsert,
        },
        product: {
          upsert: mockProductUpsert,
        },
        productImage: {
          deleteMany: mockProductImageDeleteMany,
          createMany: mockProductImageCreateMany,
        },
      } as unknown as PrismaClient;

      const result1 = await seedCatalog(mockPrisma);
      expect(result1.categoriesCount).toBe(SEED_CATEGORIES.length);
      expect(result1.productsCount).toBe(SEED_PRODUCTS.length);
      expect(mockCategoryUpsert).toHaveBeenCalledTimes(SEED_CATEGORIES.length);
      expect(mockProductUpsert).toHaveBeenCalledTimes(SEED_PRODUCTS.length);

      // Second run (testing idempotency)
      const result2 = await seedCatalog(mockPrisma);
      expect(result2.categoriesCount).toBe(SEED_CATEGORIES.length);
      expect(result2.productsCount).toBe(SEED_PRODUCTS.length);
    });
  });
});
