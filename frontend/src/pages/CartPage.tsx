import { useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Section, EmptyState } from '@/components/ui';
import { CartItemRow, CartSummary } from '@/components/cart';
import { useCart } from '@/context';

export function CartPage(): ReactNode {
  const { items, itemCount, subtotalPaise, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Shopping Cart | Mandala Art Store';
  }, []);

  return (
    <div className="pb-20">
      {/* 1. Breadcrumbs Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-art-stone bg-white/70 backdrop-blur-sm sticky top-0 z-20"
      >
        <Container size="7xl">
          <ol className="flex items-center space-x-2 py-3.5 text-xs text-stone-500">
            <li>
              <Link
                to="/"
                className="hover:text-art-ochre transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-stone-300">
              /
            </li>
            <li aria-current="page" className="font-medium text-art-charcoal">
              Shopping Cart
            </li>
          </ol>
        </Container>
      </nav>

      {/* 2. Main Content */}
      <Section background="cream" spacing="md">
        <Container size="7xl">
          <div className="py-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-art-ochre">
              Art Collection
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-art-charcoal mt-1">
              Your Curated Cart
            </h1>
            <p className="mt-1.5 text-sm text-stone-600 max-w-2xl leading-relaxed">
              Review your selected handmade creations before proceeding to packaging and checkout.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="py-16 rounded-2xl bg-white p-8 border border-art-stone mt-6">
              <EmptyState
                title="Your Cart is Empty"
                description="You have not added any artworks to your collection yet. Discover sacred mandalas, Lippan art, and traditional paintings handcrafted by master artisans."
                actionLabel="Explore Our Art"
                onAction={() => navigate('/products')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-6">
              {/* Left Column: Cart Items List (8 cols on lg) */}
              <div className="lg:col-span-8 rounded-2xl border border-art-stone bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-art-stone/80 pb-4 mb-2">
                  <h2 className="font-serif text-lg font-bold text-art-charcoal">
                    Artwork Items ({itemCount})
                  </h2>
                  <span className="text-xs text-stone-500 font-medium">Handmade Originals</span>
                </div>

                <div className="divide-y divide-art-stone/60">
                  {items.map(item => (
                    <CartItemRow
                      key={item.productId}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column: Order Summary (4 cols on lg) */}
              <div className="lg:col-span-4 sticky top-20">
                <CartSummary
                  subtotalPaise={subtotalPaise}
                  itemCount={itemCount}
                  onClearCart={clearCart}
                />
              </div>
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
