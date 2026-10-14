import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type {
  ReviewDto,
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
import { Button, LoadingState, ErrorState } from '@/components/ui';

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
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadReviewsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchProductReviews(productId);
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
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [productId, onSummaryChange]);

  const loadEligibility = useCallback(async () => {
    if (!isAuthenticated) {
      setEligibility(null);
      return;
    }

    try {
      const elig = await checkReviewEligibility(productId);
      setEligibility(elig);
    } catch {
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
    setActionSuccessMessage('Your review has been successfully published!');
    setFormMode('closed');
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
    setActionSuccessMessage('Your review has been successfully updated!');
    setFormMode('closed');
    setEditingReview(null);
    await Promise.all([loadReviewsData(), loadEligibility()]);
  };

  const handleDeleteReview = async (reviewId: string) => {
    await deleteReview(reviewId);
    setActionSuccessMessage('Your review has been removed.');
    if (formMode !== 'closed') {
      setFormMode('closed');
      setEditingReview(null);
    }
    await Promise.all([loadReviewsData(), loadEligibility()]);
  };

  const handleStartEdit = (review: ReviewDto) => {
    setEditingReview(review);
    setFormMode('edit');
    setActionSuccessMessage(null);
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
                setActionSuccessMessage(null);
              }}
            >
              Write a Review
            </Button>
          )}
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-800 font-medium flex items-center justify-between"
        >
          <span>{actionSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
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

            {/* Eligibility Banners when form is closed */}
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                        <p className="text-stone-700">
                          You have reviewed this artwork. You can update or remove your feedback at
                          any time.
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartEdit(eligibility.existingReview!)}
                        >
                          Edit Your Review
                        </Button>
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
                            setActionSuccessMessage(null);
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
