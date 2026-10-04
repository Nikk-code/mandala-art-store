import type { ReactNode } from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}: EmptyStateProps): ReactNode {
  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto ${className}`}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 text-stone-500 mb-4 border border-art-stone">
        {icon || (
          <svg
            className="w-8 h-8 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>
      <h3 className="font-serif text-xl font-bold text-art-charcoal mb-2">{title}</h3>
      {description && <p className="text-sm text-stone-600 mb-6 leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
