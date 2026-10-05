import { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Section, EmptyState, Badge } from '@/components/ui';
import {
  ContactInfoSection,
  ShippingAddressSection,
  CheckoutOrderSummary,
} from '@/components/checkout';
import { useCart } from '@/context';
import { validateCheckoutForm, loadRazorpayScript } from '@/utils';
import { createCheckoutOrder, initializeCheckoutPayment } from '@/services';
import type { CheckoutFormData, CheckoutFormErrors, PaymentInitializationDto } from '@/types';

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
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentInitiated, setPaymentInitiated] = useState<PaymentInitializationDto | null>(null);

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

  const handlePaymentSubmit = async () => {
    if (items.length === 0) return;

    setIsSubmitting(true);
    setPaymentError(null);

    try {
      // 1. Create the authoritative backend ecommerce order
      const order = await createCheckoutOrder({
        customer: {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        shippingAddress: {
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2 ? formData.addressLine2.trim() : undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country,
        },
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      // 2. Initialize Razorpay Payment Order on backend
      const paymentInfo = await initializeCheckoutPayment(order.id);
      setPaymentInitiated(paymentInfo);

      // 3. Load Razorpay Checkout browser script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setIsSubmitting(false);
        return;
      }

      // 4. Open Razorpay Checkout Modal
      const rzp = new window.Razorpay({
        key: paymentInfo.razorpayKeyId,
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        name: 'Mandala Art Store',
        description: `Order ${paymentInfo.orderNumber}`,
        order_id: paymentInfo.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#B45309', // art-ochre
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
      });

      rzp.open();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to initiate payment. Please try again.';
      setPaymentError(message);
      setIsSubmitting(false);
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
                    {/* Error Banner */}
                    {paymentError && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-1"
                      >
                        <p className="font-bold">Payment Initialization Error</p>
                        <p>{paymentError}</p>
                      </div>
                    )}

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

                    {/* Payment Gateway Information */}
                    <div className="rounded-2xl border border-art-stone bg-white p-6 shadow-sm space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-art-cream text-art-ochre font-bold text-sm">
                          💳
                        </span>
                        <div>
                          <h3 className="font-serif text-sm font-bold text-art-charcoal">
                            Secure Razorpay Payment Gateway
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Supports UPI (Google Pay, PhonePe, Paytm), Net Banking, Credit/Debit
                            Cards, and Wallets.
                          </p>
                        </div>
                      </div>

                      {paymentInitiated && (
                        <div className="rounded-xl bg-stone-50 p-3.5 border border-art-stone/60 text-xs text-stone-600 space-y-1">
                          <p>
                            <span className="font-semibold text-art-charcoal">
                              Order Reference:
                            </span>{' '}
                            <span className="font-mono">{paymentInitiated.orderNumber}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-art-charcoal">
                              Razorpay Order ID:
                            </span>{' '}
                            <span className="font-mono">{paymentInitiated.razorpayOrderId}</span>
                          </p>
                        </div>
                      )}
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
                  onSubmit={isReviewMode ? handlePaymentSubmit : handleFormSubmit}
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
