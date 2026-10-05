import type { ReactNode } from 'react';
import type { CategoryDto } from '@/types';
import { CatalogFilters, type CatalogFilterValues } from './CatalogFilters';
import { IconButton } from '@/components/ui';

export interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDto[];
  values: CatalogFilterValues;
  onChange: (updated: Partial<CatalogFilterValues>) => void;
  onReset: () => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  categories,
  values,
  onChange,
  onReset,
}: MobileFilterDrawerProps): ReactNode {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filters-title"
      className="fixed inset-0 z-50 flex lg:hidden"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Container */}
      <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-6 shadow-2xl z-10 animate-fadeIn">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-art-stone mb-4">
          <h2 id="mobile-filters-title" className="font-serif text-xl font-bold text-art-charcoal">
            Refine Artworks
          </h2>
          <IconButton
            aria-label="Close filters drawer"
            onClick={onClose}
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>

        {/* Filter Controls */}
        <div className="flex-1">
          <CatalogFilters
            categories={categories}
            values={values}
            onChange={updated => {
              onChange(updated);
            }}
            onReset={onReset}
          />
        </div>

        {/* Action Button */}
        <div className="pt-6 border-t border-art-stone mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-art-charcoal text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-sm hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre min-h-[44px]"
          >
            Apply & View Artworks
          </button>
        </div>
      </div>
    </div>
  );
}
