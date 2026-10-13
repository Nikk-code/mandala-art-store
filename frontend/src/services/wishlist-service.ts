import { apiGet, apiPost, apiDelete } from './api-client';
import type { WishlistItemDto, ApiSuccessResponse } from '@/types';

export async function fetchWishlist(): Promise<WishlistItemDto[]> {
  const response =
    await apiGet<ApiSuccessResponse<{ items: WishlistItemDto[]; count: number }>>('wishlist');
  return response.data.items;
}

export async function addToWishlist(productId: string): Promise<WishlistItemDto> {
  const response = await apiPost<ApiSuccessResponse<{ item: WishlistItemDto }>>('wishlist', {
    productId,
  });
  return response.data.item;
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiDelete<ApiSuccessResponse<{ success: boolean; message: string }>>(
    `wishlist/${productId}`
  );
}

export async function checkWishlist(productId: string): Promise<boolean> {
  const response = await apiGet<ApiSuccessResponse<{ productId: string; inWishlist: boolean }>>(
    `wishlist/check/${productId}`
  );
  return response.data.inWishlist;
}
