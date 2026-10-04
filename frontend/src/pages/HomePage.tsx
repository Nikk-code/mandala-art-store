import type { ReactNode } from 'react';
import { Container, Section, Button, Badge } from '@/components/ui';
import { useHealthCheck } from '@/hooks/useHealthCheck';

export function HomePage(): ReactNode {
  const { data: health, isLoading: healthLoading, error: healthError, refetch } = useHealthCheck();

  return (
    <div className="space-y-0">
      {/* Editorial Hero Section */}
      <Section background="cream" spacing="xl" className="relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-art-sand/40 blur-3xl"
        />

        <Container size="7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2">
                <Badge variant="ochre">Sacred Geometry & Kutchi Lippan Craft</Badge>
                <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                  • 100% Handcrafted Originals
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-art-charcoal leading-[1.15]">
                Timeless art to bring{' '}
                <span className="italic text-art-ochre font-normal">serenity</span> and{' '}
                <span className="italic text-art-terracotta font-normal">harmony</span> into your
                home.
              </h1>

              <p className="text-base sm:text-lg text-stone-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Individually handcrafted Mandalas and traditional Lippan Kaam mirrors. Made using
                natural earthen clays, pure pigments, and mindful precision.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Explore Curated Collection
                </Button>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Discover The Craft Heritage
                </Button>
              </div>

              <div className="pt-6 border-t border-art-stone/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-stone-600 font-medium">
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-art-ochre" aria-hidden="true" />
                  <span>Museum-Grade Archival Finishes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-art-terracotta" aria-hidden="true" />
                  <span>Custom Dimension Commissions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-art-charcoal" aria-hidden="true" />
                  <span>Secure Pan-India Crating</span>
                </div>
              </div>
            </div>

            {/* Right Visual / Art Placeholder Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-3xl bg-art-stone/50 border border-art-stone p-6 flex flex-col items-center justify-center text-center shadow-art">
                {/* Decorative concentric geometric rings symbolizing a mandala */}
                <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 mb-6">
                  <div className="absolute inset-0 rounded-full border border-art-ochre/30 animate-spin-slow" />
                  <div className="absolute inset-4 rounded-full border border-dashed border-art-terracotta/40" />
                  <div className="absolute inset-10 rounded-full border border-art-charcoal/20" />
                  <div className="absolute inset-16 rounded-full bg-art-sand/60 flex items-center justify-center">
                    <span className="font-serif text-2xl font-bold text-art-charcoal">ॐ</span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-art-charcoal">
                  The Sacred Circle of Harmony
                </h3>
                <p className="mt-1 text-xs text-stone-600 max-w-xs">
                  Hand-painted with 000-fine natural brushes and mineral pigments on heavy wood
                  canvas.
                </p>
                <div className="mt-4">
                  <Badge variant="stone">Artisan Showcase Piece</Badge>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Artisanal Heritage Pillars Preview */}
      <Section background="white" spacing="lg">
        <Container size="7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-art-ochre">
              Tradition & Precision
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-art-charcoal mt-2">
              Every Piece Tells a Sacred Story
            </h2>
            <p className="mt-3 text-sm text-stone-600">
              Each creation embodies patience and meditational symmetry, honoring authentic Vedic
              and Kutchi artisanal lineage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-art-stone bg-art-cream/40 p-6 sm:p-8 space-y-4 hover:border-art-ochre/50 transition-colors duration-200">
              <div className="w-12 h-12 rounded-xl bg-art-ochre/15 text-art-ochre flex items-center justify-center font-serif text-xl font-bold">
                01
              </div>
              <h3 className="font-serif text-xl font-bold text-art-charcoal">
                Sacred Mandala Geometry
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Intricate circular patterns radiating from a single sacred center, engineered to
                foster calmness, mindfulness, and balance in your living or meditation space.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-art-stone bg-art-cream/40 p-6 sm:p-8 space-y-4 hover:border-art-terracotta/50 transition-colors duration-200">
              <div className="w-12 h-12 rounded-xl bg-art-terracotta/15 text-art-terracotta flex items-center justify-center font-serif text-xl font-bold">
                02
              </div>
              <h3 className="font-serif text-xl font-bold text-art-charcoal">
                Authentic Lippan Kaam
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Traditional Gujarat mud-relief work embedded with high-grade reflective mirrors
                (Aabhla) that catch ambient light and illuminate spaces with warmth.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-art-stone bg-art-cream/40 p-6 sm:p-8 space-y-4 hover:border-art-charcoal/50 transition-colors duration-200">
              <div className="w-12 h-12 rounded-xl bg-art-charcoal/10 text-art-charcoal flex items-center justify-center font-serif text-xl font-bold">
                03
              </div>
              <h3 className="font-serif text-xl font-bold text-art-charcoal">
                Made-To-Order Commissions
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Custom palettes, bespoke spiritual motifs, and personalized dimensions crafted
                specifically for your architectural spaces and spiritual intentions.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Technical Environment & Diagnostic Bar */}
      <Section background="stone" spacing="sm">
        <Container size="7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 text-xs text-stone-600">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-stone-700">Platform Foundation:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-art-stone text-art-charcoal font-semibold">
                Step 7 App Shell
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-art-stone text-art-charcoal font-semibold">
                Tailwind Design Tokens
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {healthLoading && <span className="text-stone-500">Checking API connection...</span>}
              {healthError && (
                <span className="text-art-terracotta font-medium">API: Standalone Mode</span>
              )}
              {health && (
                <span className="text-emerald-700 font-medium">
                  API Connected ({health.environment})
                </span>
              )}
              <button
                type="button"
                onClick={refetch}
                className="underline hover:text-art-charcoal text-stone-500 text-xs"
              >
                Refresh
              </button>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
