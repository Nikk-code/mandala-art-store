import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { fetchAdminOrders } from '@/services/admin-service';
import type { AdminOrderListItemDto, OrderStatus, PaymentStatus } from '@/types';
import { LoadingState, EmptyState, Pagination } from '@/components/ui';
import { formatPrice } from '@/utils';
import { OrderDetailModal } from '@/components/admin/OrderDetailModal';

export function AdminOrdersPage(): ReactNode {
  const [orders, setOrders] = useState<AdminOrderListItemDto[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | ''>('');
  const [selectedSort, setSelectedSort] = useState<
    'newest' | 'oldest' | 'total_desc' | 'total_asc'
  >('newest');

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Order for Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load Orders
  const loadOrders = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminOrders({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: selectedStatus || undefined,
        paymentStatus: selectedPaymentStatus || undefined,
        sort: selectedSort,
      });

      setOrders(res.items);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer orders.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedStatus, selectedPaymentStatus, selectedSort]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSearchSubmit = (e: FormEvent): void => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleResetFilters = (): void => {
    setSearchInput('');
    setSearch('');
    setSelectedStatus('');
    setSelectedPaymentStatus('');
    setSelectedSort('newest');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedStatus) ||
    Boolean(selectedPaymentStatus) ||
    selectedSort !== 'newest';

  const handleOpenDetail = (orderId: string): void => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleCloseDetail = (): void => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  const handleOrderUpdated = (): void => {
    loadOrders();
  };

  const getStatusBadge = (status: OrderStatus): ReactNode => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
            Confirmed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
            Processing
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
            Shipped
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
            Cancelled
          </span>
        );
      case 'PAYMENT_FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
            Payment Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 text-stone-700">
            Pending Payment
          </span>
        );
    }
  };

  const getPaymentBadge = (status: PaymentStatus): ReactNode => {
    switch (status) {
      case 'CAPTURED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Paid
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Failed
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-art-charcoal tracking-tight">
              Order Fulfillment & Logistics
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Inspect patron orders, monitor payment evidence, update shipping carrier statuses, and
              track deliveries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadOrders()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-art-charcoal shadow-sm transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-4">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-xs font-semibold text-stone-700 mb-1">
                Search Orders
              </label>
              <div className="flex gap-2">
                <input
                  id="search"
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Order #, email, phone, recipient name..."
                  className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-art-ochre hover:bg-amber-600 text-art-charcoal transition-colors shrink-0 shadow-sm"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="orderStatus"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Order Status
              </label>
              <select
                id="orderStatus"
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value as OrderStatus | '');
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none bg-white"
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PAYMENT_FAILED">Payment Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label
                htmlFor="paymentStatus"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Payment Status
              </label>
              <select
                id="paymentStatus"
                value={selectedPaymentStatus}
                onChange={e => {
                  setSelectedPaymentStatus(e.target.value as PaymentStatus | '');
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none bg-white"
              >
                <option value="">All Payments</option>
                <option value="CAPTURED">Paid (Captured)</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sortOrder"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Sort Order
              </label>
              <select
                id="sortOrder"
                value={selectedSort}
                onChange={e => {
                  setSelectedSort(
                    e.target.value as 'newest' | 'oldest' | 'total_desc' | 'total_asc'
                  );
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-art-ochre focus:border-art-ochre outline-none bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="total_desc">Total: High to Low</option>
                <option value="total_asc">Total: Low to High</option>
              </select>
            </div>
          </form>

          {/* Active filter count & Reset */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
            <span className="text-stone-500 font-medium">
              Showing <strong>{orders.length}</strong> of <strong>{totalItems}</strong> matching
              orders
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-art-ochre hover:text-amber-700 font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadOrders()}
              className="px-3 py-1 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20">
            <LoadingState message="Loading administrative orders..." />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description={
              hasActiveFilters
                ? 'No customer orders match your active search or status filters. Try clearing filters.'
                : 'No customer orders have been recorded in the store yet.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
            onAction={hasActiveFilters ? handleResetFilters : undefined}
          />
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer & Type</th>
                    <th className="px-4 py-3 text-center">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Order Number */}
                      <td className="px-4 py-3.5 font-mono font-bold text-art-charcoal">
                        {order.orderNumber}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-stone-600 font-mono whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Customer & Type */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-art-charcoal truncate max-w-[180px]">
                            {order.shippingRecipientName}
                          </span>
                          <span className="text-[11px] text-stone-500 font-mono truncate max-w-[180px]">
                            {order.customerEmail}
                          </span>
                          <div className="pt-0.5">
                            {order.isGuest ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                Guest
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 text-teal-700">
                                Patron
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5 text-center font-bold text-art-charcoal">
                        {order.itemCount}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 text-right font-bold text-art-charcoal whitespace-nowrap">
                        {formatPrice(order.total)}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getPaymentBadge(order.paymentStatus)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(order.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-art-ochre hover:bg-amber-600 text-art-charcoal transition-colors shadow-sm"
                        >
                          View & Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-stone-200">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={newPage => setPage(newPage)}
                />
              </div>
            )}
          </div>
        )}

        {/* Order Details & Lifecycle Modal */}
        <OrderDetailModal
          orderId={selectedOrderId}
          isOpen={isModalOpen}
          onClose={handleCloseDetail}
          onOrderUpdated={handleOrderUpdated}
        />
      </div>
    </AdminLayout>
  );
}
