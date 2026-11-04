import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/utils';

export interface CartSummaryProps {
  subtotalPaise: number;
  itemCount: number;
  onClearCart: () => void;
}

export function CartSummary({
  subtotalPaise,
  itemCount,
  onClearCart,
}: CartSummaryProps): ReactNode {
  return (
    <div className="rounded-2xl border border-art-stone dark:border-art-darkborder bg-white dark:bg-art-darkcard p-6 shadow-sm space-y-6">
      <h2 className="font-serif text-lg font-bold text-art-charcoal dark:text-stone-100 border-b border-art-stone/60 dark:border-art-darkborder pb-3">
        Order Preview
      </h2>

      {/* Pricing Breakdown */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Selected Artworks ({itemCount})</span>
          <span className="font-medium text-art-charcoal dark:text-stone-100">
            {formatPrice(subtotalPaise)}
          </span>
        </div>

        <div className="flex justify-between text-stone-600 dark:text-stone-400 text-xs">
          <span>Art Crating & Packaging</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            Free Artisan Crating
          </span>
        </div>

        <div className="flex justify-between text-stone-600 dark:text-stone-400 text-xs">
          <span>Shipping & Taxes</span>
          <span className="text-stone-600 dark:text-stone-400 italic">Calculated at checkout</span>
        </div>

        <div className="border-t border-art-stone dark:border-art-darkborder pt-3 flex justify-between items-baseline">
          <span className="font-serif text-base font-bold text-art-charcoal dark:text-stone-100">
            Subtotal
          </span>
          <span className="font-serif text-2xl font-bold text-art-charcoal dark:text-stone-100 tracking-tight">
            {formatPrice(subtotalPaise)}
          </span>
        </div>
      </div>

      {/* Checkout Preview & CTAs */}
      <div className="space-y-3 pt-2">
        <Link
          to={itemCount > 0 ? '/checkout' : '#'}
          aria-disabled={itemCount === 0}
          tabIndex={itemCount === 0 ? -1 : undefined}
          className={`w-full inline-flex items-center justify-center min-h-[50px] px-7 py-3 text-base font-semibold rounded-xl tracking-wide transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-art-terracotta ${
            itemCount > 0
              ? 'bg-art-terracotta text-white hover:bg-[#b04f30] active:bg-[#9a4327] hover:shadow-glow shadow-sm'
              : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed pointer-events-none'
          }`}
          aria-label="Proceed to Checkout"
        >
          Proceed to Checkout →
        </Link>

        <p className="text-[11px] text-center text-stone-500 dark:text-stone-400 italic">
          Bespoke wooden crating & insured delivery across India
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-art-stone/40 dark:border-art-darkborder">
          <Link
            to="/products"
            className="text-xs font-semibold text-art-ochre hover:underline py-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
          >
            ← Continue Browsing Art
          </Link>

          <button
            type="button"
            onClick={onClearCart}
            className="text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-art-terracotta py-2 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Value Pillars */}
      <div className="rounded-xl bg-art-cream/60 dark:bg-art-darkstone p-4 border border-art-stone/60 dark:border-art-darkborder space-y-2 text-xs text-stone-600 dark:text-stone-300">
        <div className="flex items-center gap-2">
          <span className="text-art-ochre font-bold">✓</span>
          <span>100% Authentic Handcrafted Heritage</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-art-ochre font-bold">📦</span>
          <span>Secure Multi-layer Wooden Crating</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-art-ochre font-bold">🛡️</span>
          <span>Transit Insured Delivery in India</span>
        </div>
      </div>
    </div>
  );
}
