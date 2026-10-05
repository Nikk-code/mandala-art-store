import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CartPage } from '@/pages/CartPage';
import { CartProvider } from '@/context';
import type { CartItem } from '@/types';

describe('CartPage UI & Interaction', () => {
  const initialCartItems: CartItem[] = [
    {
      productId: 'prod-1',
      slug: 'cosmic-mandala-canvas',
      name: 'Cosmic Mandala Canvas',
      sku: 'MAN-001',
      price: 249900,
      compareAtPrice: 299900,
      quantity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1.jpg',
      imageAlt: 'Cosmic Mandala Canvas',
      categoryName: 'Mandala Art',
      categorySlug: 'mandala-art',
      availability: 'IN_STOCK',
      dimensions: '12 x 12 in',
      isHandmade: true,
    },
    {
      productId: 'prod-2',
      slug: 'kutch-sun-mirror-relief',
      name: 'Kutch Sun Mirror Relief',
      sku: 'LIP-001',
      price: 389900,
      compareAtPrice: 450000,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-2.jpg',
      imageAlt: 'Kutch Sun Mirror Relief',
      categoryName: 'Lippan Art',
      categorySlug: 'lippan-art',
      availability: 'MADE_TO_ORDER',
      dimensions: '16 x 16 in',
      isHandmade: true,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  const renderCartPage = (items?: CartItem[]) => {
    return render(
      <CartProvider initialItems={items}>
        <MemoryRouter initialEntries={['/cart']}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/products" element={<div>Products Catalog</div>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );
  };

  it('renders empty cart state with CTA when cart has no items', () => {
    renderCartPage([]);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Your Curated Cart' })
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Your Cart is Empty' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore Our Art' })).toBeInTheDocument();
  });

  it('renders cart items, line totals, and subtotal correctly', () => {
    renderCartPage(initialCartItems);

    // Header item count
    expect(screen.getByRole('heading', { name: 'Artwork Items (3)' })).toBeInTheDocument();

    // Item titles and prices
    expect(screen.getByText('Cosmic Mandala Canvas')).toBeInTheDocument();
    expect(screen.getByText('Kutch Sun Mirror Relief')).toBeInTheDocument();

    // Line totals: 2499 * 2 = 4998, 3899 * 1 = 3899
    expect(screen.getByText(/4,998/)).toBeInTheDocument();
    expect(screen.getAllByText(/3,899/).length).toBeGreaterThanOrEqual(1);

    // Subtotal: 4998 + 3899 = 8897
    expect(screen.getAllByText(/8,897/).length).toBeGreaterThanOrEqual(1);
  });

  it('increases and decreases quantity with buttons', () => {
    renderCartPage(initialCartItems);

    const increaseBtn = screen.getByRole('button', {
      name: 'Increase quantity for Cosmic Mandala Canvas',
    });
    fireEvent.click(increaseBtn);

    // Quantity becomes 3 -> 2499 * 3 = 7497
    expect(screen.getByText(/7,497/)).toBeInTheDocument();

    const decreaseBtn = screen.getByRole('button', {
      name: 'Decrease quantity for Cosmic Mandala Canvas',
    });
    fireEvent.click(decreaseBtn);

    // Back to 2
    expect(screen.getByText(/4,998/)).toBeInTheDocument();
  });

  it('disables decrease quantity button when item quantity is 1', () => {
    renderCartPage(initialCartItems);

    const decreaseBtnKutch = screen.getByRole('button', {
      name: 'Decrease quantity for Kutch Sun Mirror Relief',
    });
    expect(decreaseBtnKutch).toBeDisabled();
  });

  it('removes an item when clicking remove button', () => {
    renderCartPage(initialCartItems);

    const removeBtn = screen.getByRole('button', {
      name: 'Remove Cosmic Mandala Canvas from cart',
    });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('Cosmic Mandala Canvas')).not.toBeInTheDocument();
    expect(screen.getByText('Kutch Sun Mirror Relief')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Artwork Items (1)' })).toBeInTheDocument();
  });

  it('clears the cart when clicking Clear Cart', () => {
    renderCartPage(initialCartItems);

    const clearBtn = screen.getByRole('button', { name: 'Clear Cart' });
    fireEvent.click(clearBtn);

    expect(screen.getByRole('region', { name: 'Your Cart is Empty' })).toBeInTheDocument();
  });
});
