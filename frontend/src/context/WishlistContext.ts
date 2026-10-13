import { createContext, useContext } from 'react';
import type { WishlistContextValue } from '@/types';

export type { WishlistContextValue };

export const defaultWishlistContextValue: WishlistContextValue = {
  items: [],
  itemCount: 0,
  isLoading: false,
  error: null,
  isInWishlist: () => false,
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  toggleWishlist: async () => {},
  refreshWishlist: async () => {},
};

export const WishlistContext = createContext<WishlistContextValue>(defaultWishlistContextValue);

export function useWishlist(): WishlistContextValue {
  return useContext(WishlistContext);
}
