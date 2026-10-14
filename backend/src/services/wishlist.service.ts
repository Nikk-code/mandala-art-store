import { Prisma } from '@prisma/client';
import {
  wishlistRepository,
  type WishlistRepository,
  type WishlistItemWithProduct,
} from '../repositories/wishlist.repository';
import {
  productRepository,
  type ProductRepository,
  type ProductWithDetails,
} from '../repositories/product.repository';
import { ConflictError, NotFoundError } from '../errors';
import { validateProductId, validateAddWishlistInput } from '../utils/wishlist-validation';
import type { WishlistItemDto, PublicProductListItemDto } from '../types';

export class WishlistService {
  constructor(
    private readonly wishlistRepo: WishlistRepository = wishlistRepository,
    private readonly productRepo: ProductRepository = productRepository
  ) {}

  private mapProductToPublicDto(prod: ProductWithDetails): PublicProductListItemDto {
    return {
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      slug: prod.slug,
      shortDescription: prod.shortDescription,
      description: prod.description,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice,
      availability: prod.availability,
      dimensions: prod.dimensions,
      material: prod.material,
      weightGrams: prod.weightGrams,
      isHandmade: prod.isHandmade,
      isFeatured: prod.isFeatured,
      category: {
        id: prod.category.id,
        name: prod.category.name,
        slug: prod.category.slug,
      },
      images: prod.images.map(img => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        displayOrder: img.displayOrder,
        isPrimary: img.isPrimary,
      })),
      ...(prod.reviews !== undefined
        ? {
            averageRating:
              prod.reviews.length > 0
                ? Math.round(
                    (prod.reviews.reduce((acc, r) => acc + r.rating, 0) / prod.reviews.length) * 10
                  ) / 10
                : null,
            totalReviews: prod.reviews.length,
          }
        : {}),
      createdAt: prod.createdAt.toISOString(),
    };
  }

  private mapWishlistItemToDto(item: WishlistItemWithProduct): WishlistItemDto {
    return {
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      createdAt: item.createdAt.toISOString(),
      product: this.mapProductToPublicDto(item.product),
    };
  }

  async getUserWishlist(userId: string): Promise<WishlistItemDto[]> {
    const items = await this.wishlistRepo.findByUserId(userId);
    // Filter out inactive products to ensure catalog integrity
    const activeItems = items.filter(item => item.product.isActive);
    return activeItems.map(item => this.mapWishlistItemToDto(item));
  }

  async addToWishlist(userId: string, rawInput: unknown): Promise<WishlistItemDto> {
    const input = validateAddWishlistInput(rawInput);
    const { productId } = input;

    // Verify product exists and is active
    const product = await this.productRepo.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found or is no longer available.');
    }

    // Check if already in user's wishlist
    const existing = await this.wishlistRepo.findByUserAndProduct(userId, productId);
    if (existing) {
      throw new ConflictError('Product is already in your wishlist.');
    }

    try {
      const created = await this.wishlistRepo.add(userId, productId);
      return this.mapWishlistItemToDto(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Product is already in your wishlist.');
      }
      throw error;
    }
  }

  async removeFromWishlist(
    userId: string,
    rawProductId: string
  ): Promise<{ success: true; message: string }> {
    const productId = validateProductId(rawProductId);

    const existing = await this.wishlistRepo.findByUserAndProduct(userId, productId);
    if (!existing) {
      throw new NotFoundError('Product not found in wishlist.');
    }

    await this.wishlistRepo.remove(userId, productId);

    return {
      success: true,
      message: 'Product removed from wishlist.',
    };
  }

  async isInWishlist(userId: string, rawProductId: string): Promise<boolean> {
    const productId = validateProductId(rawProductId);
    const existing = await this.wishlistRepo.findByUserAndProduct(userId, productId);
    return Boolean(existing);
  }
}

export const wishlistService = new WishlistService();
