import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import { formatPrice, getAvailabilityInfo } from '@/utils';
import type { CartItem } from '@/types';

export interface CheckoutOrderSummaryProps {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
  isSubmitting?: boolean;
  onSubmit: () => void;
  isReviewMode?: boolean;
  onEditAddress?: () => void;
}

export function CheckoutOrderSummary({
  items,
  itemCount,
  subtotalPaise,
  isSubmitting = false,
  onSubmit,
  isReviewMode = false,
  onEditAddress,
}: CheckoutOrderSummaryProps): ReactNode {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="rounded-2xl border border-art-stone bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-art-stone/60 pb-3">
        <h2 className="font-serif text-lg font-bold text-art-charcoal">Order Summary</h2>
        <span className="text-xs text-stone-500 font-medium">{itemCount} items</span>
      </div>

      {/* Cart Items Preview List */}
      <div className="divide-y divide-art-stone/50 max-h-80 overflow-y-auto pr-1 -mr-1">
        {items.map(item => {
          const availability = getAvailabilityInfo(item.availability);
          const lineTotal = item.price * item.quantity;
          const hasError = imageErrors[item.productId];

          return (
            <div key={item.productId} className="py-3.5 flex items-start gap-3 first:pt-0">
              {/* Thumbnail */}
              <div className="relative aspect-square h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-art-stone bg-stone-100">
                {item.imageUrl && !hasError ? (
                  <img
                    src={item.imageUrl}
                    alt={item.imageAlt || item.name}
                    onError={() => handleImageError(item.productId)}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-art-cream text-art-charcoal font-serif font-bold text-xs"
                    aria-label="Artwork thumbnail placeholder"
                  >
                    ॐ
                  </div>
                )}
                <span className="absolute -top-1.5 -right-1.5 bg-art-charcoal text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow">
                  {item.quantity}
                </span>
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-semibold text-art-ochre truncate">
                    {item.categoryName}
                  </span>
                  {item.availability === 'MADE_TO_ORDER' && (
                    <Badge variant={availability.badgeVariant} className="text-[8px] py-0 px-1">
                      Made to Order
                    </Badge>
                  )}
                </div>
                <h3 className="font-serif text-xs font-bold text-art-charcoal truncate">
                  {item.name}
                </h3>
                <div className="text-[11px] text-stone-500">
                  <span>Qty: {item.quantity}</span>
                  <span className="mx-1.5 text-stone-300">•</span>
                  <span>{formatPrice(item.price)} each</span>
                </div>
              </div>

              {/* Line Total */}
              <div className="text-right">
                <span className="font-serif text-xs font-bold text-art-charcoal">
                  {formatPrice(lineTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing Breakdown */}
      <div className="border-t border-art-stone/60 pt-4 space-y-2.5 text-xs text-stone-600">
        <div className="flex justify-between">
          <span>Artworks Subtotal</span>
          <span className="font-semibold text-art-charcoal">{formatPrice(subtotalPaise)}</span>
        </div>

        <div className="flex justify-between">
          <span>Art Packaging & Wooden Crating</span>
          <span className="text-emerald-700 font-medium">Free Artisan Crating</span>
        </div>

        <div className="flex justify-between">
          <span>Insured Transit & Shipping</span>
          <span className="text-stone-500 italic">Calculated at payment</span>
        </div>

        <div className="flex justify-between">
          <span>Estimated GST (Taxes)</span>
          <span className="text-stone-500 italic">Included in catalog prices</span>
        </div>

        <div className="border-t border-art-stone pt-3 flex justify-between items-baseline">
          <span className="font-serif text-sm font-bold text-art-charcoal">Estimated Subtotal</span>
          <span className="font-serif text-xl font-bold text-art-charcoal tracking-tight">
            {formatPrice(subtotalPaise)}
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="space-y-3 pt-2">
        {!isReviewMode ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center"
            isLoading={isSubmitting}
            onClick={onSubmit}
            aria-label="Continue to Payment"
          >
            Continue to Payment →
          </Button>
        ) : (
          <div className="space-y-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center bg-art-terracotta hover:bg-art-terracotta/90"
              isLoading={isSubmitting}
              onClick={onSubmit}
              aria-label="Pay via Razorpay"
            >
              Pay {formatPrice(subtotalPaise)} via Razorpay
            </Button>

            {onEditAddress && (
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center"
                disabled={isSubmitting}
                onClick={onEditAddress}
              >
                ← Edit Contact & Shipping Details
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            to="/cart"
            className="font-medium text-art-ochre hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
          >
            ← Return to Cart
          </Link>
          <span className="text-stone-400 text-[11px]">256-Bit SSL Encrypted</span>
        </div>
      </div>

      {/* Artisan Value Guarantees */}
      <div className="rounded-xl bg-art-cream/60 p-3.5 border border-art-stone/60 space-y-2 text-[11px] text-stone-600">
        <div className="flex items-center gap-2">
          <span className="text-art-ochre font-bold">✓</span>
          <span>100% Authentic Handcrafted Heritage Artwork</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-art-ochre font-bold">📦</span>
          <span>Reinforced Multi-layer Shock-Absorbing Crate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-art-ochre font-bold">🛡️</span>
          <span>Transit Insured Doorstep Delivery in India</span>
        </div>
      </div>
    </div>
  );
}
