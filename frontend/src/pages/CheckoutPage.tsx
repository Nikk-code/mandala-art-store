import { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Section, EmptyState, Badge } from '@/components/ui';
import {
  ContactInfoSection,
  ShippingAddressSection,
  CheckoutOrderSummary,
} from '@/components/checkout';
import { useCart } from '@/context';
import { validateCheckoutForm } from '@/utils';
import type { CheckoutFormData, CheckoutFormErrors } from '@/types';

export function CheckoutPage(): ReactNode {
  const { items, itemCount, subtotalPaise } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Checkout | Mandala Art Store';
  }, []);

  const handleFieldChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error on change if present
    if (errors[field as keyof CheckoutFormErrors]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field as keyof CheckoutFormErrors];
        return next;
      });
    }
  };

  const handleFormSubmit = () => {
    setIsSubmitting(true);
    const { isValid, errors: validationErrors } = validateCheckoutForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      setIsSubmitting(false);

      // Focus first erroneous field
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }
      return;
    }

    // Valid form -> transition to controlled review/payment readiness state
    setErrors({});
    setIsSubmitting(false);
    setIsReviewMode(true);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Fallback for test environments
      }
    }
  };

  return (
    <div className="pb-20">
      {/* 1. Breadcrumbs Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-art-stone bg-white/70 backdrop-blur-sm sticky top-0 z-20"
      >
        <Container size="7xl">
          <ol className="flex items-center space-x-2 py-3.5 text-xs text-stone-500">
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
                to="/cart"
                className="hover:text-art-ochre transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
              >
                Cart
              </Link>
            </li>
            <li aria-hidden="true" className="text-stone-300">
              /
            </li>
            <li aria-current="page" className="font-medium text-art-charcoal">
              Checkout
            </li>
          </ol>
        </Container>
      </nav>

      {/* 2. Main Checkout Area */}
      <Section background="cream" spacing="md">
        <Container size="7xl">
          <div className="py-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-art-ochre">
              Order Fulfillment
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-art-charcoal mt-1">
              {isReviewMode ? 'Review Order & Shipping' : 'Artwork Checkout'}
            </h1>
            <p className="mt-1.5 text-sm text-stone-600 max-w-2xl leading-relaxed">
              {isReviewMode
                ? 'Your contact and delivery destination are verified. Confirm details before proceeding to payment.'
                : 'Enter your shipping address and contact details for bespoke artisan delivery.'}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="py-16 rounded-2xl bg-white p-8 border border-art-stone mt-6">
              <EmptyState
                title="Your Cart is Empty"
                description="Your shopping cart has no artworks. Please browse our handcrafted collections to add items before checking out."
                actionLabel="Explore Our Art"
                onAction={() => navigate('/products')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-6">
              {/* Left Column: Form or Review Details (8 cols on lg) */}
              <div className="lg:col-span-8 space-y-6">
                {!isReviewMode ? (
                  <form
                    noValidate
                    onSubmit={e => {
                      e.preventDefault();
                      handleFormSubmit();
                    }}
                    className="space-y-6"
                  >
                    <ContactInfoSection
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                      disabled={isSubmitting}
                    />

                    <ShippingAddressSection
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                      disabled={isSubmitting}
                    />
                  </form>
                ) : (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Verified Customer & Shipping Card */}
                    <div className="rounded-2xl border border-art-stone bg-white p-6 shadow-sm space-y-5">
                      <div className="flex items-center justify-between border-b border-art-stone/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            ✓
                          </span>
                          <h2 className="font-serif text-lg font-bold text-art-charcoal">
                            Customer & Delivery Destination Verified
                          </h2>
                        </div>
                        <Badge variant="success" className="text-xs">
                          Ready for Payment
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-stone-700">
                        {/* Contact info snapshot */}
                        <div className="space-y-1 rounded-xl bg-stone-50 p-4 border border-art-stone/50">
                          <span className="text-[10px] uppercase font-bold text-art-ochre tracking-wider">
                            Recipient Contact
                          </span>
                          <p className="font-bold text-sm text-art-charcoal">{formData.fullName}</p>
                          <p className="text-stone-600">{formData.email}</p>
                          <p className="text-stone-600 font-mono">+91 {formData.phone}</p>
                        </div>

                        {/* Shipping address snapshot */}
                        <div className="space-y-1 rounded-xl bg-stone-50 p-4 border border-art-stone/50">
                          <span className="text-[10px] uppercase font-bold text-art-ochre tracking-wider">
                            Shipping Address (India)
                          </span>
                          <p className="font-medium text-art-charcoal">{formData.addressLine1}</p>
                          {formData.addressLine2 && (
                            <p className="text-stone-600">{formData.addressLine2}</p>
                          )}
                          <p className="text-stone-600">
                            {formData.city}, {formData.state} — {formData.postalCode}
                          </p>
                          <p className="text-stone-600 font-semibold">{formData.country}</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 12 Next Milestone Banner */}
                    <div className="rounded-2xl border border-art-ochre/40 bg-art-cream/80 p-6 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💳</span>
                        <div>
                          <h3 className="font-serif text-base font-bold text-art-charcoal">
                            Payment Gateway Integration (Coming in Step 12)
                          </h3>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            Checkout information has been validated according to Indian ecommerce
                            standards. The next step will integrate the backend order snapshot and
                            Razorpay payment capture with instant webhook verification.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary (4 cols on lg) */}
              <div className="lg:col-span-4 sticky top-20">
                <CheckoutOrderSummary
                  items={items}
                  itemCount={itemCount}
                  subtotalPaise={subtotalPaise}
                  isSubmitting={isSubmitting}
                  onSubmit={handleFormSubmit}
                  isReviewMode={isReviewMode}
                  onEditAddress={() => setIsReviewMode(false)}
                />
              </div>
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
export default CheckoutPage;
