import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchWishlist,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from '@/services/wishlist-service';
import type { WishlistItemDto, WishlistContextValue } from '@/types';
import { WishlistContext } from './WishlistContext';

export interface WishlistProviderProps {
  children: ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps): ReactNode {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WishlistItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const refreshWishlist = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedItems = await fetchWishlist();
      setItems(fetchedItems);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load wishlist.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    } else {
      setItems([]);
      setError(null);
    }
  }, [isAuthenticated, refreshWishlist]);

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return items.some(item => item.productId === productId);
    },
    [items]
  );

  const addToWishlist = useCallback(
    async (productId: string): Promise<void> => {
      if (pendingIds.has(productId)) return;

      setPendingIds(prev => new Set(prev).add(productId));
      setError(null);
      try {
        const addedItem = await addToWishlistApi(productId);
        setItems(prev => {
          if (prev.some(item => item.productId === productId)) return prev;
          return [addedItem, ...prev];
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to add artwork to wishlist.';
        setError(message);
        throw err;
      } finally {
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [pendingIds]
  );

  const removeFromWishlist = useCallback(
    async (productId: string): Promise<void> => {
      if (pendingIds.has(productId)) return;

      setPendingIds(prev => new Set(prev).add(productId));
      setError(null);
      try {
        await removeFromWishlistApi(productId);
        setItems(prev => prev.filter(item => item.productId !== productId));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to remove artwork from wishlist.';
        setError(message);
        throw err;
      } finally {
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [pendingIds]
  );

  const toggleWishlist = useCallback(
    async (productId: string): Promise<void> => {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    },
    [isInWishlist, removeFromWishlist, addToWishlist]
  );

  const value: WishlistContextValue = useMemo(
    () => ({
      items,
      itemCount: items.length,
      isLoading,
      error,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      refreshWishlist,
    }),
    [
      items,
      isLoading,
      error,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      refreshWishlist,
    ]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
