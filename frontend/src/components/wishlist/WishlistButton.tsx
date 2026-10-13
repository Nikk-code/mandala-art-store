import { useState, type ReactNode, type MouseEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

export interface WishlistButtonProps {
  productId: string;
  productName?: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WishlistButton({
  productId,
  productName,
  variant = 'icon',
  size = 'md',
  className = '',
}: WishlistButtonProps): ReactNode {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPending, setIsPending] = useState(false);

  const inWishlist = isInWishlist(productId);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
      return;
    }

    if (isPending) return;

    setIsPending(true);
    try {
      await toggleWishlist(productId);
    } catch {
      // Error handled by context state
    } finally {
      setIsPending(false);
    }
  };

  const label = inWishlist
    ? `Remove ${productName || 'artwork'} from wishlist`
    : `Add ${productName || 'artwork'} to wishlist`;

  // Size styling
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={label}
        aria-pressed={inWishlist}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre ${
          inWishlist
            ? 'border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
            : 'border border-art-stone bg-white text-art-charcoal hover:bg-art-cream hover:border-art-ochre/60'
        } ${isPending ? 'opacity-60 cursor-wait' : ''} ${className}`}
      >
        <svg
          className={`${iconSizeClasses} transition-transform duration-200 ${
            inWishlist ? 'scale-110 fill-rose-600 text-rose-600' : 'fill-none stroke-current'
          }`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>
          {isPending ? 'Updating...' : inWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}
        </span>
      </button>
    );
  }

  // Default: 'icon' button
  const buttonDimensions = {
    sm: 'h-8 w-8 min-h-[32px] min-w-[32px]',
    md: 'h-9 w-9 min-h-[36px] min-w-[36px]',
    lg: 'h-11 w-11 min-h-[44px] min-w-[44px]',
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={label}
      aria-pressed={inWishlist}
      className={`inline-flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all duration-200 hover:scale-110 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre ${buttonDimensions} ${
        inWishlist ? 'text-rose-600' : 'text-stone-500 hover:text-rose-600'
      } ${isPending ? 'opacity-60 cursor-wait' : ''} ${className}`}
    >
      <svg
        className={`${iconSizeClasses} transition-transform duration-200 ${
          inWishlist ? 'fill-rose-600 scale-105' : 'fill-none stroke-current'
        }`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
