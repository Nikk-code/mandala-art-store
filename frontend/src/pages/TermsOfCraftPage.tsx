import type { ReactNode } from 'react';
import { Container, Badge } from '@/components/ui';
import { APP_NAME } from '@/constants';

export function TermsOfCraftPage(): ReactNode {
  return (
    <div className="bg-art-stone/20 min-h-screen py-12 sm:py-16">
      <Container size="7xl">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-art-stone/60 shadow-sm p-6 sm:p-12">
          {/* Header */}
          <div className="border-b border-art-stone/40 pb-8 mb-8">
            <Badge variant="terracotta">Artisan Agreement</Badge>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-art-charcoal mt-3">
              Terms of Craft & Purchase
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Authentic handmade policies, transit safety, and patron guarantees for {APP_NAME}
            </p>
          </div>

          {/* Content sections */}
          <div className="space-y-8 text-sm text-stone-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal">
                1. Authenticity & The Nature of Handcrafted Art
              </h2>
              <p>
                Every sacred mandala, Lippan Kaam mud-and-mirror panel, and textured painting
                showcased on {APP_NAME} is an authentic, individually created masterpiece. Our
                artisans shape clay reliefs, position individual reflective mirrors, and paint
                intricate geometric lines entirely by hand.
              </p>
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/70 text-amber-900">
                <p className="font-semibold text-xs uppercase tracking-wider text-amber-800 mb-1">
                  Artisanal Variation Notice
                </p>
                <p className="text-xs leading-normal">
                  Because our creations are handmade rather than factory-molded, slight variations
                  in clay relief height, subtle mirror placements, and natural mineral pigment
                  gradients are natural characteristics of authentic craftsmanship. These subtle
                  differences celebrate the human touch and ensure your piece is truly
                  one-of-a-kind.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal">
                2. Pricing, Invoicing & Taxes
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  All prices listed in our catalog and checkout are in{' '}
                  <strong>Indian Rupees (INR ₹)</strong>.
                </li>
                <li>
                  All applicable Goods and Services Tax (GST) is clearly itemized or included in
                  catalog pricing.
                </li>
                <li>
                  When promotional coupons or discounts are applied, they are evaluated
                  authoritatively at checkout against our financial rules and inventory reservation
                  locks.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal">
                3. Order Reservation & Expiration Policy
              </h2>
              <p>
                When you proceed to checkout, our platform places an exclusive{' '}
                <strong>15-minute stock reservation</strong> on the chosen artwork to prevent anyone
                else from purchasing it while you complete your payment. If payment is not completed
                within 15 minutes, the reservation expires automatically and releases the artwork
                back to the public catalog so other patrons may acquire it.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal">
                4. Multi-Layer Protective Packaging & Transit
              </h2>
              <p>
                Artworks combining delicate mirrors, organic clay reliefs, and archival pigments
                require extraordinary care during shipment:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Every piece is wrapped in moisture-resistant vapor barrier sheets, padded with
                  custom high-density foam corner guards, and sealed in heavy-duty impact-absorbing
                  bubble crating.
                </li>
                <li>
                  Larger Lippan panels are framed with rigid reinforced backing for structural
                  integrity during transport.
                </li>
                <li>
                  Orders are typically prepared and dispatched within{' '}
                  <strong>2 to 4 business days</strong>. Transit across India generally takes{' '}
                  <strong>3 to 7 business days</strong> depending on destination.
                </li>
              </ul>
            </section>

            <section className="space-y-3 bg-art-stone/30 p-5 rounded-xl border border-art-stone/60">
              <h2 className="font-serif text-xl font-bold text-art-charcoal">
                5. Transit Damage, Replacements & Returns
              </h2>
              <p>
                We stand 100% behind the safe arrival of your artwork. In the rare event that an
                item is damaged during courier transit:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Unboxing Video Requirement:</strong> To ensure prompt insurance claim
                  processing with courier carriers, patrons are requested to record a continuous
                  unboxing video when opening the parcel package.
                </li>
                <li>
                  <strong>48-Hour Reporting:</strong> Notify us within <strong>48 hours</strong> of
                  package delivery by emailing{' '}
                  <a
                    href="mailto:support@mandalaartstore.com"
                    className="text-art-terracotta hover:underline font-medium"
                  >
                    support@mandalaartstore.com
                  </a>{' '}
                  with your order number and unboxing photos/video.
                </li>
                <li>
                  <strong>Resolution:</strong> Upon verification, we will arrange a complimentary
                  replacement, artisan restoration, or full financial refund according to your
                  preference.
                </li>
              </ol>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal">
                6. Intellectual Property & Artisan Rights
              </h2>
              <p>
                All sacred geometry patterns, proprietary Lippan compositions, product photography,
                and brand designs on {APP_NAME} are the exclusive artistic intellectual property of
                our artisans and studio. Unauthorized commercial reproduction, mold-making, or
                duplication is strictly prohibited.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
