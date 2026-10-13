import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/services/api-client';
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '@/services/wishlist-service';
import type { WishlistItemDto } from '@/types';

describe('Wishlist Client Service', () => {
  const sampleWishlistItem: WishlistItemDto = {
    id: 'item-1111',
    userId: 'user-1111',
    productId: 'prod-1111',
    createdAt: '2026-10-10T10:00:00.000Z',
    product: {
      id: 'prod-1111',
      sku: 'MAN-001',
      name: 'Cosmic Mandala Canvas',
      slug: 'cosmic-mandala-canvas',
      shortDescription: 'Cosmic mandala art piece.',
      description: 'Detailed cosmic mandala painting.',
      price: 149900,
      compareAtPrice: 199900,
      availability: 'IN_STOCK',
      dimensions: '30x30 cm',
      material: 'Canvas & Acrylic',
      weightGrams: 500,
      isHandmade: true,
      isFeatured: true,
      category: {
        id: 'cat-1111',
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
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchWishlist fetches customer wishlist items', async () => {
    vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: { items: [sampleWishlistItem], count: 1 },
    });

    const result = await fetchWishlist();
    expect(result).toEqual([sampleWishlistItem]);
    expect(apiClient.apiGet).toHaveBeenCalledWith('wishlist');
  });

  it('addToWishlist sends productId to add item', async () => {
    vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
      success: true,
      data: { item: sampleWishlistItem },
    });

    const result = await addToWishlist('prod-1111');
    expect(result).toEqual(sampleWishlistItem);
    expect(apiClient.apiPost).toHaveBeenCalledWith('wishlist', { productId: 'prod-1111' });
  });

  it('removeFromWishlist calls apiDelete with productId', async () => {
    vi.spyOn(apiClient, 'apiDelete').mockResolvedValue({
      success: true,
      data: { success: true, message: 'Product removed from wishlist.' },
    });

    await removeFromWishlist('prod-1111');
    expect(apiClient.apiDelete).toHaveBeenCalledWith('wishlist/prod-1111');
  });

  it('checkWishlist queries check endpoint and returns inWishlist boolean', async () => {
    vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: { productId: 'prod-1111', inWishlist: true },
    });

    const result = await checkWishlist('prod-1111');
    expect(result).toBe(true);
    expect(apiClient.apiGet).toHaveBeenCalledWith('wishlist/check/prod-1111');
  });
});
