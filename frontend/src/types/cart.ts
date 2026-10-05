import type { ProductAvailability } from './catalog';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  price: number; // In integer paise (e.g. 149900 = ₹1,499)
  compareAtPrice: number | null;
  quantity: number;
  imageUrl: string | null;
  imageAlt: string | null;
  categoryName: string;
  categorySlug: string;
  availability: ProductAvailability | string;
  dimensions: string | null;
  isHandmade: boolean;
}

export interface AddCartItemInput {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  quantity?: number;
  imageUrl?: string | null;
  imageAlt?: string | null;
  categoryName: string;
  categorySlug: string;
  availability: ProductAvailability | string;
  dimensions?: string | null;
  isHandmade?: boolean;
}

export interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
}

export interface CartContextValue extends CartState {
  addItem: (item: AddCartItemInput) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}
