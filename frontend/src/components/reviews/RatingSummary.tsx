import type { ReactNode } from 'react';
import type { RatingSummaryDto } from '@/types';
import { StarRating } from './StarRating';

export interface RatingSummaryProps {
  summary: RatingSummaryDto;
  className?: string;
}

export function RatingSummary({ summary, className = '' }: RatingSummaryProps): ReactNode {
  const { averageRating, totalReviews, distribution } = summary;

  const stars = [5, 4, 3, 2, 1] as const;

  return (
    <div
      className={`rounded-2xl border border-art-stone bg-white p-6 shadow-sm ${className}`}
      aria-label="Product rating summary"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Score Overview */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-art-stone/60">
          <div className="text-5xl font-serif font-bold text-art-charcoal">
            {totalReviews > 0 ? averageRating.toFixed(1) : '—'}
          </div>
          <div className="mt-2">
            <StarRating rating={averageRating} size="lg" />
          </div>
          <p className="mt-2 text-xs font-medium text-stone-600">
            {totalReviews === 0
              ? 'No customer reviews yet'
              : `Based on ${totalReviews} customer review${totalReviews > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-7 space-y-2">
          {stars.map(star => {
            const count = distribution[star] || 0;
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                {/* Star label */}
                <div className="w-12 flex items-center justify-end gap-1 font-medium text-stone-600">
                  <span>{star}</span>
                  <span className="text-amber-400">★</span>
                </div>

                {/* Progress track */}
                <div
                  className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200"
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${star} star reviews: ${percentage}% (${count})`}
                >
                  <div
                    className="h-full bg-art-ochre rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Count & Percentage */}
                <div className="w-14 text-right text-stone-500 font-medium">
                  {count} <span className="text-stone-400 text-[10px]">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
