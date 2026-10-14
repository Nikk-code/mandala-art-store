import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../src/services/product.service';
import type { ProductRepository, ProductWithDetails } from '../src/repositories/product.repository';
import type { CategoryRepository } from '../src/repositories/category.repository';
import { ConflictError, NotFoundError, ValidationError } from '../src/errors';
import { ProductAvailability, type Category, type ProductImage } from '@prisma/client';

describe('ProductService Domain Logic', () => {
  let mockProductRepo: ProductRepository;
  let mockCategoryRepo: CategoryRepository;
  let service: ProductService;

  const sampleCategory: Category = {
    id: 'cat-123',
    name: 'Mandala Art',
    slug: 'mandala-art',
    description: 'Handmade mandala artworks',
    imageUrl: 'https://example.com/mandala.jpg',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const sampleImage: ProductImage = {
    id: 'img-1',
    productId: 'prod-123',
    url: 'https://example.com/art.jpg',
    altText: 'Mandala artwork',
    displayOrder: 0,
    isPrimary: true,
    createdAt: new Date('2026-01-01'),
  };

  const sampleImage2: ProductImage = {
    id: 'img-2',
    productId: 'prod-123',
    url: 'https://example.com/art2.jpg',
    altText: 'Mandala angle view',
    displayOrder: 1,
    isPrimary: false,
    createdAt: new Date('2026-01-01'),
  };

  const sampleProduct: ProductWithDetails = {
    id: 'prod-123',
    sku: 'MND-001',
    name: 'Sacred Lotus Mandala',
    slug: 'sacred-lotus-mandala',
    description: '12x12 inch acrylic mandala on canvas',
    shortDescription: 'Intricate lotus mandala',
    price: 149900, // ₹1,499.00
    compareAtPrice: 199900, // ₹1,999.00
    categoryId: 'cat-123',
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 1,
    dimensions: '12x12 inches',
    material: 'Acrylic on stretched canvas',
    weightGrams: 800,
    isHandmade: true,
    isFeatured: true,
    isActive: true,
    metaTitle: 'Sacred Lotus Mandala Artwork',
    metaDescription: 'Handmade lotus mandala',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    category: sampleCategory,
    images: [sampleImage, sampleImage2],
  };

  beforeEach(() => {
    mockProductRepo = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findBySku: vi.fn(),
      findActiveProducts: vi.fn(),
      findActiveProductsPaginated: vi.fn(),
      findAdminProductsPaginated: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deactivate: vi.fn(),
      activate: vi.fn(),
      adjustStock: vi.fn(),
      addImage: vi.fn(),
      removeImage: vi.fn(),
      findImageById: vi.fn(),
      setPrimaryImage: vi.fn(),
    } as unknown as ProductRepository;

    mockCategoryRepo = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByName: vi.fn(),
      findActiveCategories: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deactivate: vi.fn(),
    } as unknown as CategoryRepository;

    service = new ProductService(mockProductRepo, mockCategoryRepo);
  });

  describe('createProduct', () => {
    it('creates product with valid integer paise price and category connection', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockProductRepo, 'findBySku').mockResolvedValue(null);
      vi.spyOn(mockProductRepo, 'findBySlug').mockResolvedValue(null);
      vi.spyOn(mockProductRepo, 'create').mockResolvedValue(sampleProduct);

      const result = await service.createProduct({
        name: 'Sacred Lotus Mandala',
        sku: 'mnd-001',
        description: '12x12 inch acrylic mandala on canvas',
        price: 149900,
        compareAtPrice: 199900,
        categoryId: 'cat-123',
        stockQuantity: 1,
      });

      expect(mockProductRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sku: 'MND-001',
          name: 'Sacred Lotus Mandala',
          slug: 'sacred-lotus-mandala',
          price: 149900,
          compareAtPrice: 199900,
          category: { connect: { id: 'cat-123' } },
          availability: ProductAvailability.IN_STOCK,
          stockQuantity: 1,
        })
      );
      expect(result).toEqual(sampleProduct);
    });

    it('creates MADE_TO_ORDER product without requiring positive stock', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockProductRepo, 'findBySku').mockResolvedValue(null);
      vi.spyOn(mockProductRepo, 'findBySlug').mockResolvedValue(null);
      vi.spyOn(mockProductRepo, 'create').mockResolvedValue({
        ...sampleProduct,
        availability: ProductAvailability.MADE_TO_ORDER,
        stockQuantity: 0,
      });

      const result = await service.createProduct({
        name: 'Custom Order Mandala',
        sku: 'MND-MTO-01',
        description: 'Made to order artwork',
        price: 250000,
        categoryId: 'cat-123',
        availability: ProductAvailability.MADE_TO_ORDER,
        stockQuantity: 0,
      });

      expect(result.availability).toBe(ProductAvailability.MADE_TO_ORDER);
    });

    it('rejects product with IN_STOCK availability when stockQuantity is 0', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);

      await expect(
        service.createProduct({
          name: 'Sacred Lotus Mandala',
          sku: 'MND-001',
          description: 'Description',
          price: 149900,
          categoryId: 'cat-123',
          availability: ProductAvailability.IN_STOCK,
          stockQuantity: 0,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects product with invalid price in paise', async () => {
      await expect(
        service.createProduct({
          name: 'Sacred Lotus Mandala',
          sku: 'MND-001',
          description: 'Description',
          price: -500,
          categoryId: 'cat-123',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects product with decimal price', async () => {
      await expect(
        service.createProduct({
          name: 'Sacred Lotus Mandala',
          sku: 'MND-001',
          description: 'Description',
          price: 1499.99,
          categoryId: 'cat-123',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects product with SOLD_OUT availability but stockQuantity > 0', async () => {
      await expect(
        service.createProduct({
          name: 'Sacred Lotus Mandala',
          sku: 'MND-001',
          description: 'Description',
          price: 149900,
          categoryId: 'cat-123',
          availability: ProductAvailability.SOLD_OUT,
          stockQuantity: 5,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects product assigned to an inactive category', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue({
        ...sampleCategory,
        isActive: false,
      });

      await expect(
        service.createProduct({
          name: 'Sacred Lotus Mandala',
          sku: 'MND-001',
          description: 'Description',
          price: 149900,
          categoryId: 'cat-123',
          stockQuantity: 1,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects product assigned to a non-existent category', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(null);

      await expect(
        service.createProduct({
          name: 'Sacred Lotus Mandala',
          sku: 'MND-001',
          description: 'Description',
          price: 149900,
          categoryId: 'non-existent-id',
          stockQuantity: 1,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects product with duplicate SKU', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockProductRepo, 'findBySku').mockResolvedValue(sampleProduct);

      await expect(
        service.createProduct({
          name: 'Another Mandala',
          sku: 'MND-001',
          description: 'Description',
          price: 149900,
          categoryId: 'cat-123',
          stockQuantity: 1,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('rejects product with duplicate slug', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockProductRepo, 'findBySku').mockResolvedValue(null);
      vi.spyOn(mockProductRepo, 'findBySlug').mockResolvedValue(sampleProduct);

      await expect(
        service.createProduct({
          name: 'Sacred Lotus Mandala',
          sku: 'MND-002',
          slug: 'sacred-lotus-mandala',
          description: 'Description',
          price: 149900,
          categoryId: 'cat-123',
          stockQuantity: 1,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getProductById / getProductBySlug / getProductBySku', () => {
    it('returns product when found by ID', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);
      const result = await service.getProductById('prod-123');
      expect(result).toEqual(sampleProduct);
    });

    it('throws NotFoundError when product is not found by ID', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(null);
      await expect(service.getProductById('unknown')).rejects.toThrow(NotFoundError);
    });

    it('returns product when found by slug', async () => {
      vi.spyOn(mockProductRepo, 'findBySlug').mockResolvedValue(sampleProduct);
      const result = await service.getProductBySlug('sacred-lotus-mandala');
      expect(result).toEqual(sampleProduct);
    });

    it('throws NotFoundError when product is inactive and includeInactive is false', async () => {
      vi.spyOn(mockProductRepo, 'findBySlug').mockResolvedValue({
        ...sampleProduct,
        isActive: false,
      });

      await expect(service.getProductBySlug('sacred-lotus-mandala')).rejects.toThrow(NotFoundError);
    });

    it('returns product when found by SKU', async () => {
      vi.spyOn(mockProductRepo, 'findBySku').mockResolvedValue(sampleProduct);
      const result = await service.getProductBySku('mnd-001');
      expect(result).toEqual(sampleProduct);
    });
  });

  describe('listActiveProducts', () => {
    it('lists active products without category filter', async () => {
      vi.spyOn(mockProductRepo, 'findActiveProducts').mockResolvedValue([sampleProduct]);

      const result = await service.listActiveProducts();
      expect(result).toEqual([sampleProduct]);
      expect(mockProductRepo.findActiveProducts).toHaveBeenCalledWith(undefined);
    });

    it('validates active category when category filter is supplied', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockProductRepo, 'findActiveProducts').mockResolvedValue([sampleProduct]);

      const result = await service.listActiveProducts({ categoryId: 'cat-123', isFeatured: true });
      expect(result).toEqual([sampleProduct]);
      expect(mockCategoryRepo.findById).toHaveBeenCalledWith('cat-123');
    });

    it('throws NotFoundError if filtered category is inactive', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue({
        ...sampleCategory,
        isActive: false,
      });

      await expect(service.listActiveProducts({ categoryId: 'cat-123' })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateProduct', () => {
    it('updates product and validates price changes', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);
      vi.spyOn(mockProductRepo, 'update').mockResolvedValue({
        ...sampleProduct,
        price: 179900,
      });

      const result = await service.updateProduct('prod-123', {
        price: 179900,
      });

      expect(result.price).toBe(179900);
    });

    it('rejects update with invalid price', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);

      await expect(
        service.updateProduct('prod-123', {
          price: -100,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deactivateProduct', () => {
    it('deactivates product after verifying existence', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);
      vi.spyOn(mockProductRepo, 'deactivate').mockResolvedValue({
        ...sampleProduct,
        isActive: false,
      });

      const result = await service.deactivateProduct('prod-123');
      expect(result.isActive).toBe(false);
      expect(mockProductRepo.deactivate).toHaveBeenCalledWith('prod-123');
    });
  });

  describe('Product Image Management', () => {
    it('adds image to product', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);
      vi.spyOn(mockProductRepo, 'addImage').mockResolvedValue(sampleImage);

      const result = await service.addImage('prod-123', {
        url: 'https://example.com/art.jpg',
        altText: 'Mandala artwork',
        isPrimary: true,
      });

      expect(result).toEqual(sampleImage);
      expect(mockProductRepo.addImage).toHaveBeenCalledWith('prod-123', {
        url: 'https://example.com/art.jpg',
        altText: 'Mandala artwork',
        displayOrder: 0,
        isPrimary: true,
      });
    });

    it('removes image from product and promotes fallback primary if removed was primary', async () => {
      vi.spyOn(mockProductRepo, 'findById')
        .mockResolvedValueOnce(sampleProduct) // for getProductById check
        .mockResolvedValueOnce({
          ...sampleProduct,
          images: [sampleImage2], // remaining images
        });
      vi.spyOn(mockProductRepo, 'findImageById').mockResolvedValue(sampleImage);
      vi.spyOn(mockProductRepo, 'removeImage').mockResolvedValue(sampleImage);
      vi.spyOn(mockProductRepo, 'setPrimaryImage').mockResolvedValue({
        ...sampleImage2,
        isPrimary: true,
      });

      const result = await service.removeImage('prod-123', 'img-1');
      expect(result).toEqual(sampleImage);
      expect(mockProductRepo.removeImage).toHaveBeenCalledWith('img-1');
      expect(mockProductRepo.setPrimaryImage).toHaveBeenCalledWith('prod-123', 'img-2');
    });

    it('sets primary image for product', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);
      vi.spyOn(mockProductRepo, 'findImageById').mockResolvedValue(sampleImage);
      vi.spyOn(mockProductRepo, 'setPrimaryImage').mockResolvedValue(sampleImage);

      const result = await service.setPrimaryImage('prod-123', 'img-1');
      expect(result).toEqual(sampleImage);
      expect(mockProductRepo.setPrimaryImage).toHaveBeenCalledWith('prod-123', 'img-1');
    });
  });

  describe('listAdminProductsPaginated', () => {
    it('queries products with search, pagination, and active status filters', async () => {
      vi.spyOn(mockProductRepo, 'findAdminProductsPaginated').mockResolvedValue({
        items: [sampleProduct],
        totalItems: 1,
      });

      const result = await service.listAdminProductsPaginated({
        page: 1,
        pageSize: 10,
        search: 'Lotus',
        isActive: true,
      });

      expect(mockProductRepo.findAdminProductsPaginated).toHaveBeenCalledWith({
        filter: {
          search: 'Lotus',
          categoryId: undefined,
          availability: undefined,
          isActive: true,
        },
        pagination: {
          skip: 0,
          take: 10,
        },
        sort: undefined,
      });
      expect(result.items).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('rejects invalid sort option with ValidationError', async () => {
      await expect(
        service.listAdminProductsPaginated({
          // @ts-expect-error Testing invalid sort value
          sort: 'invalid_sort',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('toggleProductActive', () => {
    it('activates a product', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue({
        ...sampleProduct,
        isActive: false,
      });
      vi.spyOn(mockProductRepo, 'activate').mockResolvedValue({
        ...sampleProduct,
        isActive: true,
      });

      const result = await service.toggleProductActive('prod-123', true);
      expect(result.isActive).toBe(true);
      expect(mockProductRepo.activate).toHaveBeenCalledWith('prod-123');
    });

    it('deactivates a product', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);
      vi.spyOn(mockProductRepo, 'deactivate').mockResolvedValue({
        ...sampleProduct,
        isActive: false,
      });

      const result = await service.toggleProductActive('prod-123', false);
      expect(result.isActive).toBe(false);
      expect(mockProductRepo.deactivate).toHaveBeenCalledWith('prod-123');
    });
  });

  describe('adjustStock', () => {
    it('sets stock quantity directly and updates availability to IN_STOCK if > 0', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 0,
        availability: ProductAvailability.SOLD_OUT,
      });
      vi.spyOn(mockProductRepo, 'adjustStock').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 5,
        availability: ProductAvailability.IN_STOCK,
      });

      const result = await service.adjustStock('prod-123', { stockQuantity: 5 });
      expect(mockProductRepo.adjustStock).toHaveBeenCalledWith('prod-123', {
        stockQuantity: 5,
        availability: ProductAvailability.IN_STOCK,
      });
      expect(result.stockQuantity).toBe(5);
    });

    it('auto-transitions to SOLD_OUT when stock quantity is reduced to 0', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 3,
        availability: ProductAvailability.IN_STOCK,
      });
      vi.spyOn(mockProductRepo, 'adjustStock').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 0,
        availability: ProductAvailability.SOLD_OUT,
      });

      await service.adjustStock('prod-123', { adjustment: -3 });
      expect(mockProductRepo.adjustStock).toHaveBeenCalledWith(
        'prod-123',
        expect.objectContaining({
          adjustment: -3,
        })
      );
    });

    it('rejects inventory adjustment that would result in negative stock', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 2,
        availability: ProductAvailability.IN_STOCK,
      });

      await expect(service.adjustStock('prod-123', { adjustment: -5 })).rejects.toThrow(
        ValidationError
      );
    });

    it('preserves MADE_TO_ORDER availability when stock is adjusted', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 0,
        availability: ProductAvailability.MADE_TO_ORDER,
      });
      vi.spyOn(mockProductRepo, 'adjustStock').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 4,
        availability: ProductAvailability.MADE_TO_ORDER,
      });

      await service.adjustStock('prod-123', { stockQuantity: 4 });
      expect(mockProductRepo.adjustStock).toHaveBeenCalledWith(
        'prod-123',
        expect.objectContaining({
          stockQuantity: 4,
          availability: ProductAvailability.MADE_TO_ORDER,
        })
      );
    });

    it('delegates expectedStock and force flags to repository for optimistic concurrency control', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 10,
        availability: ProductAvailability.IN_STOCK,
      });
      vi.spyOn(mockProductRepo, 'adjustStock').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 8,
        availability: ProductAvailability.IN_STOCK,
      });

      await service.adjustStock('prod-123', {
        stockQuantity: 8,
        expectedStock: 10,
        force: true,
      });

      expect(mockProductRepo.adjustStock).toHaveBeenCalledWith(
        'prod-123',
        expect.objectContaining({
          stockQuantity: 8,
          expectedStock: 10,
          force: true,
        })
      );
    });

    it('rejects adjustment of 0 or invalid combinations', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);

      await expect(service.adjustStock('prod-123', { adjustment: 0 })).rejects.toThrow(
        ValidationError
      );
      await expect(service.adjustStock('prod-123', {})).rejects.toThrow(ValidationError);
      await expect(
        service.adjustStock('prod-123', { stockQuantity: 5, adjustment: 2 })
      ).rejects.toThrow(ValidationError);
    });
  });
});
