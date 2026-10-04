import { useState, type ReactNode } from 'react';
import type { ProductListItemDto } from '@/types';
import { Badge } from '@/components/ui';
import { formatPrice, getAvailabilityInfo } from '@/utils';

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
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-art-stone/80 bg-white transition-all duration-200 hover:border-art-ochre/40 hover:shadow-art ${className}`}
      onClick={onClick}
    >
      {/* Image Area with Aspect Ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
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
            aria-label="Image placeholder"
          >
            {/* Concentric subtle art circles */}
            <div className="relative mb-2 flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-art-ochre/30" />
              <div className="absolute inset-2 rounded-full border border-dashed border-art-terracotta/40" />
              <span className="font-serif text-lg font-bold text-art-charcoal">ॐ</span>
            </div>
            <span className="text-xs font-medium text-stone-500">{product.name}</span>
          </div>
        )}

        {/* Status Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
          {product.isFeatured ? (
            <Badge variant="ochre" className="shadow-sm">
              Featured
            </Badge>
          ) : (
            <span />
          )}

          <Badge variant={availability.badgeVariant} className="shadow-sm">
            {availability.label}
          </Badge>
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
            <span className="text-[10px] uppercase font-semibold text-stone-600 bg-art-stone/50 px-2 py-0.5 rounded">
              Handcrafted
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="font-serif text-base font-bold text-art-charcoal line-clamp-1 group-hover:text-art-ochre transition-colors">
          {product.name}
        </h3>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="mt-1 text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        )}

        {/* Dimensions & Material Preview */}
        {product.dimensions && (
          <p className="mt-2 text-[11px] text-stone-500">
            Size: <span className="font-medium">{product.dimensions}</span>
          </p>
        )}

        {/* Price Row */}
        <div className="mt-auto pt-3 border-t border-art-stone/40 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold text-art-charcoal tracking-tight">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-stone-600 line-through">
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
  );
}
