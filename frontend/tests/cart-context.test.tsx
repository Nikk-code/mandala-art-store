import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from '@/context';
import { CART_STORAGE_KEY } from '@/constants';
import type { AddCartItemInput } from '@/types';

describe('Cart Context & Guest Storage Foundation', () => {
  const mockItem1: AddCartItemInput = {
    productId: 'prod-1',
    slug: 'cosmic-mandala-canvas',
    name: 'Cosmic Mandala Canvas',
    sku: 'MAN-001',
    price: 249900, // ₹2,499 in paise
    compareAtPrice: 299900,
    availability: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1.jpg',
    imageAlt: 'Cosmic Mandala Canvas',
    categoryName: 'Mandala Art',
    categorySlug: 'mandala-art',
    dimensions: '12 x 12 in',
    isHandmade: true,
    quantity: 1,
  };

  const mockItem2: AddCartItemInput = {
    productId: 'prod-2',
    slug: 'kutch-sun-mirror-relief',
    name: 'Kutch Sun Mirror Relief',
    sku: 'LIP-001',
    price: 389900, // ₹3,899 in paise
    compareAtPrice: 450000,
    availability: 'MADE_TO_ORDER',
    imageUrl: 'https://images.unsplash.com/photo-2.jpg',
    imageAlt: 'Kutch Sun Mirror Relief',
    categoryName: 'Lippan Art',
    categorySlug: 'lippan-art',
    dimensions: '16 x 16 in',
    isHandmade: true,
    quantity: 1,
  };

  const mockSoldOutItem: AddCartItemInput = {
    productId: 'prod-3',
    slug: 'ancient-temple-mandala',
    name: 'Ancient Temple Mandala',
    sku: 'MAN-003',
    price: 549900,
    compareAtPrice: null,
    availability: 'SOLD_OUT',
    categoryName: 'Mandala Art',
    categorySlug: 'mandala-art',
    quantity: 1,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  it('initializes with an empty cart and zero counts', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.subtotalPaise).toBe(0);
  });

  it('adds an item and calculates subtotal in integer paise', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      const added = result.current.addItem(mockItem1);
      expect(added).toBe(true);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].productId).toBe('prod-1');
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.itemCount).toBe(1);
    expect(result.current.subtotalPaise).toBe(249900);
  });

  it('increments quantity when adding the same item twice', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
    });

    act(() => {
      result.current.addItem(mockItem1);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.itemCount).toBe(2);
    expect(result.current.subtotalPaise).toBe(249900 * 2); // 499800 paise (₹4,998)
  });

  it('prevents adding SOLD_OUT products into the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      const added = result.current.addItem(mockSoldOutItem);
      expect(added).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
  });

  it('allows adding MADE_TO_ORDER products into the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      const added = result.current.addItem(mockItem2);
      expect(added).toBe(true);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].availability).toBe('MADE_TO_ORDER');
    expect(result.current.itemCount).toBe(1);
  });

  it('updates item quantity and clamps to minimum 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
    });

    act(() => {
      result.current.updateQuantity('prod-1', 4);
    });

    expect(result.current.items[0].quantity).toBe(4);
    expect(result.current.itemCount).toBe(4);
    expect(result.current.subtotalPaise).toBe(249900 * 4);

    // Negative, 0, NaN, Infinity, and decimal quantities should clamp/normalize safely
    act(() => {
      result.current.updateQuantity('prod-1', -3);
    });
    expect(result.current.items[0].quantity).toBe(1);

    act(() => {
      result.current.updateQuantity('prod-1', 0);
    });
    expect(result.current.items[0].quantity).toBe(1);

    act(() => {
      result.current.updateQuantity('prod-1', NaN);
    });
    expect(result.current.items[0].quantity).toBe(1);

    act(() => {
      result.current.updateQuantity('prod-1', Infinity);
    });
    expect(result.current.items[0].quantity).toBe(1);

    act(() => {
      result.current.updateQuantity('prod-1', 3.7);
    });
    expect(result.current.items[0].quantity).toBe(3);
  });

  it('removes an item by productId', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
      result.current.addItem(mockItem2);
    });

    expect(result.current.items.length).toBe(2);

    act(() => {
      result.current.removeItem('prod-1');
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].productId).toBe('prod-2');
    expect(result.current.subtotalPaise).toBe(389900);
  });

  it('clears all items from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
      result.current.addItem(mockItem2);
    });

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.subtotalPaise).toBe(0);
  });

  it('persists cart changes to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(mockItem1);
    });

    const storedRaw = localStorage.getItem(CART_STORAGE_KEY);
    expect(storedRaw).toBeTruthy();
    const stored = JSON.parse(storedRaw!);
    expect(stored.length).toBe(1);
    expect(stored[0].productId).toBe('prod-1');
  });

  it('hydrates cart from valid localStorage data on mount', () => {
    const prefilledItems = [
      {
        productId: 'prod-1',
        slug: 'cosmic-mandala-canvas',
        name: 'Cosmic Mandala Canvas',
        sku: 'MAN-001',
        price: 249900,
        compareAtPrice: null,
        quantity: 3,
        imageUrl: null,
        imageAlt: null,
        categoryName: 'Mandala Art',
        categorySlug: 'mandala-art',
        availability: 'IN_STOCK',
        dimensions: null,
        isHandmade: true,
      },
    ];

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(prefilledItems));

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.itemCount).toBe(3);
    expect(result.current.subtotalPaise).toBe(249900 * 3);
  });

  it('recovers gracefully from malformed JSON in localStorage without throwing', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{invalid json syntax');

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
  });

  it('filters out invalid or corrupted items from localStorage safely', () => {
    const corruptedItems = [
      null,
      { invalid: 'object' },
      { productId: 123, price: 'invalid' },
      {
        productId: 'valid-1',
        slug: 'valid-art',
        name: 'Valid Art',
        sku: 'ART-001',
        price: 150000,
        quantity: -5, // Should clamp to 1
      },
    ];

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(corruptedItems));

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].productId).toBe('valid-1');
    expect(result.current.items[0].quantity).toBe(1);
  });
});
