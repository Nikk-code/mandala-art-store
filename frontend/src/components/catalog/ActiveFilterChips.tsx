import type { ReactNode } from 'react';
import type { CategoryDto } from '@/types';
import type { CatalogFilterValues } from './CatalogFilters';
import { getAvailabilityInfo } from '@/utils';

export interface ActiveFilterChipsProps {
  values: CatalogFilterValues;
  categories: CategoryDto[];
  onRemoveCategory: () => void;
  onRemoveAvailability: () => void;
  onRemoveSort: () => void;
  onClearAll: () => void;
  className?: string;
}

const SORT_LABELS: Record<string, string> = {
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
};

export function ActiveFilterChips({
  values,
  categories,
  onRemoveCategory,
  onRemoveAvailability,
  onRemoveSort,
  onClearAll,
  className = '',
}: ActiveFilterChipsProps): ReactNode {
  const activeCategory = categories.find(c => c.slug === values.category);
  const availabilityInfo = values.availability ? getAvailabilityInfo(values.availability) : null;
  const isCustomSort = values.sort && values.sort !== 'newest';

  const hasAnyFilter = Boolean(activeCategory || availabilityInfo || isCustomSort);

  if (!hasAnyFilter) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 pt-1 pb-3 ${className}`}
      aria-label="Active filters"
    >
      <span className="text-xs font-semibold text-stone-500 mr-1">Active Filters:</span>

      {/* Category Chip */}
      {activeCategory && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-art-charcoal text-white shadow-sm">
          <span>Category: {activeCategory.name}</span>
          <button
            type="button"
            onClick={onRemoveCategory}
            className="hover:text-art-ochre focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full h-4 w-4 inline-flex items-center justify-center text-xs"
            aria-label={`Remove ${activeCategory.name} category filter`}
          >
            ×
          </button>
        </span>
      )}

      {/* Availability Chip */}
      {availabilityInfo && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-art-ochre/15 text-art-charcoal border border-art-ochre/30 shadow-sm">
          <span>Availability: {availabilityInfo.label}</span>
          <button
            type="button"
            onClick={onRemoveAvailability}
            className="hover:text-art-terracotta focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre rounded-full h-4 w-4 inline-flex items-center justify-center text-xs font-bold"
            aria-label={`Remove ${availabilityInfo.label} availability filter`}
          >
            ×
          </button>
        </span>
      )}

      {/* Sort Chip */}
      {isCustomSort && values.sort && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-art-stone text-art-charcoal border border-stone-300 shadow-sm">
          <span>Sort: {SORT_LABELS[values.sort] || values.sort}</span>
          <button
            type="button"
            onClick={onRemoveSort}
            className="hover:text-art-terracotta focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre rounded-full h-4 w-4 inline-flex items-center justify-center text-xs font-bold"
            aria-label="Reset sort order to newest"
          >
            ×
          </button>
        </span>
      )}

      {/* Clear All Action */}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-semibold text-art-terracotta hover:underline ml-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre rounded px-1 min-h-[32px] inline-flex items-center"
      >
        Clear All
      </button>
    </div>
  );
}
