import type { ReactNode } from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps): ReactNode {
  if (totalPages <= 1) {
    return null;
  }

  // Generate compact page numbers list (e.g. 1, 2, 3... or with ellipsis)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always include page 1
    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push('ellipsis');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }

    // Always include last page
    pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      className={`flex items-center justify-center space-x-1 sm:space-x-2 py-8 ${className}`}
      aria-label="Catalog pagination"
    >
      {/* Previous Page Button */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs font-semibold text-art-charcoal bg-white border border-art-stone rounded-xl hover:bg-stone-50 hover:border-art-sand disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
        aria-label="Go to previous page"
      >
        <span aria-hidden="true" className="mr-1">
          ←
        </span>
        <span>Previous</span>
      </button>

      {/* Numbered Page Buttons */}
      <div className="flex items-center space-x-1">
        {pages.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex items-center justify-center h-11 w-9 text-stone-600 font-medium select-none"
                aria-hidden="true"
              >
                …
              </span>
            );
          }

          const isCurrent = item === currentPage;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={isCurrent ? 'page' : undefined}
              aria-label={`Go to page ${item}`}
              className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 text-xs font-bold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre ${
                isCurrent
                  ? 'bg-art-charcoal text-white shadow-sm'
                  : 'bg-white text-art-charcoal border border-art-stone hover:bg-stone-50 hover:border-art-sand'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Next Page Button */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs font-semibold text-art-charcoal bg-white border border-art-stone rounded-xl hover:bg-stone-50 hover:border-art-sand disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
        aria-label="Go to next page"
      >
        <span>Next</span>
        <span aria-hidden="true" className="ml-1">
          →
        </span>
      </button>
    </nav>
  );
}
