import { useState, type FormEvent, type ReactNode } from 'react';
import type { ReviewDto } from '@/types';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui';

export interface ReviewFormProps {
  productId: string;
  productName: string;
  initialReview?: ReviewDto | null;
  onSubmit: (data: { rating: number; title: string | null; body: string }) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({
  productId: _productId,
  productName,
  initialReview,
  onSubmit,
  onCancel,
  className = '',
}: ReviewFormProps): ReactNode {
  const isEditing = Boolean(initialReview);

  const [rating, setRating] = useState<number>(initialReview?.rating || 5);
  const [title, setTitle] = useState<string>(initialReview?.title || '');
  const [body, setBody] = useState<string>(initialReview?.body || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (rating < 1 || rating > 5) {
      setFormError('Please select a star rating between 1 and 5.');
      return;
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setFormError('Please provide your review thoughts for this artwork.');
      return;
    }

    if (trimmedBody.length < 5) {
      setFormError('Review text must be at least 5 characters long.');
      return;
    }

    if (trimmedBody.length > 2000) {
      setFormError('Review text cannot exceed 2000 characters.');
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 200) {
      setFormError('Review headline cannot exceed 200 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        title: trimmedTitle || null,
        body: trimmedBody,
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to submit your review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-art-ochre/30 bg-art-cream/60 p-5 sm:p-6 shadow-sm space-y-4 ${className}`}
      aria-label={isEditing ? 'Edit your review' : `Review ${productName}`}
    >
      <div className="flex items-center justify-between border-b border-art-stone/60 pb-3">
        <h3 className="font-serif text-base sm:text-lg font-bold text-art-charcoal">
          {isEditing ? 'Edit Your Artwork Review' : `Review “${productName}”`}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs text-stone-500 hover:text-art-charcoal p-1"
          >
            Cancel
          </button>
        )}
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium"
        >
          {formError}
        </div>
      )}

      {/* Star Rating Picker */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-art-charcoal">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <StarRating
            rating={rating}
            interactive={true}
            size="lg"
            onRatingChange={newRating => setRating(newRating)}
          />
          <span className="text-xs font-bold text-art-charcoal">{rating} of 5 stars</span>
        </div>
      </div>

      {/* Review Headline / Title */}
      <div className="space-y-1">
        <label htmlFor="review-title" className="block text-xs font-semibold text-art-charcoal">
          Review Headline <span className="text-stone-400 font-normal">(Optional)</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Exquisite craftsmanship, beautiful textures"
          maxLength={200}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-art-stone bg-white px-3.5 py-2 text-xs sm:text-sm text-art-charcoal placeholder-stone-400 focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre disabled:opacity-60"
        />
      </div>

      {/* Written Review Body */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="review-body" className="block text-xs font-semibold text-art-charcoal">
            Written Review <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] text-stone-400 font-medium">{body.length} / 2000</span>
        </div>
        <textarea
          id="review-body"
          rows={4}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your experience with the craftsmanship, colors, dimensions, and safe packaging..."
          maxLength={2000}
          disabled={isSubmitting}
          required
          className="w-full rounded-xl border border-art-stone bg-white p-3 text-xs sm:text-sm text-art-charcoal placeholder-stone-400 focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre disabled:opacity-60"
        />
      </div>

      {/* Form CTAs */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isEditing ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}
