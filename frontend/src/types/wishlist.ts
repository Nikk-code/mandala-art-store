import type { ProductListItemDto } from './catalog';

export interface WishlistItemDto {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: ProductListItemDto;
}

export interface WishlistContextValue {
  items: WishlistItemDto[];
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}
