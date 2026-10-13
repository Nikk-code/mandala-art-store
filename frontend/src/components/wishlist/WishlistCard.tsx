import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { WishlistItemDto } from '@/types';
import { Badge, Button } from '@/components/ui';
import { formatPrice, getAvailabilityInfo } from '@/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export interface WishlistCardProps {
  item: WishlistItemDto;
}

export function WishlistCard({ item }: WishlistCardProps): ReactNode {
  const { product } = item;
  const { addItem } = useCart();
  const { removeFromWishlist } = useWishlist();

  const [imageError, setImageError] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const availability = getAvailabilityInfo(product.availability);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  const handleRemove = async (): Promise<void> => {
    setIsRemoving(true);
    try {
      await removeFromWishlist(product.id);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddToCart = (): void => {
    const success = addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      availability: product.availability,
      imageUrl: primaryImage?.url || null,
      imageAlt: primaryImage?.altText || product.name,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      dimensions: product.dimensions,
      isHandmade: product.isHandmade,
      quantity: 1,
    });
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    }
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-art-stone bg-white shadow-sm transition-all duration-200 hover:border-art-ochre/40 hover:shadow-art">
      {/* Product Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
        <Link
          to={`/products/${product.slug}`}
          className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
          aria-label={`View details for ${product.name}`}
        >
          {primaryImage?.url && !imageError ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.altText || product.name}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-art-cream"
              aria-label="Artwork placeholder"
            >
              <div className="relative mb-2 flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-art-ochre/30" />
                <span className="font-serif text-lg font-bold text-art-charcoal">ॐ</span>
              </div>
              <span className="text-xs font-medium text-stone-500">{product.name}</span>
            </div>
          )}
        </Link>

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-12 flex items-center gap-1.5 pointer-events-none">
          <Badge variant={availability.badgeVariant} className="shadow-sm text-[10px]">
            {availability.label}
          </Badge>
          {product.isHandmade && (
            <span className="text-[10px] uppercase font-semibold text-stone-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
              Handcrafted
            </span>
          )}
        </div>

        {/* Remove Button in Top Right */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving}
          aria-label={`Remove ${product.name} from wishlist`}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-400 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-art-ochre">
          {product.category.name}
        </div>

        <h3 className="font-serif text-base font-bold text-art-charcoal line-clamp-1 group-hover:text-art-ochre transition-colors">
          <Link
            to={`/products/${product.slug}`}
            className="hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
          >
            {product.name}
          </Link>
        </h3>

        {product.dimensions && (
          <p className="mt-1 text-xs text-stone-500">
            Dimensions: <span className="font-medium text-stone-700">{product.dimensions}</span>
          </p>
        )}

        {/* Pricing */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-serif text-lg font-bold text-art-charcoal">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-stone-600 line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-art-stone/60 space-y-2">
          {product.availability === 'SOLD_OUT' ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center opacity-60 cursor-not-allowed text-xs"
              disabled
            >
              Artwork Sold Out
            </Button>
          ) : (
            <Button
              variant={addedToCart ? 'secondary' : 'primary'}
              size="sm"
              className="w-full justify-center text-xs"
              onClick={handleAddToCart}
            >
              {addedToCart ? '✓ Added to Cart' : 'Move to Cart'}
            </Button>
          )}

          <Link
            to={`/products/${product.slug}`}
            className="inline-flex w-full items-center justify-center rounded-lg py-1.5 text-xs font-semibold text-stone-600 hover:text-art-charcoal hover:bg-art-stone/30 transition-colors text-center"
          >
            View Artwork Details →
          </Link>
        </div>
      </div>
    </article>
  );
}
