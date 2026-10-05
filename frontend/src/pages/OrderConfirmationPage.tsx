import { useState, useEffect, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Section, Badge, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { fetchOrderById } from '@/services';
import { formatPrice } from '@/utils';
import type { OrderDetailsDto } from '@/types';

export function OrderConfirmationPage(): ReactNode {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetailsDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Order Confirmation | Mandala Art Store';
  }, []);

  const loadOrder = async (id: string) => {
    setLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      const data = await fetchOrderById(id);
      setOrder(data);
      if (data.orderNumber) {
        document.title = `Order #${data.orderNumber} | Mandala Art Store`;
      }
    } catch (err: unknown) {
      const is404 =
        (err as { statusCode?: number })?.statusCode === 404 ||
        (err instanceof Error && err.message.toLowerCase().includes('not found'));

      if (is404) {
        setIsNotFound(true);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load order details. Please try again later.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    } else {
      setIsNotFound(true);
      setLoading(false);
    }
  }, [orderId]);

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingState message="Retrieving your verified order details..." />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="py-20">
        <Container size="md">
          <div className="rounded-2xl border border-art-stone bg-white p-8 sm:p-12 text-center shadow-sm">
            <EmptyState
              title="Order Not Found"
              description="The requested order could not be located or does not belong to your customer account."
              actionLabel="Return to Order History"
              onAction={() => navigate('/orders')}
            />
          </div>
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-20">
        <Container size="md">
          <ErrorState
            title="Failed to Load Order"
            message={error || 'An unexpected error occurred.'}
            onRetry={() => orderId && loadOrder(orderId)}
          />
        </Container>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'CAPTURED';

  return (
    <div className="pb-24">
      {/* 1. Breadcrumbs */}
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
                to="/orders"
                className="hover:text-art-ochre transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
              >
                My Orders
              </Link>
            </li>
            <li aria-hidden="true" className="text-stone-300">
              /
            </li>
            <li aria-current="page" className="font-medium text-art-charcoal">
              Order {order.orderNumber}
            </li>
          </ol>
        </Container>
      </nav>

      {/* 2. Order Confirmation Header */}
      <Section background="cream" spacing="md">
        <Container size="7xl">
          <div className="rounded-2xl border border-art-stone bg-white p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-art-stone/60 pb-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-2xl font-bold">
                  ✓
                </span>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-art-ochre">
                    {isPaid ? 'Payment Verified & Confirmed' : 'Order Placed'}
                  </span>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-art-charcoal mt-1">
                    Order Reference #{order.orderNumber}
                  </h1>
                  <p className="text-xs text-stone-500 mt-1">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Badge
                  variant={order.status === 'CONFIRMED' ? 'success' : 'default'}
                  className="text-xs px-3 py-1 font-semibold"
                >
                  Order: {order.status}
                </Badge>
                <Badge
                  variant={order.paymentStatus === 'CAPTURED' ? 'success' : 'ochre'}
                  className="text-xs px-3 py-1 font-semibold"
                >
                  Payment: {order.paymentStatus}
                </Badge>
              </div>
            </div>

            {/* Success message banner */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-4 text-xs text-emerald-800 space-y-1">
              <p className="font-bold text-emerald-900">
                {isPaid
                  ? 'Your payment has been successfully captured and verified.'
                  : 'Your order has been recorded and is awaiting payment confirmation.'}
              </p>
              <p className="text-emerald-700 leading-relaxed">
                We have notified our master artisans to begin meticulous preparation and protective
                wooden crating for safe dispatch across India.
              </p>
            </div>

            {/* 3. Multi-column Order Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
              {/* Left Column: Purchased Artwork Line Items (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <h2 className="font-serif text-lg font-bold text-art-charcoal">
                  Ordered Artworks ({order.items.reduce((s, i) => s + i.quantity, 0)})
                </h2>

                <div className="divide-y divide-art-stone/60 rounded-2xl border border-art-stone bg-white shadow-sm overflow-hidden">
                  {order.items.map(item => (
                    <div key={item.id} className="p-4 sm:p-5 flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-art-cream border border-art-stone/80 text-xl font-serif text-art-ochre">
                        🎨
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-sm font-bold text-art-charcoal truncate">
                          {item.productName}
                        </h3>
                        <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                          SKU: {item.productSku}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-stone-600">
                            {formatPrice(item.unitPrice)} × {item.quantity}
                          </span>
                          <span className="font-bold text-art-charcoal">
                            {formatPrice(item.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Artisan Guarantee card */}
                <div className="rounded-xl bg-stone-50 border border-art-stone/60 p-4 text-xs text-stone-600 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-art-ochre">
                    Authentic Artisan Guarantee
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-art-ochre">✓</span> 100% Handcrafted
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-art-ochre">✓</span> Custom Wood Crating
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-art-ochre">✓</span> Insured Delivery
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Customer Info, Shipping & Financials (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Shipping & Contact Details */}
                <div className="rounded-2xl border border-art-stone bg-white p-5 shadow-sm space-y-4 text-xs text-stone-700">
                  <h3 className="font-serif text-sm font-bold text-art-charcoal border-b border-art-stone/60 pb-2">
                    Delivery Destination
                  </h3>
                  <div className="space-y-1">
                    <p className="font-bold text-art-charcoal">
                      {order.shippingAddress.recipientName}
                    </p>
                    <p className="text-stone-600">{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && (
                      <p className="text-stone-600">{order.shippingAddress.addressLine2}</p>
                    )}
                    <p className="text-stone-600">
                      {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                      {order.shippingAddress.postalCode}
                    </p>
                    <p className="text-stone-600 font-semibold">{order.shippingAddress.country}</p>
                  </div>

                  <div className="pt-2 border-t border-art-stone/40 space-y-1 text-stone-600">
                    <p>
                      <span className="text-stone-400">Email:</span> {order.customerEmail}
                    </p>
                    <p>
                      <span className="text-stone-400">Phone:</span> +91 {order.customerPhone}
                    </p>
                  </div>
                </div>

                {/* Financial Totals Breakdown */}
                <div className="rounded-2xl border border-art-stone bg-white p-5 shadow-sm space-y-3 text-xs">
                  <h3 className="font-serif text-sm font-bold text-art-charcoal border-b border-art-stone/60 pb-2">
                    Payment Summary
                  </h3>

                  <div className="space-y-2 text-stone-600">
                    <div className="flex justify-between">
                      <span>Artworks Subtotal:</span>
                      <span className="font-medium text-stone-900">
                        {formatPrice(order.subtotal)}
                      </span>
                    </div>

                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span>-{formatPrice(order.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Insured Artisan Shipping:</span>
                      <span className="text-emerald-700 font-medium">Free</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Applicable Taxes / GST:</span>
                      <span>Included</span>
                    </div>
                  </div>

                  <div className="border-t border-art-stone pt-3 flex justify-between items-center text-sm font-bold text-art-charcoal">
                    <span>Total Paid:</span>
                    <span className="text-lg font-serif text-art-terracotta">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Navigation CTA Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/orders')}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-art-stone bg-white px-4 py-3 text-xs font-bold text-art-charcoal shadow-sm hover:bg-stone-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
                  >
                    View All Orders
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/products')}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-art-terracotta px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-art-terracotta/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-art-terracotta"
                  >
                    Explore Art
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}

export default OrderConfirmationPage;
