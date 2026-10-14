import { useState, type ReactNode, type KeyboardEvent } from 'react';

export interface StarRatingProps {
  rating: number; // 0 to 5 (can be decimal for display)
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  ariaLabel?: string;
  className?: string;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  ariaLabel,
  className = '',
}: StarRatingProps): ReactNode {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-7 h-7 text-lg',
  }[size];

  const effectiveRating = interactive && hoverRating !== null ? hoverRating : rating;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, star: number) => {
    if (!interactive || !onRatingChange) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(star + 1, maxStars);
      onRatingChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(star - 1, 1);
      onRatingChange(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRatingChange(star);
    }
  };

  if (interactive) {
    return (
      <div
        role="radiogroup"
        aria-label={ariaLabel || 'Select artwork rating from 1 to 5 stars'}
        className={`inline-flex items-center gap-1 ${className}`}
        onMouseLeave={() => setHoverRating(null)}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= effectiveRating;

          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={rating === starValue}
              aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
              tabIndex={rating === starValue || (rating === 0 && starValue === 1) ? 0 : -1}
              onClick={() => onRatingChange?.(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onKeyDown={e => handleKeyDown(e, starValue)}
              className={`p-0.5 rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre cursor-pointer ${
                isFilled ? 'text-amber-400' : 'text-stone-300 hover:text-amber-300'
              }`}
            >
              <svg
                className={`${sizeClasses} fill-current transition-colors`}
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>
    );
  }

  // Read-only display
  return (
    <div
      role="img"
      aria-label={ariaLabel || `Rated ${rating.toFixed(1)} out of ${maxStars} stars`}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const diff = effectiveRating - i;

        // Fully filled star
        if (diff >= 1) {
          return (
            <svg
              key={i}
              className={`${sizeClasses} text-amber-400 fill-amber-400`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          );
        }

        // Partial star (>= 0.3)
        if (diff > 0.25) {
          return (
            <div key={i} className={`relative ${sizeClasses}`}>
              {/* Empty background */}
              <svg
                className={`absolute inset-0 ${sizeClasses} text-stone-200 fill-stone-200`}
                viewBox="0 0 24 24"
              >
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              {/* Clipped filled foreground */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${Math.round(diff * 100)}%` }}
              >
                <svg className={`${sizeClasses} text-amber-400 fill-amber-400`} viewBox="0 0 24 24">
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
            </div>
          );
        }

        // Empty star
        return (
          <svg
            key={i}
            className={`${sizeClasses} text-stone-200 fill-stone-200`}
            viewBox="0 0 24 24"
          >
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        );
      })}
    </div>
  );
}
