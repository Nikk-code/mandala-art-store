import { useReducer, useEffect, type ReactNode } from 'react';
import { CART_STORAGE_KEY } from '@/constants';
import { CartContext } from './CartContext';
import type { CartItem, AddCartItemInput, CartContextValue } from '@/types';

type CartAction =
  | { type: 'HYDRATE_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: AddCartItemInput }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'CLEAR_CART' };

interface ReducerState {
  items: CartItem[];
}

/**
 * Validate and sanitize cart items loaded from storage
 */
function sanitizeStoredCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];

  const validItems: CartItem[] = [];

  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      typeof item.productId === 'string' &&
      typeof item.slug === 'string' &&
      typeof item.name === 'string' &&
      typeof item.sku === 'string' &&
      typeof item.price === 'number' &&
      Number.isFinite(item.price) &&
      item.price >= 0
    ) {
      const quantity =
        typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity >= 1
          ? Math.floor(item.quantity)
          : 1;

      validItems.push({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        sku: item.sku,
        price: Math.round(item.price),
        compareAtPrice: typeof item.compareAtPrice === 'number' ? item.compareAtPrice : null,
        quantity,
        imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : null,
        imageAlt: typeof item.imageAlt === 'string' ? item.imageAlt : null,
        categoryName: typeof item.categoryName === 'string' ? item.categoryName : 'Art',
        categorySlug: typeof item.categorySlug === 'string' ? item.categorySlug : 'art',
        availability: typeof item.availability === 'string' ? item.availability : 'IN_STOCK',
        dimensions: typeof item.dimensions === 'string' ? item.dimensions : null,
        isHandmade: typeof item.isHandmade === 'boolean' ? item.isHandmade : true,
      });
    }
  }

  return validItems;
}

function loadInitialCart(): CartItem[] {
  try {
    const serialized = localStorage.getItem(CART_STORAGE_KEY);
    if (!serialized) return [];
    const parsed = JSON.parse(serialized);
    return sanitizeStoredCart(parsed);
  } catch {
    // Malformed JSON, corrupted data, or localStorage disabled
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage quota exceeded or disabled
  }
}

function cartReducer(state: ReducerState, action: CartAction): ReducerState {
  switch (action.type) {
    case 'HYDRATE_CART': {
      return { items: action.payload };
    }

    case 'ADD_ITEM': {
      const input = action.payload;

      // Business Rule: SOLD_OUT items cannot be added to cart
      if (input.availability === 'SOLD_OUT') {
        return state;
      }

      const addQuantity =
        typeof input.quantity === 'number' && Number.isFinite(input.quantity) && input.quantity >= 1
          ? Math.floor(input.quantity)
          : 1;
      const existingIndex = state.items.findIndex(i => i.productId === input.productId);

      if (existingIndex >= 0) {
        // Increment quantity of existing line
        const updatedItems = [...state.items];
        const existing = updatedItems[existingIndex];
        updatedItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + addQuantity,
        };
        return { items: updatedItems };
      }

      // New line item
      const newItem: CartItem = {
        productId: input.productId,
        slug: input.slug,
        name: input.name,
        sku: input.sku,
        price: Math.round(input.price),
        compareAtPrice: input.compareAtPrice ?? null,
        quantity: addQuantity,
        imageUrl: input.imageUrl ?? null,
        imageAlt: input.imageAlt ?? null,
        categoryName: input.categoryName,
        categorySlug: input.categorySlug,
        availability: input.availability,
        dimensions: input.dimensions ?? null,
        isHandmade: input.isHandmade ?? true,
      };

      return { items: [...state.items, newItem] };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      const sanitizedQty =
        typeof quantity === 'number' && Number.isFinite(quantity) && quantity >= 1
          ? Math.floor(quantity)
          : 1;

      const updatedItems = state.items.map(item =>
        item.productId === productId ? { ...item, quantity: sanitizedQty } : item
      );

      return { items: updatedItems };
    }

    case 'REMOVE_ITEM': {
      return {
        items: state.items.filter(item => item.productId !== action.payload.productId),
      };
    }

    case 'CLEAR_CART': {
      return { items: [] };
    }

    default:
      return state;
  }
}

export interface CartProviderProps {
  children: ReactNode;
  initialItems?: CartItem[];
}

export function CartProvider({ children, initialItems }: CartProviderProps): ReactNode {
  const [state, dispatch] = useReducer(cartReducer, { items: initialItems ?? [] }, initial => ({
    items: initial.items.length > 0 ? initial.items : loadInitialCart(),
  }));

  // Sync to storage on item change
  useEffect(() => {
    saveCartToStorage(state.items);
  }, [state.items]);

  const addItem = (item: AddCartItemInput): boolean => {
    if (item.availability === 'SOLD_OUT') {
      return false;
    }
    dispatch({ type: 'ADD_ITEM', payload: item });
    return true;
  };

  const updateQuantity = (productId: string, quantity: number): void => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const removeItem = (productId: string): void => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };

  const clearCart = (): void => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
  const subtotalPaise = state.items.reduce((total, item) => total + item.price * item.quantity, 0);

  const contextValue: CartContextValue = {
    items: state.items,
    itemCount,
    subtotalPaise,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}
