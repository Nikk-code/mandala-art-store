import type { ReactNode } from 'react';
import { Container, Badge } from '@/components/ui';
import { APP_NAME } from '@/constants';

export function PrivacyPolicyPage(): ReactNode {
  return (
    <div className="bg-art-stone/20 dark:bg-art-midnight min-h-screen py-12 sm:py-16 transition-colors duration-200">
      <Container size="7xl">
        <div className="max-w-4xl mx-auto bg-white dark:bg-art-darkcard rounded-2xl border border-art-stone/60 dark:border-art-darkborder shadow-sm p-6 sm:p-12">
          {/* Header */}
          <div className="border-b border-art-stone/40 dark:border-art-darkborder pb-8 mb-8">
            <Badge variant="ochre">Data Privacy & Security</Badge>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-art-charcoal dark:text-stone-100 mt-3">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} •
              Effective for {APP_NAME}
            </p>
          </div>

          {/* Content sections */}
          <div className="space-y-8 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal dark:text-stone-100">
                1. Our Commitment to Your Privacy
              </h2>
              <p>
                At {APP_NAME}, we hold the sacred relationship between artisan and art patron in the
                highest regard. We are committed to safeguarding the personal information you share
                with us. This policy details how we collect, store, and protect your information
                when you browse our collections, register an account, or order handcrafted artworks
                through our storefront.
              </p>
              <p>
                We comply with all applicable Indian data privacy regulations, including the
                Information Technology Act, 2000 and the Digital Personal Data Protection (DPDP)
                Act, 2023.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal dark:text-stone-100">
                2. Information We Collect
              </h2>
              <p>
                We only collect personal information that is necessary to provide you with seamless
                service, verified order fulfillment, and secure account access:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-stone-900 dark:text-stone-100">
                    Contact & Identity Details:
                  </strong>{' '}
                  Full name, email address, and phone number provided during account registration or
                  checkout.
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-stone-100">
                    Delivery Information:
                  </strong>{' '}
                  Complete street address, apartment/suite number, city, state, postal code (PIN
                  code), and country for physical dispatch of artworks.
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-stone-100">
                    Order & Transaction History:
                  </strong>{' '}
                  Records of purchased artworks, dimensions, pricing, coupon discounts, order
                  timestamps, and delivery tracking milestones.
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-stone-100">Artisan Feedback:</strong>{' '}
                  Verified purchase reviews, star ratings, and testimonials submitted on our
                  artworks.
                </li>
              </ul>
            </section>

            <section className="space-y-3 bg-art-stone/30 dark:bg-art-midnight/60 p-5 rounded-xl border border-art-stone/60 dark:border-art-darkborder">
              <h2 className="font-serif text-xl font-bold text-art-charcoal dark:text-stone-100 flex items-center gap-2">
                <span>3. Payment Gateway Security (Razorpay)</span>
              </h2>
              <p>
                <strong>We NEVER collect, store, or view your payment instruments.</strong> We do
                not store credit card numbers, debit card details, CVV codes, net banking login
                credentials, or UPI PINs on any of our servers.
              </p>
              <p>
                All financial transactions are handled exclusively by <strong>Razorpay</strong>, an
                RBI-licensed, PCI-DSS Level 1 certified payment aggregator. When you pay, your data
                is processed through industry-standard 256-bit bank-grade SSL encryption directly
                between your device and the payment gateway.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal dark:text-stone-100">
                4. How We Use Your Information
              </h2>
              <p>Your information is used strictly for legitimate business purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  To safely pack, crate, and ship your delicate artworks using insured transit
                  partners.
                </li>
                <li>
                  To send electronic receipts, payment confirmations, and courier tracking updates.
                </li>
                <li>
                  To provide dedicated customer support regarding custom commissions or orders.
                </li>
                <li>
                  To prevent fraud, verify authentic purchase reviews, and safeguard inventory
                  reservations.
                </li>
              </ul>
              <p className="font-medium text-stone-900 dark:text-stone-100">
                We will never sell, rent, or trade your personal information to third-party
                advertisers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal dark:text-stone-100">
                5. Cookies & Session Storage
              </h2>
              <p>
                Our website utilizes secure, HttpOnly session cookies and encrypted local browser
                storage solely to remember your active shopping cart, maintain your authenticated
                patron session, and recover in-flight checkouts if your browser refreshes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl font-bold text-art-charcoal dark:text-stone-100">
                6. Your Rights & Contact Details
              </h2>
              <p>
                As a valued patron, you have the right to review, update, or request the deletion of
                your account and personal details at any time through your Account page or by
                contacting our team.
              </p>
              <div className="bg-stone-50 dark:bg-art-midnight/60 p-4 rounded-lg border border-stone-200 dark:border-art-darkborder mt-2">
                <p className="font-semibold text-art-charcoal dark:text-stone-100">
                  {APP_NAME} Privacy & Support
                </p>
                <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                  Email:{' '}
                  <a
                    href="mailto:support@mandalaartstore.com"
                    className="text-art-terracotta hover:underline"
                  >
                    support@mandalaartstore.com
                  </a>
                </p>
                <p className="text-stone-600 dark:text-stone-400">
                  Location: Pune, Maharashtra, India
                </p>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
