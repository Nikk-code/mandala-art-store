import { useState, useEffect, type ReactNode } from 'react';
import {
  Container,
  Section,
  Button,
  Badge,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { ProductCard, CategoryCard } from '@/components/catalog';
import { fetchCategories, fetchFeaturedProducts } from '@/services';
import type { CategoryDto, ProductListItemDto } from '@/types';

export function HomePage(): ReactNode {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [categoriesError, setCategoriesError] = useState<Error | null>(null);

  const [products, setProducts] = useState<ProductListItemDto[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<Error | null>(null);

  const loadCategories = (): void => {
    setIsLoadingCategories(true);
    setCategoriesError(null);
    fetchCategories()
      .then(data => {
        setCategories(data);
        setIsLoadingCategories(false);
      })
      .catch(err => {
        setCategoriesError(err instanceof Error ? err : new Error('Failed to load categories'));
        setIsLoadingCategories(false);
      });
  };

  const loadProducts = (): void => {
    setIsLoadingProducts(true);
    setProductsError(null);
    fetchFeaturedProducts(8)
      .then(data => {
        setProducts(data);
        setIsLoadingProducts(false);
      })
      .catch(err => {
        setProductsError(
          err instanceof Error ? err : new Error('Failed to load featured products')
        );
        setIsLoadingProducts(false);
      });
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  return (
    <div className="space-y-0">
      {/* 1. Editorial Hero Section */}
      <Section background="cream" spacing="xl" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-art-sand/40 blur-3xl"
        />

        <Container size="7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2">
                <Badge variant="ochre">Authentic Vedic & Kutchi Craftsmanship</Badge>
                <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                  • 100% Hand-Painted Originals
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-art-charcoal leading-[1.15]">
                Timeless sacred art to bring{' '}
                <span className="italic text-art-ochre font-normal">serenity</span> and{' '}
                <span className="italic text-art-terracotta font-normal">harmony</span> into your
                home.
              </h1>

              <p className="text-base sm:text-lg text-stone-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Individually handcrafted Mandalas and traditional Lippan Kaam mirror reliefs. Made
                using natural earthen clays, mineral pigments, and mindful meditative precision.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a href="#featured-collection" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Explore Curated Collection
                  </Button>
                </a>
                <a href="#artisan-heritage" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Discover The Craft Lineage
                  </Button>
                </a>
              </div>

              <div className="pt-6 border-t border-art-stone/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-stone-600 font-medium">
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-art-ochre" aria-hidden="true" />
                  <span>Museum-Grade Archival Materials</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-art-terracotta" aria-hidden="true" />
                  <span>Made to Order Dimensions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-art-charcoal" aria-hidden="true" />
                  <span>All-India Protective Transit</span>
                </div>
              </div>
            </div>

            {/* Right Visual Area */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-3xl bg-art-stone/50 border border-art-stone p-6 flex flex-col items-center justify-center text-center shadow-art">
                <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 mb-6">
                  <div className="absolute inset-0 rounded-full border border-art-ochre/30 animate-spin-slow" />
                  <div className="absolute inset-4 rounded-full border border-dashed border-art-terracotta/40" />
                  <div className="absolute inset-10 rounded-full border border-art-charcoal/20" />
                  <div className="absolute inset-16 rounded-full bg-art-sand/60 flex items-center justify-center">
                    <span className="font-serif text-2xl font-bold text-art-charcoal">ॐ</span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-art-charcoal">
                  Sacred Geometry Showcase
                </h3>
                <p className="mt-1 text-xs text-stone-600 max-w-xs">
                  Hand-painted with 000-fine natural brushes on solid reclaimed wood and organic mud
                  panels.
                </p>
                <div className="mt-4">
                  <Badge variant="stone">Direct from Indian Artisans</Badge>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 2. Artisanal Categories Section */}
      <Section background="white" spacing="lg">
        <Container size="7xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-art-ochre">
              Artisanal Lineage
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-art-charcoal mt-2">
              Explore by Craft Tradition
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Each discipline carries centuries of sacred heritage, meditational geometry, and
              architectural charm.
            </p>
          </div>

          {/* Categories Content / States */}
          {isLoadingCategories && <LoadingState message="Loading artisanal categories..." />}

          {categoriesError && (
            <ErrorState
              title="Unable to load collections"
              message="Could not connect to the catalog service. Please check your connection."
              onRetry={loadCategories}
            />
          )}

          {!isLoadingCategories && !categoriesError && categories.length === 0 && (
            <EmptyState
              title="No Categories Available"
              description="Our artisan collections are currently being refreshed."
            />
          )}

          {!isLoadingCategories && !categoriesError && categories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {categories.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* 3. Featured Products Section */}
      <Section id="featured-collection" background="stone" spacing="xl" className="scroll-mt-16">
        <Container size="7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-art-ochre">
                Curated Originals
              </span>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-art-charcoal mt-2">
                Featured Artworks
              </h2>
              <p className="mt-2 text-sm text-stone-600 max-w-xl">
                Authentic pieces currently available in stock or custom-crafted to order by our
                master painters.
              </p>
            </div>
            <div className="hidden sm:block">
              <Badge variant="outline">Showing Handcrafted Highlights</Badge>
            </div>
          </div>

          {/* Products Content / States */}
          {isLoadingProducts && <LoadingState message="Curating featured creations..." />}

          {productsError && (
            <ErrorState
              title="Unable to load artworks"
              message="Could not load the featured catalog. Please try refreshing."
              onRetry={loadProducts}
            />
          )}

          {!isLoadingProducts && !productsError && products.length === 0 && (
            <EmptyState
              title="No Featured Creations Found"
              description="New handcrafted originals are being finished in our studio."
            />
          )}

          {!isLoadingProducts && !productsError && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* 4. Value Proposition / Heritage Pillars */}
      <Section id="artisan-heritage" background="white" spacing="lg">
        <Container size="7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="p-6 rounded-2xl bg-art-cream/60 border border-art-stone space-y-3">
              <div className="w-10 h-10 rounded-xl bg-art-ochre/15 text-art-ochre flex items-center justify-center mx-auto md:mx-0">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-art-charcoal">
                100% Genuine Handcrafted
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Zero machine-printed posters. Every canvas and mirror panel is individually shaped,
                sculpted, and painted by dedicated Indian craftsmen.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-art-cream/60 border border-art-stone space-y-3">
              <div className="w-10 h-10 rounded-xl bg-art-terracotta/15 text-art-terracotta flex items-center justify-center mx-auto md:mx-0">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-art-charcoal">
                Reinforced Wooden Crating
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Delicate mud-relief and convex mirror inlays are encased in multi-layer shockproof
                packaging for safe transit anywhere in India.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-art-cream/60 border border-art-stone space-y-3">
              <div className="w-10 h-10 rounded-xl bg-art-charcoal/10 text-art-charcoal flex items-center justify-center mx-auto md:mx-0">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-art-charcoal">Fair Trade Lineage</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Direct economic benefit to traditional artisans, preserving rare generational craft
                techniques and spiritual symbolism.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
