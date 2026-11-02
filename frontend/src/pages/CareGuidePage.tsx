import type { ReactNode } from 'react';
import { Container, Badge } from '@/components/ui';
import { APP_NAME } from '@/constants';

export function CareGuidePage(): ReactNode {
  return (
    <div className="bg-art-stone/20 dark:bg-art-midnight min-h-screen py-12 sm:py-16 transition-colors duration-200">
      <Container size="7xl">
        <div className="max-w-4xl mx-auto bg-white dark:bg-art-darkcard rounded-2xl border border-art-stone/60 dark:border-art-darkborder shadow-sm p-6 sm:p-12">
          {/* Header */}
          <div className="border-b border-art-stone/40 dark:border-art-darkborder pb-8 mb-8">
            <Badge variant="stone">Archival Preservation</Badge>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-art-charcoal dark:text-stone-100 mt-3">
              Artisan Care & Preservation Guide
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Essential instructions to ensure your handcrafted mandalas and Lippan Kaam mirrors
              from {APP_NAME} remain pristine for generations.
            </p>
          </div>

          {/* Guide sections */}
          <div className="space-y-10 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {/* 1. Lippan Kaam Art */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-art-ochre/20 text-art-charcoal dark:text-stone-100 font-serif font-bold text-sm">
                  1
                </span>
                <h2 className="font-serif text-2xl font-bold text-art-charcoal dark:text-stone-100">
                  Caring for Lippan Kaam (Mud-Relief & Mirror Art)
                </h2>
              </div>
              <p>
                Lippan Kaam is an ancient Gujarati folk craft traditionally made with organic clay,
                camel dung adhesive substitutes, and convex glass mirrors (aabhla). Modern
                handcrafted Lippan art uses refined chalk-clay compounds on sturdy wood panels,
                creating lasting architectural beauty.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                  <h3 className="font-semibold text-emerald-900 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <span className="text-emerald-700">✓</span> Recommended Practices
                  </h3>
                  <ul className="space-y-2 text-xs text-emerald-950">
                    <li>
                      • <strong>Dry Dusting:</strong> Use a super-soft, dry microfiber cloth or a
                      soft cosmetic brush to gently brush dust away from clay ridges.
                    </li>
                    <li>
                      • <strong>Cleaning Mirrors:</strong> If mirrors get smudged, lightly touch the
                      glass with a dry cotton swab to restore sparkle.
                    </li>
                    <li>
                      • <strong>Indoor Display:</strong> Always display indoors in well-ventilated
                      rooms with stable ambient humidity.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/60">
                  <h3 className="font-semibold text-rose-900 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <span className="text-rose-700">✕</span> What to Avoid
                  </h3>
                  <ul className="space-y-2 text-xs text-rose-950">
                    <li>
                      • <strong>NEVER Use Water or Sprays:</strong> Do not spray Colin, glass
                      cleaners, or water. Liquid seeps into clay relief and causes softening or
                      discoloration.
                    </li>
                    <li>
                      • <strong>No Abrasive Scrubbers:</strong> Avoid stiff sponges, scrub pads, or
                      rough paper towels that can scratch mirror coatings.
                    </li>
                    <li>
                      • <strong>Avoid High Moisture:</strong> Do not hang directly inside bathrooms
                      or damp outdoor patios.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Sacred Mandala Paintings */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-art-terracotta/20 text-art-charcoal dark:text-stone-100 font-serif font-bold text-sm">
                  2
                </span>
                <h2 className="font-serif text-2xl font-bold text-art-charcoal dark:text-stone-100">
                  Preserving Sacred Mandala Paintings & Canvas Panels
                </h2>
              </div>
              <p>
                Our mandalas feature intricate geometric line work, metallic acrylics, and 24k-style
                gold leafing finished with archival protective varnishes.
              </p>

              <div className="space-y-3 bg-stone-50 dark:bg-art-midnight/60 p-5 rounded-xl border border-stone-200 dark:border-art-darkborder">
                <ul className="space-y-2.5 text-xs text-stone-800 dark:text-stone-200">
                  <li>
                    <strong>Sunlight Protection:</strong> Avoid hanging mandalas in paths of
                    intense, direct, prolonged afternoon sunlight. UV rays can fade vibrant pigments
                    over many years.
                  </li>
                  <li>
                    <strong>Temperature & Humidity:</strong> Maintain stable indoor conditions.
                    Extreme dry heat or excessive dampness can cause wood panels or stretched canvas
                    to expand and contract.
                  </li>
                  <li>
                    <strong>Surface Cleaning:</strong> Gently wipe canvas surfaces with a feather
                    duster or dry microfiber duster every few weeks. Never use wet wipes or
                    alcohol-based cleaners.
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. Hanging & Installation Guidelines */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-art-stone dark:bg-art-darkstone text-art-charcoal dark:text-stone-100 font-serif font-bold text-sm">
                  3
                </span>
                <h2 className="font-serif text-2xl font-bold text-art-charcoal dark:text-stone-100">
                  Safe Hanging & Wall Installation
                </h2>
              </div>
              <p>
                Due to the solid wood substrates and authentic clay composition, handcrafted Lippan
                art panels carry substantial weight compared to commercial paper posters:
              </p>
              <div className="bg-art-stone/30 dark:bg-art-midnight/60 p-5 rounded-xl border border-art-stone/60 dark:border-art-darkborder space-y-2">
                <p className="font-semibold text-xs text-stone-900">Installation Checklist:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-700">
                  <li>
                    Use heavy-duty wall anchors, metal picture hooks, or masonry wall screws
                    suitable for 2 to 5 kg loads.
                  </li>
                  <li>
                    Ensure the mounting bracket on the back of the artwork rests squarely in the
                    center of the wall anchor.
                  </li>
                  <li>
                    We recommend affixing small silicone or felt bumpers to bottom corners to allow
                    gentle airflow between the artwork and the wall surface.
                  </li>
                </ul>
              </div>
            </section>

            {/* Help & Support */}
            <div className="border-t border-art-stone/40 pt-6 text-center">
              <p className="text-xs text-stone-500">
                Have questions about caring for a specific commission or custom piece? Contact the
                artisans at{' '}
                <a
                  href="mailto:support@mandalaartstore.com"
                  className="text-art-terracotta hover:underline font-medium"
                >
                  support@mandalaartstore.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
