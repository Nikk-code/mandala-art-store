import { useState, type ReactNode } from 'react';
import type { CategoryDto } from '@/types';

export interface CategoryCardProps {
  category: CategoryDto;
  className?: string;
  onClick?: () => void;
}

export function CategoryCard({ category, className = '', onClick }: CategoryCardProps): ReactNode {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-art-stone bg-white p-6 transition-all duration-200 hover:border-art-ochre hover:shadow-art ${className}`}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Category Icon / Thumbnail or Artistic Ornament */}
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-art-ochre/10 text-art-ochre border border-art-ochre/20 overflow-hidden">
          {category.imageUrl && !imageError ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <svg
              className="h-7 w-7 text-art-ochre"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
              />
            </svg>
          )}
        </div>

        <div>
          <h3 className="font-serif text-xl font-bold text-art-charcoal group-hover:text-art-ochre transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="mt-1 text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-art-stone/60 flex items-center justify-between text-xs font-semibold text-art-charcoal group-hover:text-art-ochre">
        <span>Explore Collection</span>
        <span aria-hidden="true">→</span>
      </div>
    </div>
  );
}
