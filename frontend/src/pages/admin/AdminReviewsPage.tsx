import { useState, useEffect, useCallback, useRef, type FormEvent, type ReactNode } from 'react';
import {
  fetchAdminReviews,
  updateAdminReviewStatus,
  deleteAdminReview,
  fetchAdminProducts,
} from '@/services/admin-service';
import type {
  AdminReviewDto,
  ReviewStatusType,
  AdminReviewSortOption,
  AdminProductDto,
} from '@/types';
import { LoadingState, EmptyState, Pagination } from '@/components/ui';
import { StarRating } from '@/components/reviews/StarRating';

export function AdminReviewsPage(): ReactNode {
  const [reviews, setReviews] = useState<AdminReviewDto[]>([]);
  const [products, setProducts] = useState<AdminProductDto[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatusType | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<AdminReviewSortOption>('newest');

  // Loading & Global Status States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Action In-Progress & Delete Modal State
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<AdminReviewDto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Request-sequencing and accessible focus refs
  const requestIdRef = useRef<number>(0);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Load product catalog for filtering dropdown
  const loadProductOptions = useCallback(async (): Promise<void> => {
    try {
      const res = await fetchAdminProducts({ pageSize: 100 });
      setProducts(res.items);
    } catch {
      // Non-critical: product filtering can still work via ID or search
    }
  }, []);

  useEffect(() => {
    loadProductOptions();
  }, [loadProductOptions]);

  // Load reviews list with request-sequencing guard to prevent stale responses
  const loadReviews = useCallback(
    async (overridePage?: number): Promise<void> => {
      const activePage = overridePage ?? page;
      const currentRequestId = ++requestIdRef.current;

      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminReviews({
          page: activePage,
          pageSize,
          search: search.trim() || undefined,
          status: selectedStatus || undefined,
          productId: selectedProductId || undefined,
          sort: selectedSort,
        });

        // Guard: Discard stale response if a newer request was initiated
        if (currentRequestId === requestIdRef.current) {
          setReviews(res.items);
          setTotalItems(res.pagination.totalItems);
          setTotalPages(res.pagination.totalPages);
          setLoading(false);
        }
      } catch (err) {
        // Guard: Discard stale error if a newer request was initiated
        if (currentRequestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch customer reviews.');
          setLoading(false);
        }
      }
    },
    [page, pageSize, search, selectedStatus, selectedProductId, selectedSort]
  );

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Search submission
  const handleSearchSubmit = (e: FormEvent): void => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  // Reset all filters
  const handleResetFilters = (): void => {
    setSearchInput('');
    setSearch('');
    setSelectedStatus('');
    setSelectedProductId('');
    setSelectedSort('newest');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedStatus) ||
    Boolean(selectedProductId) ||
    selectedSort !== 'newest';

  // Status moderation action (Approve / Reject)
  const handleStatusChange = async (
    review: AdminReviewDto,
    newStatus: ReviewStatusType
  ): Promise<void> => {
    if (actionInProgressId) return;

    setActionInProgressId(review.id);
    setError(null);

    try {
      const updated = await updateAdminReviewStatus(review.id, { status: newStatus });
      setReviews(prev =>
        prev.map(r => (r.id === review.id ? { ...r, status: updated.status } : r))
      );
      const actionWord = newStatus === 'APPROVED' ? 'approved' : 'rejected';
      setSuccessMessage(
        `Review by ${review.customer.firstName} ${review.customer.lastName} for "${review.product.name}" was ${actionWord}.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to update review status to ${newStatus}.`
      );
    } finally {
      setActionInProgressId(null);
    }
  };

  // Delete modal handlers with focus management
  const handleOpenDeleteModal = (review: AdminReviewDto, triggerElement?: HTMLElement): void => {
    triggerElementRef.current = triggerElement || (document.activeElement as HTMLElement) || null;
    setReviewToDelete(review);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = useCallback((): void => {
    if (isDeleting) return;
    setReviewToDelete(null);
    setDeleteError(null);
  }, [isDeleting]);

  // Accessible dialog focus trapping, Escape key, and focus restoration
  useEffect(() => {
    if (!reviewToDelete) return;

    // Move keyboard focus into the dialog when opened
    const timer = setTimeout(() => {
      if (cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 0);

    // Prevent background content scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Trap focus and handle Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isDeleting) {
          handleCloseDeleteModal();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus to delete trigger button when dialog closes
      if (
        triggerElementRef.current &&
        typeof triggerElementRef.current.focus === 'function' &&
        document.body.contains(triggerElementRef.current)
      ) {
        triggerElementRef.current.focus();
      }
    };
  }, [reviewToDelete, isDeleting, handleCloseDeleteModal]);

  const handleConfirmDelete = async (): Promise<void> => {
    if (!reviewToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    const deletedId = reviewToDelete.id;
    const customerName = `${reviewToDelete.customer.firstName} ${reviewToDelete.customer.lastName}`;

    try {
      await deleteAdminReview(deletedId);

      const newTotalItems = Math.max(0, totalItems - 1);
      const newTotalPages = newTotalItems === 0 ? 0 : Math.ceil(newTotalItems / pageSize);

      setSuccessMessage(`Review by ${customerName} was permanently deleted.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      setReviewToDelete(null);

      // Check if the deleted review was the last one on the current page
      if (reviews.length === 1) {
        if (newTotalItems === 0) {
          // Zero-review case: no reviews remaining in current query/dataset
          setReviews([]);
          setTotalItems(0);
          setTotalPages(0);
          setPage(1);
        } else if (page > newTotalPages && page > 1) {
          // Current page exceeds new maximum page count -> move to previous valid page
          const targetPage = Math.max(1, newTotalPages);
          setPage(targetPage);
          // State update triggers loadReviews(targetPage) via useEffect without duplicate request
        } else {
          // Same page still valid, reload from API to populate shifted items
          await loadReviews(page);
        }
      } else {
        // More than 1 item on current page: remove from current list and update totals
        setReviews(prev => prev.filter(r => r.id !== deletedId));
        setTotalItems(newTotalItems);
        setTotalPages(newTotalPages);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete review.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Status badge with icons and accessible text
  const renderStatusBadge = (status: ReviewStatusType): ReactNode => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <svg
              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Approved</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <svg
              className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Rejected</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <svg
              className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Pending Moderation</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-art-charcoal dark:text-stone-100 font-serif">
            Review Moderation
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
            Moderate customer artwork reviews, approve genuine patron feedback, and protect gallery
            authenticity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadReviews()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 dark:border-art-darkborder bg-white dark:bg-art-darkcard hover:bg-stone-50 dark:hover:bg-art-darkstone text-art-charcoal dark:text-stone-100 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 text-stone-500 dark:text-stone-400 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-sm animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-300 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadReviews()}
            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors self-start sm:self-auto shrink-0 shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-art-darkcard rounded-xl border border-stone-200 dark:border-art-darkborder p-4 sm:p-5 shadow-sm space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label
              htmlFor="reviewSearch"
              className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
            >
              Search Reviews
            </label>
            <div className="flex gap-2">
              <input
                id="reviewSearch"
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Product, customer, title..."
                className="flex-1 min-h-[44px] px-3 py-2 text-xs border border-stone-300 dark:border-art-darkborder dark:bg-art-darkstone dark:text-stone-100 dark:placeholder-stone-500 rounded-lg focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg bg-art-ochre hover:bg-amber-600 text-art-charcoal transition-colors shrink-0 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-art-charcoal"
              >
                Search
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="statusFilter"
              className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
            >
              Moderation Status
            </label>
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value as ReviewStatusType | '');
                setPage(1);
              }}
              className="w-full min-h-[44px] px-3 py-2 text-xs border border-stone-300 dark:border-art-darkborder dark:bg-art-darkstone dark:text-stone-100 focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Moderation</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label
              htmlFor="productFilter"
              className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
            >
              Artwork / Product
            </label>
            <select
              id="productFilter"
              value={selectedProductId}
              onChange={e => {
                setSelectedProductId(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-[44px] px-3 py-2 text-xs border border-stone-300 dark:border-art-darkborder dark:bg-art-darkstone dark:text-stone-100 focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none bg-white truncate"
            >
              <option value="">All Artworks</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label
              htmlFor="sortFilter"
              className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
            >
              Sort Order
            </label>
            <select
              id="sortFilter"
              value={selectedSort}
              onChange={e => {
                setSelectedSort(e.target.value as AdminReviewSortOption);
                setPage(1);
              }}
              className="w-full min-h-[44px] px-3 py-2 text-xs border border-stone-300 dark:border-art-darkborder dark:bg-art-darkstone dark:text-stone-100 focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating_desc">Highest Rating (5 → 1)</option>
              <option value="rating_asc">Lowest Rating (1 → 5)</option>
            </select>
          </div>
        </form>

        {/* Filter Summary & Clear Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-3 border-t border-stone-100 dark:border-art-darkborder gap-2">
          <span className="text-stone-500 dark:text-stone-400 font-medium">
            Showing <strong>{reviews.length}</strong> of <strong>{totalItems}</strong> matching
            reviews
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-[36px] inline-flex items-center text-art-ochre hover:text-amber-700 dark:hover:text-amber-400 font-semibold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre rounded px-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Review List Content */}
      {loading ? (
        <div className="py-20">
          <LoadingState message="Loading customer reviews for moderation..." />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews found"
          description={
            hasActiveFilters
              ? 'No customer reviews match your active moderation or search filters. Try clearing your filters.'
              : 'No customer reviews have been submitted yet.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
          onAction={hasActiveFilters ? handleResetFilters : undefined}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map(review => {
            const isRowBusy = actionInProgressId === review.id;

            return (
              <article
                key={review.id}
                data-testid={`review-card-${review.id}`}
                className="bg-white dark:bg-art-darkcard rounded-xl border border-stone-200 dark:border-art-darkborder shadow-sm p-4 sm:p-6 transition-all hover:border-stone-300 dark:hover:border-stone-600 space-y-4"
              >
                {/* Header: Product, Customer, Date, Status */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-stone-100 dark:border-art-darkborder pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-art-charcoal dark:text-stone-100 font-serif">
                        {review.product.name}
                      </h2>
                      <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-art-darkstone px-2 py-0.5 rounded">
                        SKU: {review.product.sku}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                      <span>
                        By{' '}
                        <strong className="text-art-charcoal dark:text-stone-100">
                          {review.customer.firstName} {review.customer.lastName}
                        </strong>
                      </span>
                      <span className="text-stone-300 dark:text-stone-600">•</span>
                      <span className="font-mono text-stone-500 dark:text-stone-400">
                        {review.customer.email}
                      </span>

                      {review.isVerifiedPurchase && (
                        <>
                          <span className="text-stone-300 dark:text-stone-600">•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                            Verified Purchase
                          </span>
                        </>
                      )}

                      {review.orderId && (
                        <>
                          <span className="text-stone-300 dark:text-stone-600">•</span>
                          <span className="text-stone-500 dark:text-stone-400 text-[11px] font-mono">
                            Order Ref: {review.orderId.slice(0, 8)}...
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                    {renderStatusBadge(review.status)}
                    <time
                      dateTime={review.createdAt}
                      className="text-[11px] text-stone-500 dark:text-stone-400 font-mono"
                    >
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>

                {/* Body: Rating, Title, Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StarRating
                      rating={review.rating}
                      size="sm"
                      ariaLabel={`Rating: ${review.rating} out of 5 stars`}
                    />
                    <span
                      className="text-xs font-bold text-art-charcoal dark:text-stone-100"
                      aria-hidden="true"
                    >
                      {review.rating} / 5
                    </span>
                  </div>

                  {review.title && (
                    <h3 className="text-sm font-semibold text-art-charcoal dark:text-stone-100">
                      {review.title}
                    </h3>
                  )}

                  {review.body ? (
                    <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                      {review.body}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-400 dark:text-stone-500 italic">
                      No written comment provided.
                    </p>
                  )}
                </div>

                {/* Footer: Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-art-darkborder">
                  <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
                    Review ID: {review.id}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Approve Action */}
                    {review.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(review, 'APPROVED')}
                        disabled={isRowBusy}
                        className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Approve review for ${review.product.name}`}
                      >
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{isRowBusy ? 'Processing...' : 'Approve'}</span>
                      </button>
                    )}

                    {/* Reject Action */}
                    {review.status !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(review, 'REJECTED')}
                        disabled={isRowBusy}
                        className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-art-darkstone hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-art-darkborder transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Reject review for ${review.product.name}`}
                      >
                        <svg
                          className="w-3.5 h-3.5 mr-1 text-stone-600 dark:text-stone-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span>{isRowBusy ? 'Processing...' : 'Reject'}</span>
                      </button>
                    )}

                    {/* Delete Action */}
                    <button
                      type="button"
                      onClick={e => handleOpenDeleteModal(review, e.currentTarget)}
                      disabled={isRowBusy}
                      className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-1.5 text-xs font-semibold rounded-lg text-rose-700 dark:text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-300 dark:border-rose-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Delete review for ${review.product.name}`}
                    >
                      <svg
                        className="w-3.5 h-3.5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Pagination Navigation */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={newPage => setPage(newPage)}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget && !isDeleting) {
              handleCloseDeleteModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteModalTitle"
            ref={modalRef}
            tabIndex={-1}
            className="bg-white dark:bg-art-darkcard rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 dark:border-art-darkborder space-y-4 animate-in fade-in zoom-in-95 outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3
                  id="deleteModalTitle"
                  className="text-base font-bold text-art-charcoal dark:text-stone-100 font-serif"
                >
                  Delete Customer Review
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Authoritative administrative removal
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Are you sure you want to permanently delete the review for{' '}
              <strong className="text-art-charcoal dark:text-stone-100">
                {reviewToDelete.product.name}
              </strong>{' '}
              submitted by{' '}
              <strong className="text-art-charcoal dark:text-stone-100">
                {reviewToDelete.customer.firstName} {reviewToDelete.customer.lastName}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="bg-stone-50 dark:bg-art-darkstone/60 p-3 rounded-lg border border-stone-200 dark:border-art-darkborder text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-art-charcoal dark:text-stone-100">Rating:</span>
                <span className="dark:text-stone-300">{reviewToDelete.rating} / 5 stars</span>
              </div>
              {reviewToDelete.title && (
                <div>
                  <span className="font-semibold text-art-charcoal dark:text-stone-100">
                    Title:
                  </span>{' '}
                  <span className="italic font-medium dark:text-stone-300">
                    "{reviewToDelete.title}"
                  </span>
                </div>
              )}
            </div>

            {deleteError && (
              <div
                role="alert"
                className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded text-xs text-rose-800 dark:text-rose-300"
              >
                {deleteError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                type="button"
                ref={cancelBtnRef}
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 dark:border-art-darkborder text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-art-darkstone transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
