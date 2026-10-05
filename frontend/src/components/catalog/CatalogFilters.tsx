import type { ReactNode } from 'react';
import type { CategoryDto } from '@/types';
import { Button } from '@/components/ui';

export interface CatalogFilterValues {
  category?: string;
  availability?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

export interface CatalogFiltersProps {
  categories: CategoryDto[];
  values: CatalogFilterValues;
  onChange: (updated: Partial<CatalogFilterValues>) => void;
  onReset: () => void;
  className?: string;
}

const AVAILABILITY_OPTIONS = [
  { label: 'All Availability', value: '' },
  { label: 'In Stock', value: 'IN_STOCK' },
  { label: 'Made to Order', value: 'MADE_TO_ORDER' },
  { label: 'Sold Out', value: 'SOLD_OUT' },
];

const SORT_OPTIONS: { label: string; value: 'newest' | 'price_asc' | 'price_desc' }[] = [
  { label: 'Newest Additions', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export function CatalogFilters({
  categories,
  values,
  onChange,
  onReset,
  className = '',
}: CatalogFiltersProps): ReactNode {
  const hasActiveFilters = Boolean(
    values.category || values.availability || (values.sort && values.sort !== 'newest')
  );

  return (
    <aside className={`space-y-6 ${className}`} aria-label="Catalog filters">
      {/* Filter Header & Reset Action */}
      <div className="flex items-center justify-between pb-3 border-b border-art-stone">
        <h2 className="font-serif text-lg font-bold text-art-charcoal">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-art-terracotta hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre rounded px-1"
          >
            Clear All
          </button>
        )}
      </div>

      {/* 1. Category Filter Group */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-900">
          Art Category
        </h3>
        <div className="space-y-1">
          {/* All Categories Option */}
          <button
            type="button"
            onClick={() => onChange({ category: undefined })}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre ${
              !values.category
                ? 'bg-art-charcoal text-white font-semibold shadow-sm'
                : 'text-stone-700 hover:bg-art-cream'
            }`}
          >
            <span>All Artworks</span>
            {!values.category && <span aria-hidden="true">✓</span>}
          </button>

          {/* Dynamic Categories */}
          {categories.map(cat => {
            const isSelected = values.category === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange({ category: isSelected ? undefined : cat.slug })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre ${
                  isSelected
                    ? 'bg-art-charcoal text-white font-semibold shadow-sm'
                    : 'text-stone-700 hover:bg-art-cream'
                }`}
              >
                <span>{cat.name}</span>
                {isSelected && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Availability Filter Group */}
      <div className="space-y-3 pt-3 border-t border-art-stone/60">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-900">
          Availability
        </h3>
        <div className="space-y-1">
          {AVAILABILITY_OPTIONS.map(option => {
            const isSelected =
              (!values.availability && option.value === '') || values.availability === option.value;
            return (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => onChange({ availability: option.value || undefined })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre ${
                  isSelected
                    ? 'bg-art-ochre/15 text-art-charcoal font-semibold border border-art-ochre/30'
                    : 'text-stone-700 hover:bg-art-cream'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <span className="text-art-ochre font-bold" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sort Filter Group */}
      <div className="space-y-3 pt-3 border-t border-art-stone/60">
        <label
          htmlFor="catalog-sort-select"
          className="block text-xs font-semibold uppercase tracking-widest text-stone-900"
        >
          Sort Order
        </label>
        <div className="relative">
          <select
            id="catalog-sort-select"
            value={values.sort || 'newest'}
            onChange={e =>
              onChange({ sort: e.target.value as 'newest' | 'price_asc' | 'price_desc' })
            }
            className="w-full appearance-none rounded-xl border border-art-stone bg-white px-3.5 py-2.5 pr-8 text-xs font-medium text-art-charcoal shadow-sm transition-colors focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre min-h-[44px]"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-500">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile-friendly clear button */}
      {hasActiveFilters && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onReset} className="w-full text-xs">
            Reset All Filters
          </Button>
        </div>
      )}
    </aside>
  );
}
