import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type {
  ReviewDto,
  ReviewStatusType,
  RatingSummaryDto,
  ReviewEligibilityDto,
  CreateReviewInput,
  UpdateReviewInput,
} from '@/types';
import { useAuth } from '@/context';
import {
  fetchProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
} from '@/services';
import { RatingSummary } from './RatingSummary';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { StarRating } from './StarRating';
import { Button, LoadingState, ErrorState } from '@/components/ui';

export interface ActionFeedback {
  title: string;
  description?: string;
  type?: 'success' | 'error';
}

export interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productSlug: string;
  onSummaryChange?: (summary: RatingSummaryDto) => void;
  className?: string;
}

export function ProductReviewsSection({
  productId,
  productName,
  productSlug,
  onSummaryChange,
  className = '',
}: ProductReviewsSectionProps): ReactNode {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [summary, setSummary] = useState<RatingSummaryDto>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [eligibility, setEligibility] = useState<ReviewEligibilityDto | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form display state: 'closed' | 'create' | 'edit'
  const [formMode, setFormMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingReview, setEditingReview] = useState<ReviewDto | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [isDeletingAuthorReview, setIsDeletingAuthorReview] = useState<boolean>(false);

  const reviewsReqIdRef = useRef(0);
  const eligReqIdRef = useRef(0);

  const loadReviewsData = useCallback(async () => {
    const reqId = ++reviewsReqIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchProductReviews(productId);
      if (reqId !== reviewsReqIdRef.current) return;
      const safeReviews = Array.isArray(data?.reviews) ? data.reviews : [];
      const safeSummary = data?.summary || {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
      setReviews(safeReviews);
      setSummary(safeSummary);
      onSummaryChange?.(safeSummary);
    } catch (err) {
      if (reqId !== reviewsReqIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      if (reqId === reviewsReqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [productId, onSummaryChange]);

  const loadEligibility = useCallback(async () => {
    const reqId = ++eligReqIdRef.current;
    if (!isAuthenticated) {
      setEligibility(null);
      return;
    }

    try {
      const elig = await checkReviewEligibility(productId);
      if (reqId !== eligReqIdRef.current) return;
      setEligibility(elig);
    } catch {
      if (reqId !== eligReqIdRef.current) return;
      // Graceful fallback for eligibility query failure
      setEligibility(null);
    }
  }, [productId, isAuthenticated]);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  useEffect(() => {
    loadEligibility();
  }, [loadEligibility]);

  const handleCreateSubmit = async (data: {
    rating: number;
    title: string | null;
    body: string;
  }) => {
    const input: CreateReviewInput = {
      productId,
      rating: data.rating,
      title: data.title,
      body: data.body,
    };

    await createReview(input);
    setActionFeedback({
      type: 'success',
      title: 'Your review has been submitted successfully and is awaiting admin moderation.',
      description: 'Your review will appear publicly on the artwork page once it is approved.',
    });
    setFormMode('closed');
    setIsConfirmingDelete(false);
    await Promise.all([loadReviewsData(), loadEligibility()]);
  };

  const handleUpdateSubmit = async (data: {
    rating: number;
    title: string | null;
    body: string;
  }) => {
    if (!editingReview) return;

    const input: UpdateReviewInput = {
      rating: data.rating,
      title: data.title,
      body: data.body,
    };

    await updateReview(editingReview.id, input);
    let description = 'Your updated feedback is now visible on the artwork page.';
    if (editingReview.status === 'PENDING') {
      description = 'Your review remains awaiting admin moderation before public display.';
    } else if (editingReview.status === 'REJECTED') {
      description = 'Your review was not approved during moderation and is not publicly visible.';
    }

    setActionFeedback({
      type: 'success',
      title: 'Your review has been successfully updated.',
      description,
    });
    setFormMode('closed');
    setEditingReview(null);
    setIsConfirmingDelete(false);
    await Promise.all([loadReviewsData(), loadEligibility()]);
  };

  const handleDeleteReview = async (reviewId: string) => {
    setIsDeletingAuthorReview(true);
    try {
      await deleteReview(reviewId);
      setActionFeedback({
        type: 'success',
        title: 'Your review has been removed.',
      });
      setIsConfirmingDelete(false);
      if (formMode !== 'closed') {
        setFormMode('closed');
        setEditingReview(null);
      }
      await Promise.all([loadReviewsData(), loadEligibility()]);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        title: 'Unable to remove review.',
        description: err instanceof Error ? err.message : 'Please try again later.',
      });
      setIsConfirmingDelete(false);
    } finally {
      setIsDeletingAuthorReview(false);
    }
  };

  const handleStartEdit = (review: ReviewDto) => {
    setEditingReview(review);
    setFormMode('edit');
    setActionFeedback(null);
    setIsConfirmingDelete(false);
  };

  const renderAuthorStatusBadge = (status: ReviewStatusType): ReactNode => {
    switch (status) {
      case 'PENDING':
        return (
          <span
            data-testid="author-review-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
          >
            <svg
              className="w-3.5 h-3.5 text-amber-600 shrink-0"
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
      case 'APPROVED':
        return (
          <span
            data-testid="author-review-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
          >
            <svg
              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
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
          <span
            data-testid="author-review-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
          >
            <svg
              className="w-3.5 h-3.5 text-rose-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Not Approved</span>
          </span>
        );
    }
  };

  return (
    <section id="reviews" className={`space-y-8 ${className}`} aria-label="Customer Reviews">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-art-stone pb-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-art-charcoal">
            Customer Reviews & Ratings
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Verified reflections from art collectors across India
          </p>
        </div>

        {/* Top Write Review Button (when eligible & closed) */}
        {isAuthenticated &&
          eligibility?.isEligible &&
          !eligibility.hasReviewed &&
          formMode === 'closed' && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setFormMode('create');
                setActionFeedback(null);
                setIsConfirmingDelete(false);
              }}
            >
              Write a Review
            </Button>
          )}
      </div>

      {/* Notification Alert (Success or Error) */}
      {actionFeedback && (
        <div
          role={actionFeedback.type === 'error' ? 'alert' : 'status'}
          aria-live={actionFeedback.type === 'error' ? 'assertive' : 'polite'}
          className={`rounded-xl p-4 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-sm animate-in fade-in ${
            actionFeedback.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-900'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {actionFeedback.type === 'error' ? (
              <svg
                className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"
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
            ) : (
              <svg
                className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
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
            )}
            <div className="space-y-1">
              <p
                className={`font-semibold ${
                  actionFeedback.type === 'error' ? 'text-rose-900' : 'text-emerald-900'
                }`}
              >
                {actionFeedback.title}
              </p>
              {actionFeedback.description && (
                <p
                  className={`text-xs leading-relaxed ${
                    actionFeedback.type === 'error' ? 'text-rose-800' : 'text-emerald-800'
                  }`}
                >
                  {actionFeedback.description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className={`text-xs font-bold p-1 rounded focus:outline-none shrink-0 ${
              actionFeedback.type === 'error'
                ? 'text-rose-700 hover:text-rose-900 focus-visible:ring-1 focus-visible:ring-rose-500'
                : 'text-emerald-700 hover:text-emerald-900 focus-visible:ring-1 focus-visible:ring-emerald-500'
            }`}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-12">
          <LoadingState message="Loading artwork reviews..." />
        </div>
      )}

      {error && !isLoading && (
        <div className="py-6">
          <ErrorState title="Unable to load reviews" message={error} onRetry={loadReviewsData} />
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Rating Summary Breakdown */}
          <RatingSummary summary={summary} />

          {/* Review Action Prompt / Form Box */}
          <div className="space-y-4">
            {formMode === 'create' && (
              <ReviewForm
                productId={productId}
                productName={productName}
                onSubmit={handleCreateSubmit}
                onCancel={() => setFormMode('closed')}
              />
            )}

            {formMode === 'edit' && (
              <ReviewForm
                productId={productId}
                productName={productName}
                initialReview={editingReview}
                onSubmit={handleUpdateSubmit}
                onCancel={() => {
                  setFormMode('closed');
                  setEditingReview(null);
                }}
              />
            )}

            {/* Eligibility Banners & Author Review Panel when form is closed */}
            {formMode === 'closed' && (
              <div className="rounded-xl border border-art-stone/60 bg-stone-50/70 p-4">
                {!isAuthenticated ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                    <p className="text-stone-700">
                      Have you collected this artwork? Sign in to share your impressions.
                    </p>
                    <Link
                      to={`/login?redirect=/products/${productSlug}`}
                      className="inline-flex items-center justify-center font-semibold text-art-ochre hover:text-art-terracotta transition-colors"
                    >
                      Sign In to Review →
                    </Link>
                  </div>
                ) : eligibility ? (
                  eligibility.isEligible ? (
                    eligibility.hasReviewed && eligibility.existingReview ? (
                      <div data-testid="author-review-panel" className="space-y-3">
                        {/* Header: Title, Status Badge, Edit/Delete Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-art-stone/60 pb-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h4 className="font-serif text-sm sm:text-base font-bold text-art-charcoal">
                              Your Review
                            </h4>
                            {renderAuthorStatusBadge(eligibility.existingReview.status)}
                          </div>

                          <div className="flex items-center gap-2">
                            {!isConfirmingDelete ? (
                              <>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleStartEdit(eligibility.existingReview!)}
                                >
                                  Edit Your Review
                                </Button>
                                <button
                                  type="button"
                                  data-testid="author-delete-button"
                                  onClick={() => setIsConfirmingDelete(true)}
                                  className="text-xs font-semibold text-stone-500 hover:text-red-600 transition-colors p-1"
                                  aria-label="Delete author review"
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 p-1.5 rounded-lg text-xs">
                                <span className="text-red-700 font-medium text-[11px]">
                                  Delete review?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(eligibility.existingReview!.id)}
                                  disabled={isDeletingAuthorReview}
                                  className="text-xs font-bold text-red-700 hover:underline px-1 disabled:opacity-50"
                                >
                                  {isDeletingAuthorReview ? 'Deleting...' : 'Yes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsConfirmingDelete(false)}
                                  disabled={isDeletingAuthorReview}
                                  className="text-xs font-medium text-stone-600 hover:underline px-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status explanation notice */}
                        {eligibility.existingReview.status === 'PENDING' && (
                          <div
                            data-testid="author-status-pending-notice"
                            className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900"
                          >
                            <svg
                              className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
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
                            <div className="space-y-0.5">
                              <p className="font-semibold">Awaiting Admin Moderation</p>
                              <p className="text-amber-800 leading-relaxed">
                                Your review is awaiting admin moderation and is not yet publicly
                                visible. It will appear on the artwork page once approved.
                              </p>
                            </div>
                          </div>
                        )}

                        {eligibility.existingReview.status === 'APPROVED' && (
                          <div
                            data-testid="author-status-approved-notice"
                            className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-900"
                          >
                            <svg
                              className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
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
                            <div className="space-y-0.5">
                              <p className="font-semibold">Approved & Publicly Visible</p>
                              <p className="text-emerald-800 leading-relaxed">
                                You have reviewed this artwork. Your review is approved and
                                published below. You can update or remove your feedback at any time.
                              </p>
                            </div>
                          </div>
                        )}

                        {eligibility.existingReview.status === 'REJECTED' && (
                          <div
                            data-testid="author-status-rejected-notice"
                            className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/80 border border-rose-200/80 text-xs text-rose-900"
                          >
                            <svg
                              className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
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
                            <div className="space-y-0.5">
                              <p className="font-semibold">Not Approved</p>
                              <p className="text-rose-800 leading-relaxed">
                                This review was not approved during moderation and is not publicly
                                visible. You can edit your review to revise your thoughts or delete
                                it.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Author Review Preview for PENDING or REJECTED reviews (since they are not in the public list below) */}
                        {eligibility.existingReview.status !== 'APPROVED' && (
                          <div className="bg-white/80 rounded-xl p-3.5 border border-stone-200 text-xs space-y-2">
                            <div className="flex items-center gap-2">
                              <StarRating rating={eligibility.existingReview.rating} size="sm" />
                              <span className="font-bold text-art-charcoal text-xs">
                                {eligibility.existingReview.rating} of 5 stars
                              </span>
                            </div>
                            {eligibility.existingReview.title && (
                              <h5 className="font-serif font-bold text-art-charcoal text-xs sm:text-sm">
                                {eligibility.existingReview.title}
                              </h5>
                            )}
                            {eligibility.existingReview.body && (
                              <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                                {eligibility.existingReview.body}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                        <p className="text-stone-700">
                          Verified purchase confirmed! We would love to hear your feedback on this
                          piece.
                        </p>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setFormMode('create');
                            setActionFeedback(null);
                            setIsConfirmingDelete(false);
                          }}
                        >
                          Write a Review
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-stone-600">
                      <svg
                        className="w-4 h-4 text-stone-400 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        Verified Purchase Only: To ensure authentic artwork impressions, only
                        collectors who have ordered this piece can submit a review.
                      </span>
                    </div>
                  )
                ) : null}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="space-y-4 pt-2">
            <h3 className="font-serif text-base font-bold text-art-charcoal">
              All Customer Reviews ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-art-stone p-8 text-center bg-white/60">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-art-ochre/10 text-art-ochre mb-3">
                  ★
                </div>
                <h4 className="font-serif text-base font-bold text-art-charcoal">No Reviews Yet</h4>
                <p className="text-xs text-stone-600 max-w-sm mx-auto mt-1">
                  Be the first collector to review this handcrafted creation and help other art
                  enthusiasts.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={user?.id}
                    onEdit={handleStartEdit}
                    onDelete={handleDeleteReview}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
