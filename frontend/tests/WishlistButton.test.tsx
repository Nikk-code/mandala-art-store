import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { WishlistContext, type WishlistContextValue } from '@/context/WishlistContext';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/products/cosmic-mandala' }),
  };
});

describe('WishlistButton Component', () => {
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

  const mockWishlistContext: WishlistContextValue = {
    items: [],
    itemCount: 0,
    isLoading: false,
    error: null,
    isInWishlist: vi.fn().mockReturnValue(false),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    toggleWishlist: vi.fn(),
    refreshWishlist: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderWithProviders(
    ui: React.ReactElement,
    authVal = mockAuthContext,
    wishlistVal = mockWishlistContext
  ) {
    return render(
      <AuthContext.Provider value={authVal}>
        <WishlistContext.Provider value={wishlistVal}>
          <BrowserRouter>{ui}</BrowserRouter>
        </WishlistContext.Provider>
      </AuthContext.Provider>
    );
  }

  it('renders outline heart button when product is not in wishlist', () => {
    renderWithProviders(
      <WishlistButton productId="prod-1" productName="Cosmic Mandala" variant="icon" />
    );

    const button = screen.getByRole('button', {
      name: /Add Cosmic Mandala to wishlist/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders active filled heart button when product is in wishlist', () => {
    const activeWishlistContext = {
      ...mockWishlistContext,
      isInWishlist: vi.fn().mockReturnValue(true),
    };

    renderWithProviders(
      <WishlistButton productId="prod-1" productName="Cosmic Mandala" variant="icon" />,
      mockAuthContext,
      activeWishlistContext
    );

    const button = screen.getByRole('button', {
      name: /Remove Cosmic Mandala from wishlist/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders button variant with textual label', () => {
    renderWithProviders(
      <WishlistButton productId="prod-1" productName="Cosmic Mandala" variant="button" />
    );

    expect(screen.getByText('Save to Wishlist')).toBeInTheDocument();
  });

  it('navigates unauthenticated patron to /login with returnTo state on click', () => {
    const unauthenticatedAuth = {
      ...mockAuthContext,
      user: null,
      isAuthenticated: false,
    };

    renderWithProviders(
      <WishlistButton productId="prod-1" productName="Cosmic Mandala" variant="icon" />,
      unauthenticatedAuth
    );

    const button = screen.getByRole('button', {
      name: /Add Cosmic Mandala to wishlist/i,
    });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { returnTo: '/products/cosmic-mandala' },
    });
    expect(mockWishlistContext.toggleWishlist).not.toHaveBeenCalled();
  });

  it('triggers toggleWishlist when authenticated patron clicks the button', async () => {
    renderWithProviders(
      <WishlistButton productId="prod-1" productName="Cosmic Mandala" variant="icon" />
    );

    const button = screen.getByRole('button', {
      name: /Add Cosmic Mandala to wishlist/i,
    });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockWishlistContext.toggleWishlist).toHaveBeenCalledWith('prod-1');
  });
});
