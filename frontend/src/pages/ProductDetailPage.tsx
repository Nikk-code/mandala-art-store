import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Section,
  Badge,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import { ProductImageGallery } from '@/components/catalog';
import { fetchProductBySlug } from '@/services';
import { formatPrice, formatWeight, getAvailabilityInfo } from '@/utils';
import { useCart } from '@/context';
import type { ProductDetailDto } from '@/types';

export function ProductDetailPage(): ReactNode {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);

  const loadProduct = useCallback(() => {
    if (!slug) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);

    fetchProductBySlug(slug)
      .then(data => {
        setProduct(data);
        setIsLoading(false);
      })
      .catch(err => {
        setIsLoading(false);
        if (
          (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 404) ||
          (err instanceof Error && err.message.toLowerCase().includes('not found'))
        ) {
          setIsNotFound(true);
        } else {
          setError(err instanceof Error ? err : new Error('Failed to load artwork'));
        }
      });
  }, [slug]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Set document title
  useEffect(() => {
    if (product?.name) {
      document.title = `${product.name} | Mandala Art Store`;
    } else {
      document.title = 'Mandala Art Store';
    }
  }, [product]);

  // 1. Loading State
  if (isLoading) {
    return (
      <Section background="cream" spacing="lg">
        <Container size="7xl">
          <div className="py-20">
            <LoadingState message="Curating artwork details..." />
          </div>
        </Container>
      </Section>
    );
  }

  // 2. Error State (Must check before !product)
  if (error) {
    return (
      <Section background="cream" spacing="lg">
        <Container size="7xl">
          <div className="py-16">
            <ErrorState
              title="Unable to load artwork"
              message={error.message || 'Please check your connection and try again.'}
              onRetry={loadProduct}
            />
          </div>
        </Container>
      </Section>
    );
  }

  // 3. 404 Not Found State
  if (isNotFound || !product) {
    return (
      <Section background="cream" spacing="lg">
        <Container size="7xl">
          <div className="py-16">
            <EmptyState
              title="Artwork Not Found"
              description="The artwork you are looking for does not exist, may have been renamed, or has been archived."
              actionLabel="Explore All Artworks"
              onAction={() => navigate('/products')}
            />
          </div>
        </Container>
      </Section>
    );
  }

  const availability = getAvailabilityInfo(product.availability);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const formattedWeight = formatWeight(product.weightGrams);

  return (
    <div className="pb-20">
      {/* 1. Breadcrumbs Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-art-stone bg-white/70 backdrop-blur-sm sticky top-0 z-20"
      >
        <Container size="7xl">
          <ol className="flex items-center space-x-2 py-3.5 text-xs text-stone-500 overflow-x-auto whitespace-nowrap">
            <li>
              <Link
                to="/"
                className="hover:text-art-ochre transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-stone-300">
              /
            </li>
            <li>
              <Link
                to="/products"
                className="hover:text-art-ochre transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
              >
                Catalog
              </Link>
            </li>
            <li aria-hidden="true" className="text-stone-300">
              /
            </li>
            <li>
              <Link
                to={`/products?category=${product.category.slug}`}
                className="hover:text-art-ochre transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
              >
                {product.category.name}
              </Link>
            </li>
            <li aria-hidden="true" className="text-stone-300">
              /
            </li>
            <li
              aria-current="page"
              className="font-medium text-art-charcoal truncate max-w-xs sm:max-w-sm"
            >
              {product.name}
            </li>
          </ol>
        </Container>
      </nav>

      {/* 2. Main Product Details Area */}
      <Section background="cream" spacing="md">
        <Container size="7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Column: Image Gallery (7 cols on lg) */}
            <div className="lg:col-span-7">
              <ProductImageGallery images={product.images} productName={product.name} />
            </div>

            {/* Right Column: Product Info & Specifications (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Category & Handcrafted Tag */}
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={`/products?category=${product.category.slug}`}
                  className="text-xs font-semibold uppercase tracking-widest text-art-ochre hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
                >
                  {product.category.name}
                </Link>

                <div className="flex items-center gap-2">
                  {product.isFeatured && (
                    <Badge variant="ochre" className="text-[10px]">
                      Featured
                    </Badge>
                  )}
                  {product.isHandmade && (
                    <Badge variant="stone" className="text-[10px]">
                      Handcrafted Original
                    </Badge>
                  )}
                </div>
              </div>

              {/* Product Title */}
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-art-charcoal leading-tight">
                  {product.name}
                </h1>
                <p className="mt-1.5 text-xs text-stone-600">
                  Item SKU: <span className="font-mono">{product.sku}</span>
                </p>
              </div>

              {/* Price & Availability Banner */}
              <div className="rounded-2xl border border-art-stone bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline space-x-3">
                    <span className="font-serif text-3xl font-bold text-art-charcoal tracking-tight">
                      {formatPrice(product.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-base text-stone-600 line-through">
                        {formatPrice(product.compareAtPrice!)}
                      </span>
                    )}
                  </div>

                  <Badge variant={availability.badgeVariant} className="text-xs px-3 py-1">
                    {availability.label}
                  </Badge>
                </div>

                {/* Availability context note */}
                <p className="text-xs text-stone-600 leading-relaxed border-t border-art-stone/50 pt-3">
                  {product.availability === 'IN_STOCK' &&
                    '✓ Ready to dispatch in custom reinforced wooden art packaging.'}
                  {product.availability === 'MADE_TO_ORDER' &&
                    '✦ Individually crafted on demand by our master artisan. Estimated creation time: 7–14 days.'}
                  {product.availability === 'SOLD_OUT' &&
                    '✕ This unique artwork has found a patron. Browse other pieces from the artist.'}
                </p>

                {/* Real Add to Cart Action */}
                <div className="pt-2 space-y-2">
                  {product.availability === 'SOLD_OUT' ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full justify-center opacity-70 cursor-not-allowed"
                      disabled
                      aria-label="Artwork Sold Out"
                    >
                      Artwork Sold Out
                    </Button>
                  ) : addedToCart ? (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 py-3 text-xs sm:text-sm font-semibold text-emerald-800">
                        <svg
                          className="h-5 w-5 text-emerald-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Added to your cart!</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="md"
                          className="flex-1 justify-center"
                          onClick={() => {
                            const primaryImage =
                              product.images.find(img => img.isPrimary) || product.images[0];
                            addItem({
                              productId: product.id,
                              slug: product.slug,
                              name: product.name,
                              sku: product.sku,
                              price: product.price,
                              compareAtPrice: product.compareAtPrice,
                              availability: product.availability,
                              imageUrl: primaryImage?.url || null,
                              imageAlt: primaryImage?.altText || product.name,
                              categoryName: product.category.name,
                              categorySlug: product.category.slug,
                              dimensions: product.dimensions,
                              isHandmade: product.isHandmade,
                              quantity: 1,
                            });
                          }}
                        >
                          Add Another
                        </Button>
                        <Link
                          to="/cart"
                          className="flex-1 inline-flex items-center justify-center rounded-xl bg-art-charcoal px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
                        >
                          View Cart →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full justify-center"
                      onClick={() => {
                        const primaryImage =
                          product.images.find(img => img.isPrimary) || product.images[0];
                        const success = addItem({
                          productId: product.id,
                          slug: product.slug,
                          name: product.name,
                          sku: product.sku,
                          price: product.price,
                          compareAtPrice: product.compareAtPrice,
                          availability: product.availability,
                          imageUrl: primaryImage?.url || null,
                          imageAlt: primaryImage?.altText || product.name,
                          categoryName: product.category.name,
                          categorySlug: product.category.slug,
                          dimensions: product.dimensions,
                          isHandmade: product.isHandmade,
                          quantity: 1,
                        });
                        if (success) {
                          setAddedToCart(true);
                        }
                      }}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      {product.availability === 'MADE_TO_ORDER'
                        ? 'Add to Cart — Made to Order'
                        : 'Add to Cart'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <div className="rounded-xl bg-art-stone/30 p-4 text-xs sm:text-sm text-stone-700 leading-relaxed italic border border-art-stone/60">
                  &ldquo;{product.shortDescription}&rdquo;
                </div>
              )}

              {/* Specifications Card */}
              <div className="rounded-2xl border border-art-stone bg-white p-5 shadow-sm space-y-3">
                <h2 className="font-serif text-base font-bold text-art-charcoal border-b border-art-stone/60 pb-2">
                  Artwork Specifications
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  {product.dimensions && (
                    <div>
                      <dt className="text-stone-600 font-medium">Dimensions</dt>
                      <dd className="font-semibold text-art-charcoal mt-0.5">
                        {product.dimensions}
                      </dd>
                    </div>
                  )}

                  {product.material && (
                    <div>
                      <dt className="text-stone-600 font-medium">Material & Medium</dt>
                      <dd className="font-semibold text-art-charcoal mt-0.5">{product.material}</dd>
                    </div>
                  )}

                  {formattedWeight && (
                    <div>
                      <dt className="text-stone-600 font-medium">Weight</dt>
                      <dd className="font-semibold text-art-charcoal mt-0.5">{formattedWeight}</dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-stone-600 font-medium">Authenticity</dt>
                    <dd className="font-semibold text-art-charcoal mt-0.5">
                      {product.isHandmade ? '100% Handcrafted Original' : 'Art Print'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Detailed Description */}
              <div className="space-y-3 pt-2">
                <h2 className="font-serif text-lg font-bold text-art-charcoal">
                  Artisan Story & Details
                </h2>
                <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-line space-y-3">
                  {product.description}
                </div>
              </div>

              {/* Heritage & Quality Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-art-stone">
                <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-white/60 border border-art-stone/50">
                  <span className="text-art-ochre text-lg font-bold">✓</span>
                  <div>
                    <h3 className="text-xs font-bold text-art-charcoal">Folk Artistry</h3>
                    <p className="text-[11px] text-stone-600">Pure traditional craft</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-white/60 border border-art-stone/50">
                  <span className="text-art-ochre text-lg font-bold">📦</span>
                  <div>
                    <h3 className="text-xs font-bold text-art-charcoal">Wooden Crating</h3>
                    <p className="text-[11px] text-stone-600">Safe art packaging</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-white/60 border border-art-stone/50">
                  <span className="text-art-ochre text-lg font-bold">🛡️</span>
                  <div>
                    <h3 className="text-xs font-bold text-art-charcoal">Insured Transit</h3>
                    <p className="text-[11px] text-stone-600">Door-to-door delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
