import { useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Section, Button, LoadingState, EmptyState } from '@/components/ui';
import { WishlistCard } from '@/components/wishlist';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export function WishlistPage(): ReactNode {
  const { items, itemCount, isLoading, error, refreshWishlist } = useWishlist();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Saved Artworks & Wishlist | Mandala Art Store';
  }, []);

  // 1. Loading State
  if (authLoading || isLoading) {
    return (
      <Container className="py-16">
        <LoadingState message="Retrieving your curated wishlist..." />
      </Container>
    );
  }

  // 2. Unauthenticated State
  if (!isAuthenticated) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center bg-white rounded-3xl border border-art-stone p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-art-charcoal">
            Sign In to View Your Wishlist
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
            Curate and preserve your personal collection of handcrafted mandalas, Lippan art, and
            spiritual canvas pieces across your devices.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              className="flex-1 justify-center"
              onClick={() => navigate('/login', { state: { returnTo: '/wishlist' } })}
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              className="flex-1 justify-center"
              onClick={() => navigate('/register', { state: { returnTo: '/wishlist' } })}
            >
              Create Account
            </Button>
          </div>
          <div className="mt-6 border-t border-art-stone/60 pt-4">
            <Link to="/products" className="text-xs font-semibold text-art-ochre hover:underline">
              ← Explore Sacred Artworks Catalog
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refreshWishlist()}>
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  // 4. Empty Wishlist State
  if (items.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Your Wishlist is Empty"
          description="You haven't saved any sacred artworks yet. Browse our collection of hand-drawn mandalas, mirror Lippan work, and spiritual paintings to save pieces you admire."
          actionLabel="Explore Artworks Catalog"
          onAction={() => navigate('/products')}
        />
      </Container>
    );
  }

  const inStockItems = items.filter(
    item =>
      item.product.availability === 'IN_STOCK' || item.product.availability === 'MADE_TO_ORDER'
  );

  const handleMoveAllToCart = (): void => {
    for (const item of inStockItems) {
      const primaryImage = item.product.images.find(img => img.isPrimary) || item.product.images[0];
      addItem({
        productId: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        sku: item.product.sku,
        price: item.product.price,
        compareAtPrice: item.product.compareAtPrice,
        availability: item.product.availability,
        imageUrl: primaryImage?.url || null,
        imageAlt: primaryImage?.altText || item.product.name,
        categoryName: item.product.category.name,
        categorySlug: item.product.category.slug,
        dimensions: item.product.dimensions,
        isHandmade: item.product.isHandmade,
        quantity: 1,
      });
    }
    navigate('/cart');
  };

  return (
    <Section spacing="lg">
      <Container>
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-art-stone pb-6">
          <div>
            <nav className="mb-2 text-xs text-stone-500" aria-label="Breadcrumbs">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link to="/" className="hover:text-art-charcoal">
                    Home
                  </Link>
                </li>
                <li>/</li>
                <li className="font-semibold text-art-charcoal" aria-current="page">
                  Wishlist
                </li>
              </ol>
            </nav>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-art-charcoal sm:text-4xl">
              Saved Artworks
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">
              {itemCount} {itemCount === 1 ? 'artwork' : 'artworks'} saved to your collection.
            </p>
          </div>

          {inStockItems.length > 0 && (
            <div className="flex gap-3">
              <Button variant="outline" size="md" onClick={handleMoveAllToCart} className="text-xs">
                Move Available to Cart ({inStockItems.length})
              </Button>
            </div>
          )}
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(item => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
