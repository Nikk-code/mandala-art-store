import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge, IconButton } from '@/components/ui';
import { formatPrice, getAvailabilityInfo } from '@/utils';
import type { CartItem } from '@/types';

export interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps): ReactNode {
  const [imageError, setImageError] = useState(false);
  const availability = getAvailabilityInfo(item.availability);
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-b border-art-stone/80 last:border-b-0">
      {/* 1. Image + Info Group */}
      <div className="flex items-start space-x-4 flex-1 min-w-0">
        {/* Artwork Thumbnail */}
        <Link
          to={`/products/${item.slug}`}
          className="relative aspect-square h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-xl border border-art-stone bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
        >
          {item.imageUrl && !imageError ? (
            <img
              src={item.imageUrl}
              alt={item.imageAlt || item.name}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover object-center transition-transform hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center p-2 text-center bg-art-cream"
              aria-label="Artwork thumbnail placeholder"
            >
              <span className="font-serif text-sm font-bold text-art-charcoal">ॐ</span>
            </div>
          )}
        </Link>

        {/* Product Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-art-ochre">
              {item.categoryName}
            </span>
            {item.isHandmade && (
              <span className="text-[10px] uppercase font-semibold text-stone-600 bg-art-stone/50 px-1.5 py-0.5 rounded">
                Handcrafted
              </span>
            )}
            <Badge variant={availability.badgeVariant} className="text-[10px]">
              {availability.label}
            </Badge>
          </div>

          <Link
            to={`/products/${item.slug}`}
            className="block font-serif text-base font-bold text-art-charcoal hover:text-art-ochre transition-colors truncate focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
          >
            {item.name}
          </Link>

          {item.dimensions && (
            <p className="text-xs text-stone-500">
              Size: <span className="font-medium text-stone-700">{item.dimensions}</span>
            </p>
          )}

          <div className="text-xs text-stone-600">
            Unit Price:{' '}
            <span className="font-semibold text-art-charcoal">{formatPrice(item.price)}</span>
          </div>
        </div>
      </div>

      {/* 2. Quantity & Total Controls Group */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-art-stone/40">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-art-stone rounded-xl bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="flex h-11 w-11 items-center justify-center text-art-charcoal hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
            aria-label={`Decrease quantity for ${item.name}`}
          >
            <span className="text-lg font-bold">−</span>
          </button>

          <span
            className="w-10 text-center font-serif text-sm font-bold text-art-charcoal"
            aria-label={`Current quantity: ${item.quantity}`}
          >
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            className="flex h-11 w-11 items-center justify-center text-art-charcoal hover:bg-stone-100 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
            aria-label={`Increase quantity for ${item.name}`}
          >
            <span className="text-lg font-bold">+</span>
          </button>
        </div>

        {/* Item Total Price */}
        <div className="text-right min-w-[80px]">
          <span className="text-xs text-stone-600 block sm:hidden">Total</span>
          <span className="font-serif text-base sm:text-lg font-bold text-art-charcoal">
            {formatPrice(lineTotal)}
          </span>
        </div>

        {/* Remove Button */}
        <IconButton
          onClick={() => onRemove(item.productId)}
          aria-label={`Remove ${item.name} from cart`}
          className="text-stone-600 hover:text-art-terracotta hover:bg-stone-100"
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          }
        />
      </div>
    </div>
  );
}
