import { useState, type ReactNode } from 'react';
import type { ReviewDto } from '@/types';
import { StarRating } from './StarRating';

export interface ReviewCardProps {
  review: ReviewDto;
  currentUserId?: string;
  onEdit?: (review: ReviewDto) => void;
  onDelete?: (reviewId: string) => Promise<void> | void;
  className?: string;
}

export function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
  className = '',
}: ReviewCardProps): ReactNode {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  const isOwner = Boolean(currentUserId && currentUserId === review.userId);

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(review.createdAt));

  const authorInitials =
    `${review.user.firstName?.[0] || ''}${review.user.lastName?.[0] || ''}`.toUpperCase() || 'P';

  const authorName = `${review.user.firstName} ${
    review.user.lastName ? `${review.user.lastName[0]}.` : ''
  }`;

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(review.id);
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <article
      className={`rounded-2xl border border-art-stone/80 bg-white p-5 shadow-sm space-y-3 transition-colors hover:border-art-ochre/40 ${className}`}
      aria-labelledby={`review-author-${review.id}`}
    >
      {/* Header: Author Avatar, Name, Verified Badge, Date */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar Initials */}
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-art-ochre/15 text-art-charcoal font-serif font-bold text-sm border border-art-ochre/30"
            aria-hidden="true"
          >
            {authorInitials}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                id={`review-author-${review.id}`}
                className="font-medium text-sm text-art-charcoal"
              >
                {authorName}
              </span>

              {review.isVerifiedPurchase && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                  title="Verified Customer Purchase"
                >
                  <svg className="w-3 h-3 text-emerald-600 fill-current" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Purchase
                </span>
              )}
            </div>

            <time
              dateTime={review.createdAt}
              className="text-[11px] text-stone-500 font-medium block mt-0.5"
            >
              {formattedDate}
            </time>
          </div>
        </div>

        {/* Owner Actions */}
        {isOwner && (
          <div className="flex items-center gap-2">
            {!showConfirmDelete ? (
              <>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(review)}
                    className="text-xs font-semibold text-stone-600 hover:text-art-ochre transition-colors p-1"
                    aria-label="Edit review"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="text-xs font-semibold text-stone-500 hover:text-red-600 transition-colors p-1"
                    aria-label="Delete review"
                  >
                    Delete
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 p-1.5 rounded-lg text-xs">
                <span className="text-red-700 font-medium text-[11px]">Delete review?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-xs font-bold text-red-700 hover:underline px-1 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={isDeleting}
                  className="text-xs font-medium text-stone-600 hover:underline px-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Star Rating & Title */}
      <div className="space-y-1">
        <StarRating rating={review.rating} size="sm" />
        {review.title && (
          <h4 className="font-serif font-bold text-sm text-art-charcoal pt-0.5">{review.title}</h4>
        )}
      </div>

      {/* Review Body */}
      {review.body && (
        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
          {review.body}
        </p>
      )}
    </article>
  );
}
