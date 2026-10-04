import type { ReactNode } from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Unable to load content',
  message = 'An unexpected error occurred while loading. Please try again.',
  retryLabel = 'Try Again',
  onRetry,
  className = '',
}: ErrorStateProps): ReactNode {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto ${className}`}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-art-terracotta/10 text-art-terracotta mb-4 border border-art-terracotta/20">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="font-serif text-xl font-bold text-art-charcoal mb-2">{title}</h3>
      <p className="text-sm text-stone-600 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="terracotta" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
