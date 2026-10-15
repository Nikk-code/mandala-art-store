import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { fetchAdminOrderById, updateAdminOrderStatus } from '@/services/admin-service';
import type { AdminOrderDetailsDto, OrderStatus } from '@/types';
import { formatPrice } from '@/utils';
import { LoadingState } from '@/components/ui';

export interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: AdminOrderDetailsDto) => void;
}

export function OrderDetailModal({
  orderId,
  isOpen,
  onClose,
  onOrderUpdated,
}: OrderDetailModalProps): ReactNode {
  const [order, setOrder] = useState<AdminOrderDetailsDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Status Transition Form State
  const [targetStatus, setTargetStatus] = useState<OrderStatus | ''>('');
  const [courierName, setCourierName] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionSuccess, setTransitionSuccess] = useState<string | null>(null);

  // Load Order Details
  const loadOrder = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    setTransitionError(null);
    setTransitionSuccess(null);
    try {
      const data = await fetchAdminOrderById(id);
      setOrder(data);
      // Pre-fill existing fulfillment details if available
      setCourierName(data.fulfillment.courierName || '');
      setTrackingNumber(data.fulfillment.trackingNumber || '');

      // Set default next target status
      if (data.status === 'CONFIRMED') {
        setTargetStatus('PROCESSING');
      } else if (data.status === 'PROCESSING') {
        setTargetStatus('SHIPPED');
      } else if (data.status === 'SHIPPED') {
        setTargetStatus('DELIVERED');
      } else {
        setTargetStatus('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrder(orderId);
    } else {
      setOrder(null);
      setError(null);
      setTransitionError(null);
      setTransitionSuccess(null);
    }
  }, [isOpen, orderId, loadOrder]);

  if (!isOpen || !orderId) {
    return null;
  }

  const handleStatusSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!order || !targetStatus) return;

    setSubmitting(true);
    setTransitionError(null);
    setTransitionSuccess(null);

    try {
      const updated = await updateAdminOrderStatus(order.id, {
        status: targetStatus,
        courierName: targetStatus === 'SHIPPED' ? courierName : courierName || undefined,
        trackingNumber: targetStatus === 'SHIPPED' ? trackingNumber : trackingNumber || undefined,
      });

      setOrder(updated);
      setTransitionSuccess(`Order status successfully updated to ${updated.status}.`);
      if (onOrderUpdated) {
        onOrderUpdated(updated);
      }

      // Update next available target
      if (updated.status === 'PROCESSING') {
        setTargetStatus('SHIPPED');
      } else if (updated.status === 'SHIPPED') {
        setTargetStatus('DELIVERED');
      } else {
        setTargetStatus('');
      }
    } catch (err) {
      setTransitionError(err instanceof Error ? err.message : 'Failed to update order status.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: OrderStatus): ReactNode => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            Confirmed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            Processing
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
            Shipped
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            Cancelled
          </span>
        );
      case 'PAYMENT_FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            Payment Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
            Pending Payment
          </span>
        );
    }
  };

  const getPaymentBadge = (status: string): ReactNode => {
    switch (status) {
      case 'CAPTURED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Paid (Captured)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Payment Failed
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-order-number"
    >
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/80">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-stone-500">
              Order Details
            </span>
            <h2 id="modal-order-number" className="text-xl font-mono font-bold text-art-charcoal">
              {order ? order.orderNumber : orderId}
            </h2>
            {order && (
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
                {getPaymentBadge(order.paymentStatus)}
                {order.customer.isGuest ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Guest Checkout
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    Registered Patron
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-2xl font-bold p-1 rounded-lg hover:bg-stone-200/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-16">
              <LoadingState message="Loading immutable order snapshot..." />
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-2">
              <p className="font-semibold">Unable to load order details</p>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => loadOrder(orderId)}
                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          )}

          {order && !loading && (
            <>
              {/* Order Meta & Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-500 font-medium block">Placed Date</span>
                  <span className="font-mono font-semibold text-art-charcoal">
                    {new Date(order.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium block">Total Items</span>
                  <span className="font-bold text-art-charcoal">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} artworks
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium block">Payment Status</span>
                  <span className="font-bold text-art-charcoal">{order.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium block">Grand Total</span>
                  <span className="text-sm font-bold text-art-charcoal">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              {/* Customer & Shipping Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2 text-xs">
                  <h3 className="font-serif font-bold text-art-charcoal text-sm border-b border-stone-100 pb-2">
                    Customer Information
                  </h3>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-stone-500 block">Contact Name:</span>
                      <span className="font-semibold text-art-charcoal">
                        {order.shippingAddress.recipientName}
                        {order.customer.registeredName && (
                          <span className="text-stone-400 font-normal ml-1">
                            (Account: {order.customer.registeredName})
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Email Address:</span>
                      <span className="font-mono text-art-charcoal">{order.customer.email}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Phone Number:</span>
                      <span className="font-mono text-art-charcoal">{order.customer.phone}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Account Status:</span>
                      <span className="font-medium text-stone-700">
                        {order.customer.isGuest
                          ? 'Guest Checkout (No registered account)'
                          : `Registered Patron (ID: ${order.customer.userId})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address Snapshot */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2 text-xs">
                  <h3 className="font-serif font-bold text-art-charcoal text-sm border-b border-stone-100 pb-2">
                    Shipping Address Snapshot
                  </h3>
                  <div className="space-y-1 text-stone-700">
                    <p className="font-bold text-art-charcoal">
                      {order.shippingAddress.recipientName}
                    </p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && (
                      <p>{order.shippingAddress.addressLine2}</p>
                    )}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                      <span className="font-mono font-semibold">
                        {order.shippingAddress.postalCode}
                      </span>
                    </p>
                    <p className="font-medium text-stone-600">{order.shippingAddress.country}</p>
                    <p className="font-mono text-stone-500 pt-1">
                      Recipient Phone: {order.shippingAddress.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-200 bg-stone-50/50">
                  <h3 className="font-serif font-bold text-art-charcoal text-sm">
                    Purchased Artworks Snapshot
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="px-4 py-2.5">Item / Artwork</th>
                        <th className="px-4 py-2.5">SKU</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {order.items.map(item => (
                        <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-art-charcoal">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-500">{item.productSku}</td>
                          <td className="px-4 py-3 text-right font-medium text-stone-700">
                            {formatPrice(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-art-charcoal">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-art-charcoal">
                            {formatPrice(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-stone-50/80 border-t border-stone-200 text-stone-700 font-medium">
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-right">
                          Subtotal:
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-art-charcoal">
                          {formatPrice(order.subtotal)}
                        </td>
                      </tr>
                      {order.discountAmount > 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-right text-emerald-700">
                            Discount ({order.couponCode || 'Coupon'}):
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-emerald-700">
                            -{formatPrice(order.discountAmount)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-right">
                          Shipping Fee:
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-art-charcoal">
                          {order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}
                        </td>
                      </tr>
                      {order.taxAmount > 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-right">
                            GST Tax:
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-art-charcoal">
                            {formatPrice(order.taxAmount)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-t border-stone-300 text-sm font-bold text-art-charcoal">
                        <td colSpan={4} className="px-4 py-3 text-right">
                          Grand Total:
                        </td>
                        <td className="px-4 py-3 text-right font-serif text-base text-art-charcoal">
                          {formatPrice(order.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Evidence Details */}
              <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3 text-xs">
                <h3 className="font-serif font-bold text-art-charcoal text-sm border-b border-stone-200 pb-2">
                  Payment Gateway Evidence
                </h3>
                {order.payments && order.payments.length > 0 ? (
                  <div className="space-y-3">
                    {order.payments.map((p, idx) => (
                      <div
                        key={p.id}
                        className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-art-charcoal">
                            Attempt #{idx + 1} — Provider: {p.provider.toUpperCase()}
                          </span>
                          {getPaymentBadge(p.status)}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-stone-600 font-mono text-[11px] pt-1">
                          <div>
                            <span className="text-stone-400 block font-sans">Payment Amount:</span>
                            {formatPrice(p.amount)} {p.currency}
                          </div>
                          <div>
                            <span className="text-stone-400 block font-sans">
                              Gateway Order ID:
                            </span>
                            {p.providerOrderId || '—'}
                          </div>
                          <div>
                            <span className="text-stone-400 block font-sans">Payment ID:</span>
                            {p.providerPaymentId || '—'}
                          </div>
                        </div>
                        {p.paidAt && (
                          <p className="text-[11px] text-stone-500 font-mono">
                            Paid at: {new Date(p.paidAt).toLocaleString('en-IN')}
                          </p>
                        )}
                        {p.failureReason && (
                          <p className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded">
                            Failure: {p.failureReason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-500">No payment records found.</p>
                )}
              </div>

              {/* Customer Notes */}
              {order.fulfillment.customerNotes && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-xs text-amber-900 space-y-1">
                  <span className="font-bold block">Customer Special Instructions:</span>
                  <p>{order.fulfillment.customerNotes}</p>
                </div>
              )}

              {/* Fulfillment Actions & Lifecycle Transitions */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
                <div className="border-b border-stone-200 pb-2">
                  <h3 className="font-serif font-bold text-art-charcoal text-base">
                    Fulfillment Lifecycle Management
                  </h3>
                  <p className="text-xs text-stone-500">
                    Authoritatively advance order status and enter courier tracking details.
                  </p>
                </div>

                {transitionError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {transitionError}
                  </div>
                )}

                {transitionSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    {transitionSuccess}
                  </div>
                )}

                {/* Display Current Tracking if exists */}
                {(order.fulfillment.courierName || order.fulfillment.trackingNumber) && (
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs font-mono flex flex-wrap gap-4">
                    <div>
                      <span className="text-stone-400 block font-sans">Courier Partner:</span>
                      <span className="font-bold text-art-charcoal">
                        {order.fulfillment.courierName || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block font-sans">Tracking Number:</span>
                      <span className="font-bold text-art-charcoal">
                        {order.fulfillment.trackingNumber || '—'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Status-Specific Action Forms */}
                {order.status === 'DELIVERED' ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                    <p className="font-bold">Order Delivered</p>
                    <p className="text-emerald-700">
                      This order has successfully reached its terminal delivery state. No further
                      fulfillment transitions are permitted.
                    </p>
                  </div>
                ) : order.status === 'CANCELLED' ? (
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs">
                    <p className="font-bold">Order Cancelled</p>
                    <p className="text-rose-700">
                      This order is cancelled and cannot be fulfilled.
                    </p>
                  </div>
                ) : order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_FAILED' ? (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
                    <p className="font-bold">Payment Unverified</p>
                    <p className="text-amber-800">
                      Orders cannot be advanced to fulfillment until Razorpay cryptographically
                      verifies payment. Manual payment overrides are strictly prohibited.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs sm:text-sm">
                    {order.status === 'CONFIRMED' && (
                      <div className="space-y-3">
                        <p className="text-xs text-stone-600">
                          Payment has been confirmed. Mark this order as <strong>Processing</strong>{' '}
                          to indicate that framing, crafting, or packaging is underway.
                        </p>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2.5 rounded-lg font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                          {submitting ? 'Updating...' : 'Mark as Processing'}
                        </button>
                      </div>
                    )}

                    {order.status === 'PROCESSING' && (
                      <div className="space-y-4">
                        <p className="text-xs text-stone-600">
                          Package is ready for dispatch. Enter courier partner and tracking details
                          to mark as <strong>Shipped</strong>.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="courierName"
                              className="block text-xs font-semibold text-stone-700 mb-1"
                            >
                              Courier / Carrier Partner <span className="text-rose-600">*</span>
                            </label>
                            <input
                              id="courierName"
                              type="text"
                              required
                              value={courierName}
                              onChange={e => setCourierName(e.target.value)}
                              placeholder="e.g. Delhivery, BlueDart, India Post"
                              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="trackingNumber"
                              className="block text-xs font-semibold text-stone-700 mb-1"
                            >
                              Tracking / Waybill Number <span className="text-rose-600">*</span>
                            </label>
                            <input
                              id="trackingNumber"
                              type="text"
                              required
                              value={trackingNumber}
                              onChange={e => setTrackingNumber(e.target.value)}
                              placeholder="e.g. DEL-987654321"
                              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none font-mono"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={submitting || !courierName.trim() || !trackingNumber.trim()}
                          className="px-4 py-2.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                          {submitting ? 'Updating...' : 'Mark as Shipped'}
                        </button>
                      </div>
                    )}

                    {order.status === 'SHIPPED' && (
                      <div className="space-y-3">
                        <p className="text-xs text-stone-600">
                          Shipment is in transit. Once carrier confirms delivery to patron, mark
                          this order as <strong>Delivered</strong>.
                        </p>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                          {submitting ? 'Updating...' : 'Confirm Delivery (Mark as Delivered)'}
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-stone-200 px-6 py-3 bg-stone-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
