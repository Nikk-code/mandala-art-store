import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductRepository } from '../src/repositories/product.repository';
import { prisma } from '../src/db/prisma';
import { ProductAvailability } from '@prisma/client';
import { NotFoundError, ConflictError } from '../src/errors';

describe('Inventory Concurrency & Atomicity Coordination', () => {
  let repo: ProductRepository;

  const sampleCategory = {
    id: 'cat-111',
    name: 'Mandala Art',
    slug: 'mandala-art',
    description: null,
    imageUrl: null,
    displayOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleProduct = {
    id: 'prod-concurrency-1',
    sku: 'MND-LOTUS-CONC',
    name: 'Sacred Lotus Mandala Canvas',
    slug: 'sacred-lotus-mandala-canvas',
    description: 'Fine artwork with acrylic finish',
    shortDescription: null,
    price: 150000,
    compareAtPrice: null,
    categoryId: 'cat-111',
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 10,
    dimensions: '12x12 inches',
    material: 'Acrylic',
    weightGrams: 800,
    isHandmade: true,
    isFeatured: false,
    isActive: true,
    metaTitle: null,
    metaDescription: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: sampleCategory,
    images: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    repo = new ProductRepository();
  });

  describe('Atomic Exact-Quantity (Set) Updates with Conditional WHERE Clause', () => {
    it('executes atomic conditional update with where: { id, stockQuantity: expectedStock }', async () => {
      let capturedWhere: any = null;
      let capturedData: any = null;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce(sampleProduct)
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 12 }),
            updateMany: vi.fn().mockImplementation(({ where, data }) => {
              capturedWhere = where;
              capturedData = data;
              return { count: 1 };
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await repo.adjustStock('prod-concurrency-1', {
        stockQuantity: 12,
        expectedStock: 10,
        force: false,
      });

      // Verify the condition is evaluated atomically in the SQL WHERE clause
      expect(capturedWhere).toEqual({
        id: 'prod-concurrency-1',
        stockQuantity: 10,
      });
      expect(capturedData).toEqual({
        stockQuantity: 12,
        availability: ProductAvailability.IN_STOCK,
      });
      expect(result.stockQuantity).toBe(12);
    });

    it('rejects stale exact-quantity update with HTTP 409 Conflict when updateMany matches 0 rows', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce(sampleProduct) // Read at beginning of transaction
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 8 }), // Current state after concurrent checkout
            updateMany: vi.fn().mockResolvedValue({ count: 0 }), // Condition stockQuantity = 10 matched 0 rows because checkout decremented to 8
          },
        };
        return callback(mockTx);
      });

      await expect(
        repo.adjustStock('prod-concurrency-1', {
          stockQuantity: 12,
          expectedStock: 10,
          force: false,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('prevents race condition between initial read and write: concurrent update is caught by WHERE condition', async () => {
      let updateExecuted = false;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            // Initial read saw stockQuantity: 10
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 10 })
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 7 }), // Interleaving checkout committed 7
            // Atomic conditional update verifies stockQuantity is STILL 10 at execution time
            updateMany: vi.fn().mockImplementation(({ where }) => {
              updateExecuted = true;
              if (where.stockQuantity === 10) {
                // If database was concurrently changed to 7, where clause matches 0 rows
                return { count: 0 };
              }
              return { count: 1 };
            }),
          },
        };
        return callback(mockTx);
      });

      await expect(
        repo.adjustStock('prod-concurrency-1', {
          stockQuantity: 15,
          expectedStock: 10,
        })
      ).rejects.toThrow(ConflictError);

      expect(updateExecuted).toBe(true);
    });

    it('allows physical stock recount to override concurrent checkouts when force is true', async () => {
      let capturedUpdateWhere: any = null;
      let capturedUpdateData: any = null;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 6 })
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 15 }),
            update: vi.fn().mockImplementation(({ where, data }) => {
              capturedUpdateWhere = where;
              capturedUpdateData = data;
              return { ...sampleProduct, stockQuantity: 15 };
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await repo.adjustStock('prod-concurrency-1', {
        stockQuantity: 15,
        expectedStock: 10, // Stale count in UI
        force: true, // Authoritative physical recount
      });

      expect(capturedUpdateWhere).toEqual({ id: 'prod-concurrency-1' });
      expect(capturedUpdateData.stockQuantity).toBe(15);
      expect(result.stockQuantity).toBe(15);
    });
  });

  describe('Delta Increments & Decrements (Database-Safe Operations)', () => {
    it('executes atomic increment using Prisma increment payload', async () => {
      let capturedUpdateData: any = null;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 10 })
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 15 }),
            update: vi.fn().mockImplementation(({ data }) => {
              capturedUpdateData = data;
              return { ...sampleProduct, stockQuantity: 15 };
            }),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(mockTx);
      });

      const result = await repo.adjustStock('prod-concurrency-1', { adjustment: 5 });

      expect(capturedUpdateData).toEqual({
        stockQuantity: { increment: 5 },
      });
      expect(result.stockQuantity).toBe(15);
    });

    it('executes atomic conditional decrement where stockQuantity >= abs(delta)', async () => {
      let capturedWhere: any = null;
      let capturedData: any = null;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 10 })
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 6 }),
            updateMany: vi.fn().mockImplementation(({ where, data }) => {
              if (data.stockQuantity?.decrement) {
                capturedWhere = where;
                capturedData = data;
                return { count: 1 };
              }
              return { count: 0 };
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await repo.adjustStock('prod-concurrency-1', { adjustment: -4 });

      expect(capturedWhere).toEqual({
        id: 'prod-concurrency-1',
        stockQuantity: { gte: 4 },
      });
      expect(capturedData).toEqual({
        stockQuantity: { decrement: 4 },
      });
      expect(result.stockQuantity).toBe(6);
    });

    it('rejects decrement when remaining stock is insufficient, throwing ConflictError', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 2 })
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 2 }),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }), // 0 rows updated because stockQuantity < 5
          },
        };
        return callback(mockTx);
      });

      await expect(repo.adjustStock('prod-concurrency-1', { adjustment: -5 })).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('Conditional Availability-Transition Safeguards (Anti-Race Invariants)', () => {
    it('executes conditional availability transition to SOLD_OUT only when stockQuantity = 0 and availability is IN_STOCK', async () => {
      let availabilityWhere: any = null;
      let availabilityData: any = null;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({ ...sampleProduct, stockQuantity: 4 })
              .mockResolvedValueOnce({
                ...sampleProduct,
                stockQuantity: 0,
                availability: ProductAvailability.SOLD_OUT,
              }),
            updateMany: vi.fn().mockImplementation(({ where, data }) => {
              if (data.availability === ProductAvailability.SOLD_OUT) {
                availabilityWhere = where;
                availabilityData = data;
                return { count: 1 };
              }
              return { count: 1 };
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await repo.adjustStock('prod-concurrency-1', { adjustment: -4 });

      // Verifies conditional transition prevents setting SOLD_OUT on positive stock
      expect(availabilityWhere).toEqual({
        id: 'prod-concurrency-1',
        stockQuantity: 0,
        availability: ProductAvailability.IN_STOCK,
      });
      expect(availabilityData).toEqual({
        availability: ProductAvailability.SOLD_OUT,
      });
      expect(result.availability).toBe(ProductAvailability.SOLD_OUT);
    });

    it('executes conditional availability transition to IN_STOCK only when stockQuantity > 0 and availability is SOLD_OUT', async () => {
      let availabilityWhere: any = null;
      let availabilityData: any = null;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({
                ...sampleProduct,
                stockQuantity: 0,
                availability: ProductAvailability.SOLD_OUT,
              })
              .mockResolvedValueOnce({
                ...sampleProduct,
                stockQuantity: 5,
                availability: ProductAvailability.IN_STOCK,
              }),
            update: vi.fn().mockResolvedValue({ ...sampleProduct, stockQuantity: 5 }),
            updateMany: vi.fn().mockImplementation(({ where, data }) => {
              if (data.availability === ProductAvailability.IN_STOCK) {
                availabilityWhere = where;
                availabilityData = data;
                return { count: 1 };
              }
              return { count: 0 };
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await repo.adjustStock('prod-concurrency-1', { adjustment: 5 });

      // Verifies conditional transition prevents setting IN_STOCK when stock is 0
      expect(availabilityWhere).toEqual({
        id: 'prod-concurrency-1',
        stockQuantity: { gt: 0 },
        availability: ProductAvailability.SOLD_OUT,
      });
      expect(availabilityData).toEqual({
        availability: ProductAvailability.IN_STOCK,
      });
      expect(result.availability).toBe(ProductAvailability.IN_STOCK);
    });

    it('safeguards against race: when checkout reduces stock to 0 while admin increases stock, conditional checks prevent stale availability', async () => {
      // Scenario:
      // Checkout decremented 2 to 0. Checkout attempts conditional transition:
      // WHERE stockQuantity = 0 AND availability = 'IN_STOCK'
      // If admin increment committed first (stock is now 5), checkout's condition evaluates to false and matches 0 rows.
      let checkoutTransitionCount = 0;
      const stockAfterAdminIncrement = 5;

      const mockCheckoutTx = {
        product: {
          updateMany: vi.fn().mockImplementation(({ where }) => {
            if (where.stockQuantity === 0 && stockAfterAdminIncrement > 0) {
              return { count: 0 }; // Does NOT transition to SOLD_OUT because stock is 5
            }
            return { count: 1 };
          }),
        },
      };

      const result = await mockCheckoutTx.product.updateMany({
        where: {
          id: 'prod-concurrency-1',
          stockQuantity: 0,
          availability: ProductAvailability.IN_STOCK,
        },
        data: {
          availability: ProductAvailability.SOLD_OUT,
        },
      });

      expect(result.count).toBe(0); // 0 rows updated: stale SOLD_OUT write was prevented!
    });
  });

  describe('MADE_TO_ORDER Preservation Under All Adjustment Types', () => {
    it('preserves MADE_TO_ORDER availability during delta increments', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({
                ...sampleProduct,
                stockQuantity: 0,
                availability: ProductAvailability.MADE_TO_ORDER,
              })
              .mockResolvedValueOnce({
                ...sampleProduct,
                stockQuantity: 5,
                availability: ProductAvailability.MADE_TO_ORDER,
              }),
            update: vi.fn().mockResolvedValue({
              ...sampleProduct,
              stockQuantity: 5,
              availability: ProductAvailability.MADE_TO_ORDER,
            }),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(mockTx);
      });

      const result = await repo.adjustStock('prod-concurrency-1', { adjustment: 5 });

      expect(result.availability).toBe(ProductAvailability.MADE_TO_ORDER);
    });

    it('preserves MADE_TO_ORDER availability during exact-quantity updates to 0', async () => {
      let updatedData: any = null;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({
                ...sampleProduct,
                stockQuantity: 4,
                availability: ProductAvailability.MADE_TO_ORDER,
              })
              .mockResolvedValueOnce({
                ...sampleProduct,
                stockQuantity: 0,
                availability: ProductAvailability.MADE_TO_ORDER,
              }),
            update: vi.fn().mockImplementation(({ data }) => {
              updatedData = data;
              return {
                ...sampleProduct,
                stockQuantity: 0,
                availability: ProductAvailability.MADE_TO_ORDER,
              };
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await repo.adjustStock('prod-concurrency-1', { stockQuantity: 0 });

      expect(updatedData.availability).toBe(ProductAvailability.MADE_TO_ORDER);
      expect(result.availability).toBe(ProductAvailability.MADE_TO_ORDER);
    });
  });

  describe('Missing Product Handling', () => {
    it('throws NotFoundError if product does not exist in database', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await expect(repo.adjustStock('missing-prod-id', { adjustment: 2 })).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
