import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ProductImageDto } from '@/types';

export interface ProductImageGalleryProps {
  images: ProductImageDto[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps): ReactNode {
  // Sort images by displayOrder, prioritizing isPrimary
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.displayOrder - b.displayOrder;
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const activeImage = sortedImages[selectedIndex];
  const hasMultipleImages = sortedImages.length > 1;

  const handlePrevImage = useCallback(() => {
    setSelectedIndex(prev => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  }, [sortedImages.length]);

  const handleNextImage = useCallback(() => {
    setSelectedIndex(prev => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  }, [sortedImages.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft' && hasMultipleImages) {
        handlePrevImage();
      } else if (e.key === 'ArrowRight' && hasMultipleImages) {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen, hasMultipleImages, handlePrevImage, handleNextImage]);

  return (
    <div className="space-y-4">
      {/* 1. Main Display Area */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-art-stone bg-stone-100 shadow-sm">
        {activeImage?.url && !imageError[selectedIndex] ? (
          <>
            <img
              src={activeImage.url}
              alt={activeImage.altText || `${productName} - Image ${selectedIndex + 1}`}
              onError={() => setImageError(prev => ({ ...prev, [selectedIndex]: true }))}
              className="h-full w-full object-cover object-center cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]"
              onClick={() => setIsLightboxOpen(true)}
              tabIndex={0}
              role="button"
              aria-label={`View enlarged ${productName} image`}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsLightboxOpen(true);
                }
              }}
            />

            {/* Expand / Lightbox Trigger Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-art-charcoal shadow-md backdrop-blur-sm transition-colors hover:bg-white min-h-[44px] min-w-[44px] justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
              aria-label="Open fullscreen image viewer"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
              <span className="hidden sm:inline">Zoom</span>
            </button>
          </>
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-art-cream"
            aria-label="Image placeholder"
          >
            <div className="relative mb-3 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-art-ochre/30" />
              <div className="absolute inset-2 rounded-full border border-dashed border-art-terracotta/40" />
              <span className="font-serif text-2xl font-bold text-art-charcoal">ॐ</span>
            </div>
            <p className="font-serif text-sm font-semibold text-art-charcoal">{productName}</p>
            <span className="text-xs text-stone-500 mt-1">Artisan Original</span>
          </div>
        )}

        {/* Overlay Navigation Arrows on Main Image */}
        {hasMultipleImages && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between p-2 pointer-events-none">
            <button
              type="button"
              onClick={handlePrevImage}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-art-charcoal shadow-md backdrop-blur-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
              aria-label="Previous image"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-art-charcoal shadow-md backdrop-blur-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
              aria-label="Next image"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 2. Thumbnails Row */}
      {hasMultipleImages && (
        <div
          className="flex items-center gap-3 overflow-x-auto pb-1"
          role="region"
          aria-label="Image gallery thumbnails"
        >
          {sortedImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-square w-16 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre ${
                  isSelected
                    ? 'border-art-ochre ring-2 ring-art-ochre/20 shadow-sm'
                    : 'border-transparent opacity-70 hover:opacity-100 hover:border-art-stone'
                }`}
                aria-label={`View image ${idx + 1} of ${sortedImages.length}`}
                aria-current={isSelected ? 'true' : undefined}
              >
                <img
                  src={img.url}
                  alt={img.altText || `${productName} thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Accessible Lightbox Modal */}
      {isLightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-art-charcoal/90 p-4 sm:p-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Artwork Image Viewer"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Modal Content Container */}
          <div
            className="relative max-h-[90vh] max-w-5xl flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Toolbar: Counter & Close */}
            <div className="flex w-full items-center justify-between pb-3 text-white">
              <span className="text-xs font-semibold tracking-wider text-art-sand">
                Image {selectedIndex + 1} of {sortedImages.length}
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 min-h-[44px] min-w-[44px] justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
                aria-label="Close image viewer"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-xs">Close</span>
              </button>
            </div>

            {/* Lightbox Main Image */}
            <div className="relative overflow-hidden rounded-2xl bg-black/40 shadow-2xl">
              <img
                src={activeImage.url}
                alt={activeImage.altText || `${productName} - Full image ${selectedIndex + 1}`}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl"
              />
            </div>

            {/* Caption */}
            {activeImage.altText && (
              <p className="mt-3 text-center text-xs text-stone-300 max-w-xl">
                {activeImage.altText}
              </p>
            )}

            {/* Lightbox Prev / Next Controls */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 sm:-left-14 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
                  aria-label="Previous image in lightbox"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 sm:-right-14 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
                  aria-label="Next image in lightbox"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
