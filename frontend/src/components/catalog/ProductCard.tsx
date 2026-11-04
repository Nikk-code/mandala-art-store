import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ProductListItemDto } from '@/types';
import { Badge } from '@/components/ui';
import { formatPrice, getAvailabilityInfo } from '@/utils';
import { WishlistButton } from '@/components/wishlist';

export interface ProductCardProps {
  product: ProductListItemDto;
  className?: string;
  onClick?: () => void;
}

export function ProductCard({ product, className = '', onClick }: ProductCardProps): ReactNode {
  const [imageError, setImageError] = useState(false);

  // Find primary image or first available image
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const availability = getAvailabilityInfo(product.availability);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link
      to={`/products/${product.slug}`}
      className={`group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre rounded-2xl ${className}`}
      onClick={onClick}
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-art-stone/80 dark:border-art-darkborder bg-white dark:bg-art-darkcard transition-all duration-300 hover:-translate-y-1 hover:border-art-terracotta/50 hover:shadow-glow">
        {/* Image Area with Aspect Ratio */}
        <div className="relative aspect-square w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
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
              className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-art-cream dark:bg-art-midnight"
              aria-label="Image placeholder"
            >
              {/* Concentric subtle art circles */}
              <div className="relative mb-2 flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-art-ochre/30" />
                <div className="absolute inset-2 rounded-full border border-dashed border-art-terracotta/40" />
                <span className="font-serif text-lg font-bold text-art-charcoal dark:text-stone-100">
                  ॐ
                </span>
              </div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {product.name}
              </span>
            </div>
          )}

          {/* Status Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none z-10">
            {product.isFeatured && (
              <Badge variant="ochre" className="shadow-sm text-[10px]">
                Featured
              </Badge>
            )}
            <Badge variant={availability.badgeVariant} className="shadow-sm text-[10px]">
              {availability.label}
            </Badge>
          </div>

          {/* Wishlist Button Overlay */}
          <div className="absolute top-3 right-3 z-10">
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variant="icon"
              size="sm"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {/* Category & Handcrafted Tag */}
          <div className="mb-1.5 flex items-center justify-between text-xs text-stone-500">
            <span className="font-medium tracking-wide uppercase text-[11px] text-art-ochre">
              {product.category.name}
            </span>
            {product.isHandmade && (
              <span className="text-[10px] uppercase font-semibold text-stone-600 dark:text-stone-300 bg-art-stone/50 dark:bg-art-darkstone px-2 py-0.5 rounded">
                Handcrafted
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-serif text-base font-bold text-art-charcoal dark:text-stone-100 line-clamp-1 group-hover:text-art-ochre transition-colors">
            {product.name}
          </h3>

          {/* Rating Preview */}
          {product.totalReviews !== undefined && product.totalReviews > 0 && (
            <div
              className="mt-1 flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400"
              aria-label={`Rated ${product.averageRating?.toFixed(1)} out of 5 stars (${product.totalReviews} reviews)`}
            >
              <span className="text-amber-400 text-xs leading-none" aria-hidden="true">
                ★
              </span>
              <span className="font-bold text-art-charcoal dark:text-stone-100 text-xs leading-none">
                {product.averageRating?.toFixed(1)}
              </span>
              <span className="text-stone-400 text-[11px] leading-none">
                ({product.totalReviews})
              </span>
            </div>
          )}

          {/* Short Description */}
          {product.shortDescription && (
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Dimensions & Material Preview */}
          {product.dimensions && (
            <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
              Size: <span className="font-medium">{product.dimensions}</span>
            </p>
          )}

          {/* Price Row */}
          <div className="mt-auto pt-3 border-t border-art-stone/40 dark:border-art-darkborder flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold text-art-charcoal dark:text-stone-100 tracking-tight">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-stone-600 dark:text-stone-400 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
              )}
            </div>

            <span className="text-xs font-semibold text-art-terracotta group-hover:underline">
              View Details →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
