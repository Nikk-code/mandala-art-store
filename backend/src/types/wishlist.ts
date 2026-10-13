import type { PublicProductListItemDto } from './catalog';

export interface WishlistItemDto {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: PublicProductListItemDto;
}

export interface AddWishlistItemInput {
  productId: string;
}

export interface WishlistResponseData {
  items: WishlistItemDto[];
  count: number;
}
