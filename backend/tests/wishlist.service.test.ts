import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WishlistService } from '../src/services/wishlist.service';
import { WishlistRepository } from '../src/repositories/wishlist.repository';
import { ProductRepository } from '../src/repositories/product.repository';
import { NotFoundError, ValidationError, ConflictError } from '../src/errors';
import { Prisma, ProductAvailability } from '@prisma/client';
import type { WishlistItemWithProduct } from '../src/repositories/wishlist.repository';
import type { ProductWithDetails } from '../src/repositories/product.repository';

describe('WishlistService Unit Tests', () => {
  const sampleUserId = '11111111-1111-4111-8111-111111111111';
  const sampleProductId = '22222222-2222-4222-8222-222222222222';
  const sampleWishlistId = '33333333-3333-4333-8333-333333333333';

  const sampleProduct: ProductWithDetails = {
    id: sampleProductId,
    sku: 'MAN-001',
    name: 'Cosmic Mandala Canvas',
    slug: 'cosmic-mandala-canvas',
    description: 'Detailed cosmic mandala painting.',
    shortDescription: 'Cosmic mandala art piece.',
    price: 149900,
    compareAtPrice: 199900,
    categoryId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 10,
    dimensions: '30x30 cm',
    material: 'Canvas & Acrylic',
    weightGrams: 500,
    isHandmade: true,
    isFeatured: true,
    isActive: true,
    metaTitle: 'Cosmic Mandala Canvas',
    metaDescription: 'Handmade canvas mandala',
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
    category: {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      name: 'Canvas Art',
      slug: 'canvas-art',
      description: 'Canvas category',
      imageUrl: null,
      displayOrder: 1,
      isActive: true,
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
      updatedAt: new Date('2026-10-01T10:00:00.000Z'),
    },
    images: [
      {
        id: 'img-1',
        productId: sampleProductId,
        url: 'https://images.example.com/cosmic.jpg',
        altText: 'Cosmic Mandala',
        displayOrder: 0,
        isPrimary: true,
      },
    ],
  };

  const sampleWishlistItem: WishlistItemWithProduct = {
    id: sampleWishlistId,
    userId: sampleUserId,
    productId: sampleProductId,
    createdAt: new Date('2026-10-10T12:00:00.000Z'),
    product: sampleProduct,
  };

  let mockWishlistRepo: WishlistRepository;
  let mockProductRepo: ProductRepository;
  let service: WishlistService;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockWishlistRepo = new WishlistRepository();
    mockProductRepo = new ProductRepository();
    service = new WishlistService(mockWishlistRepo, mockProductRepo);
  });

  describe('getUserWishlist', () => {
    it('returns formatted WishlistItemDto array for active products', async () => {
      vi.spyOn(mockWishlistRepo, 'findByUserId').mockResolvedValue([sampleWishlistItem]);

      const result = await service.getUserWishlist(sampleUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: sampleWishlistId,
        userId: sampleUserId,
        productId: sampleProductId,
        createdAt: '2026-10-10T12:00:00.000Z',
        product: {
          id: sampleProductId,
          sku: 'MAN-001',
          name: 'Cosmic Mandala Canvas',
          slug: 'cosmic-mandala-canvas',
          description: 'Detailed cosmic mandala painting.',
          shortDescription: 'Cosmic mandala art piece.',
          price: 149900,
          compareAtPrice: 199900,
          availability: 'IN_STOCK',
          dimensions: '30x30 cm',
          material: 'Canvas & Acrylic',
          weightGrams: 500,
          isHandmade: true,
          isFeatured: true,
          category: {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            name: 'Canvas Art',
            slug: 'canvas-art',
          },
          images: [
            {
              id: 'img-1',
              url: 'https://images.example.com/cosmic.jpg',
              altText: 'Cosmic Mandala',
              displayOrder: 0,
              isPrimary: true,
            },
          ],
          createdAt: '2026-10-01T10:00:00.000Z',
        },
      });
    });

    it('filters out inactive products safely', async () => {
      const inactiveItem: WishlistItemWithProduct = {
        ...sampleWishlistItem,
        product: {
          ...sampleProduct,
          isActive: false,
        },
      };

      vi.spyOn(mockWishlistRepo, 'findByUserId').mockResolvedValue([inactiveItem]);

      const result = await service.getUserWishlist(sampleUserId);
      expect(result).toHaveLength(0);
    });
  });

  describe('addToWishlist', () => {
    it('successfully adds product to wishlist', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);
      vi.spyOn(mockWishlistRepo, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(mockWishlistRepo, 'add').mockResolvedValue(sampleWishlistItem);

      const result = await service.addToWishlist(sampleUserId, { productId: sampleProductId });

      expect(result.id).toBe(sampleWishlistId);
      expect(result.productId).toBe(sampleProductId);
      expect(result.product.name).toBe('Cosmic Mandala Canvas');
      expect(mockWishlistRepo.add).toHaveBeenCalledWith(sampleUserId, sampleProductId);
    });

    it('throws ValidationError for invalid UUID productId', async () => {
      await expect(
        service.addToWishlist(sampleUserId, { productId: 'invalid-id' })
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError if product does not exist', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(null);

      await expect(
        service.addToWishlist(sampleUserId, { productId: sampleProductId })
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError if product is inactive', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue({
        ...sampleProduct,
        isActive: false,
      });

      await expect(
        service.addToWishlist(sampleUserId, { productId: sampleProductId })
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError if product is already in user wishlist', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);
      vi.spyOn(mockWishlistRepo, 'findByUserAndProduct').mockResolvedValue({
        id: sampleWishlistId,
        userId: sampleUserId,
        productId: sampleProductId,
        createdAt: new Date(),
      });

      await expect(
        service.addToWishlist(sampleUserId, { productId: sampleProductId })
      ).rejects.toThrow(ConflictError);
    });

    it('catches Prisma P2002 unique constraint collision and throws ConflictError', async () => {
      vi.spyOn(mockProductRepo, 'findById').mockResolvedValue(sampleProduct);
      vi.spyOn(mockWishlistRepo, 'findByUserAndProduct').mockResolvedValue(null);

      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
        code: 'P2002',
        clientVersion: '5.22.0',
      });
      vi.spyOn(mockWishlistRepo, 'add').mockRejectedValue(p2002Error);

      await expect(
        service.addToWishlist(sampleUserId, { productId: sampleProductId })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('removeFromWishlist', () => {
    it('successfully removes existing item from wishlist', async () => {
      vi.spyOn(mockWishlistRepo, 'findByUserAndProduct').mockResolvedValue({
        id: sampleWishlistId,
        userId: sampleUserId,
        productId: sampleProductId,
        createdAt: new Date(),
      });
      vi.spyOn(mockWishlistRepo, 'remove').mockResolvedValue({
        id: sampleWishlistId,
        userId: sampleUserId,
        productId: sampleProductId,
        createdAt: new Date(),
      });

      const result = await service.removeFromWishlist(sampleUserId, sampleProductId);

      expect(result).toEqual({
        success: true,
        message: 'Product removed from wishlist.',
      });
      expect(mockWishlistRepo.remove).toHaveBeenCalledWith(sampleUserId, sampleProductId);
    });

    it('throws ValidationError for invalid UUID format', async () => {
      await expect(service.removeFromWishlist(sampleUserId, 'invalid-uuid')).rejects.toThrow(
        ValidationError
      );
    });

    it('throws NotFoundError when removing an absent item', async () => {
      vi.spyOn(mockWishlistRepo, 'findByUserAndProduct').mockResolvedValue(null);

      await expect(service.removeFromWishlist(sampleUserId, sampleProductId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('isInWishlist', () => {
    it('returns true when product is in wishlist', async () => {
      vi.spyOn(mockWishlistRepo, 'findByUserAndProduct').mockResolvedValue({
        id: sampleWishlistId,
        userId: sampleUserId,
        productId: sampleProductId,
        createdAt: new Date(),
      });

      const result = await service.isInWishlist(sampleUserId, sampleProductId);
      expect(result).toBe(true);
    });

    it('returns false when product is not in wishlist', async () => {
      vi.spyOn(mockWishlistRepo, 'findByUserAndProduct').mockResolvedValue(null);

      const result = await service.isInWishlist(sampleUserId, sampleProductId);
      expect(result).toBe(false);
    });
  });
});
