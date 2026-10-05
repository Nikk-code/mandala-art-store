import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Section,
  LoadingState,
  EmptyState,
  ErrorState,
  Pagination,
} from '@/components/ui';
import {
  ProductCard,
  CatalogFilters,
  ActiveFilterChips,
  MobileFilterDrawer,
  type CatalogFilterValues,
} from '@/components/catalog';
import { fetchCategories, fetchProducts } from '@/services';
import type { CategoryDto, ProductListItemDto, PaginationMeta } from '@/types';

const DEFAULT_PAGE_SIZE = 12;

export function ProductsPage(): ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL search params
  const categoryParam = searchParams.get('category') || undefined;
  const availabilityParam = searchParams.get('availability') || undefined;
  const sortParam =
    (searchParams.get('sort') as 'newest' | 'price_asc' | 'price_desc') || undefined;
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  // Component state
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: pageParam,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Load categories once on mount
  useEffect(() => {
    fetchCategories()
      .then(data => setCategories(data))
      .catch(() => {
        // Non-blocking fallback for categories list
      });
  }, []);

  // Fetch products helper
  const loadProducts = useCallback((): void => {
    setIsLoading(true);
    setError(null);

    fetchProducts({
      page: pageParam,
      pageSize: DEFAULT_PAGE_SIZE,
      category: categoryParam,
      availability: availabilityParam,
      sort: sortParam,
    })
      .then(res => {
        setProducts(res.items);
        setPagination(res.pagination);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error('Failed to load catalog products'));
        setIsLoading(false);
      });
  }, [categoryParam, availabilityParam, sortParam, pageParam]);

  // Fetch products whenever URL params change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // URL State Updates
  const updateFilterParams = (updates: Partial<CatalogFilterValues>): void => {
    const nextParams = new URLSearchParams(searchParams);

    if ('category' in updates) {
      if (updates.category) {
        nextParams.set('category', updates.category);
      } else {
        nextParams.delete('category');
      }
    }

    if ('availability' in updates) {
      if (updates.availability) {
        nextParams.set('availability', updates.availability);
      } else {
        nextParams.delete('availability');
      }
    }

    if ('sort' in updates) {
      if (updates.sort && updates.sort !== 'newest') {
        nextParams.set('sort', updates.sort);
      } else {
        nextParams.delete('sort');
      }
    }

    // Always reset page to 1 when changing filters or sort
    nextParams.delete('page');

    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage: number): void => {
    const nextParams = new URLSearchParams(searchParams);
    if (newPage > 1) {
      nextParams.set('page', String(newPage));
    } else {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = (): void => {
    setSearchParams(new URLSearchParams());
  };

  const filterValues: CatalogFilterValues = {
    category: categoryParam,
    availability: availabilityParam,
    sort: sortParam,
  };

  const activeFilterCount =
    (categoryParam ? 1 : 0) +
    (availabilityParam ? 1 : 0) +
    (sortParam && sortParam !== 'newest' ? 1 : 0);

  const activeCategoryObj = (Array.isArray(categories) ? categories : []).find(
    c => c.slug === categoryParam
  );

  return (
    <div className="space-y-0 pb-16">
      {/* 1. Page Header */}
      <Section background="stone" spacing="sm" className="border-b border-art-stone">
        <Container size="7xl">
          <div className="py-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-art-ochre">
              Artisan Catalog
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-art-charcoal mt-1">
              {activeCategoryObj ? activeCategoryObj.name : 'Explore All Artworks'}
            </h1>
            <p className="mt-1.5 text-sm text-stone-600 max-w-2xl leading-relaxed">
              {activeCategoryObj?.description ||
                'Discover individually handcrafted Sacred Mandalas, Kutchi Lippan Kaam reliefs, and spiritual paintings created by master artisans.'}
            </p>
          </div>
        </Container>
      </Section>

      {/* 2. Main Catalog Content Area */}
      <Section background="cream" spacing="md">
        <Container size="7xl">
          {/* Mobile Filter Trigger Bar */}
          <div className="lg:hidden flex items-center justify-between pb-4 border-b border-art-stone/80 mb-4">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="inline-flex items-center space-x-2 bg-white border border-art-stone px-4 py-2.5 rounded-xl text-xs font-semibold text-art-charcoal shadow-sm hover:bg-stone-50 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
              aria-label="Open filter and sorting options"
            >
              <svg
                className="h-4 w-4 text-art-ochre"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span>Refine & Sort</span>
              {activeFilterCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-art-ochre text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <span className="text-xs text-stone-500 font-medium">
              {isLoading ? 'Searching...' : `${pagination.totalItems} artworks`}
            </span>
          </div>

          {/* Desktop & Tablet Layout: Sidebar + Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Left Sidebar Filters */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 rounded-2xl bg-white border border-art-stone p-6 shadow-sm">
                <CatalogFilters
                  categories={categories}
                  values={filterValues}
                  onChange={updateFilterParams}
                  onReset={handleResetFilters}
                />
              </div>
            </div>

            {/* Right Main Product Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Active Filter Chips & Results Count */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <ActiveFilterChips
                  values={filterValues}
                  categories={categories}
                  onRemoveCategory={() => updateFilterParams({ category: undefined })}
                  onRemoveAvailability={() => updateFilterParams({ availability: undefined })}
                  onRemoveSort={() => updateFilterParams({ sort: undefined })}
                  onClearAll={handleResetFilters}
                />

                <div className="hidden lg:block text-xs text-stone-500 font-medium whitespace-nowrap ml-auto">
                  {!isLoading && (
                    <span>
                      Showing {products.length} of {pagination.totalItems} artworks
                    </span>
                  )}
                </div>
              </div>

              {/* State Handling: Loading, Error, Empty, or Product Grid */}
              {isLoading && (
                <div className="py-20 rounded-2xl bg-white/60 border border-art-stone">
                  <LoadingState message="Fetching curated catalog creations..." />
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-white p-8 border border-art-stone">
                  <ErrorState
                    title="Unable to load artworks"
                    message={error.message || 'Please check your connection and try again.'}
                    onRetry={loadProducts}
                  />
                </div>
              )}

              {!isLoading && !error && products.length === 0 && (
                <div className="rounded-2xl bg-white p-8 border border-art-stone">
                  <EmptyState
                    title="No artworks found"
                    description="No artworks matched your current filters. Try changing category, availability, or clearing filters."
                    actionLabel="Clear All Filters"
                    onAction={handleResetFilters}
                  />
                </div>
              )}

              {!isLoading && !error && products.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Mobile Slide-in Filter Drawer */}
      <MobileFilterDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        categories={categories}
        values={filterValues}
        onChange={updateFilterParams}
        onReset={handleResetFilters}
      />
    </div>
  );
}
