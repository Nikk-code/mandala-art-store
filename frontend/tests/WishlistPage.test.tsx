import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WishlistPage } from '@/pages/WishlistPage';
import { WishlistContext, type WishlistContextValue } from '@/context/WishlistContext';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';
import { CartContext } from '@/context/CartContext';
import type { WishlistItemDto, CartContextValue } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WishlistPage Component', () => {
  const sampleWishlistItem: WishlistItemDto = {
    id: 'wish-1',
    userId: 'user-1',
    productId: 'prod-1',
    createdAt: '2026-10-10T10:00:00.000Z',
    product: {
      id: 'prod-1',
      sku: 'MAN-001',
      name: 'Cosmic Mandala Canvas',
      slug: 'cosmic-mandala-canvas',
      shortDescription: 'Detailed cosmic art piece.',
      description: 'Handcrafted cosmic mandala painting.',
      price: 149900,
      compareAtPrice: 199900,
      availability: 'IN_STOCK',
      dimensions: '30x30 cm',
      material: 'Canvas',
      weightGrams: 500,
      isHandmade: true,
      isFeatured: true,
      category: {
        id: 'cat-1',
        name: 'Canvas Art',
        slug: 'canvas-art',
      },
      images: [
        {
          id: 'img-1',
          url: 'https://images.example.com/cosmic.jpg',
          altText: 'Cosmic Canvas',
          displayOrder: 0,
          isPrimary: true,
        },
      ],
      createdAt: '2026-10-01T10:00:00.000Z',
    },
  };

  const mockAuthContext: AuthContextValue = {
    user: {
      id: 'user-1',
      email: 'patron@example.com',
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '9876543210',
      role: 'CUSTOMER',
      createdAt: '2026-10-01T00:00:00.000Z',
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    updateProfile: vi.fn(),
  };

  const mockCartContext: CartContextValue = {
    items: [],
    itemCount: 0,
    subtotalPaise: 0,
    addItem: vi.fn().mockReturnValue(true),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
  };

  const mockWishlistContext: WishlistContextValue = {
    items: [sampleWishlistItem],
    itemCount: 1,
    isLoading: false,
    error: null,
    isInWishlist: vi.fn().mockReturnValue(true),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    toggleWishlist: vi.fn(),
    refreshWishlist: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage(
    authVal = mockAuthContext,
    wishlistVal = mockWishlistContext,
    cartVal = mockCartContext
  ) {
    return render(
      <AuthContext.Provider value={authVal}>
        <CartContext.Provider value={cartVal}>
          <WishlistContext.Provider value={wishlistVal}>
            <BrowserRouter>
              <WishlistPage />
            </BrowserRouter>
          </WishlistContext.Provider>
        </CartContext.Provider>
      </AuthContext.Provider>
    );
  }

  it('renders sign-in prompt when customer is unauthenticated', () => {
    const unauth = { ...mockAuthContext, user: null, isAuthenticated: false };
    renderPage(unauth);

    expect(screen.getByText('Sign In to View Your Wishlist')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('renders loading state when wishlist is fetching', () => {
    const loadingWishlist = { ...mockWishlistContext, isLoading: true };
    renderPage(mockAuthContext, loadingWishlist);

    expect(screen.getByText(/Retrieving your curated wishlist/i)).toBeInTheDocument();
  });

  it('renders empty wishlist state when customer has no saved items', () => {
    const emptyWishlist = { ...mockWishlistContext, items: [], itemCount: 0 };
    renderPage(mockAuthContext, emptyWishlist);

    expect(screen.getByText('Your Wishlist is Empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explore Artworks Catalog/i })).toBeInTheDocument();
  });

  it('renders saved artworks list with product card details', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /Saved Artworks/i })).toBeInTheDocument();
    expect(screen.getByText('1 artwork saved to your collection.')).toBeInTheDocument();
    expect(screen.getByText('Cosmic Mandala Canvas')).toBeInTheDocument();
    expect(screen.getByText('Canvas Art')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('Move to Cart')).toBeInTheDocument();
  });

  it('allows customer to remove an item from wishlist', async () => {
    renderPage();

    const removeBtn = screen.getByRole('button', {
      name: /Remove Cosmic Mandala Canvas from wishlist/i,
    });
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    expect(mockWishlistContext.removeFromWishlist).toHaveBeenCalledWith('prod-1');
  });

  it('allows customer to move item to cart', () => {
    renderPage();

    const addToCartBtn = screen.getByRole('button', { name: /Move to Cart/i });
    fireEvent.click(addToCartBtn);

    expect(mockCartContext.addItem).toHaveBeenCalled();
  });
});
