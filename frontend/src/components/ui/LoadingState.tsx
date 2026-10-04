import type { ReactNode } from 'react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Loading artisanal collection...',
  className = '',
}: LoadingStateProps): ReactNode {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <div className="relative flex items-center justify-center mb-4">
        {/* Decorative subtle pulsing ring */}
        <div className="absolute h-12 w-12 rounded-full border border-art-ochre/30 animate-ping opacity-50" />
        {/* Inner rotating art spinner */}
        <svg
          className="h-10 w-10 animate-spin text-art-ochre"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-80"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-stone-600 tracking-wide">{message}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}
