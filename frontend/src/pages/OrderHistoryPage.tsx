import { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Section,
  Badge,
  Pagination,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import { fetchOrderHistory } from '@/services';
import { formatPrice } from '@/utils';
import type { OrderHistoryItemDto } from '@/types';

export function OrderHistoryPage(): ReactNode {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [orders, setOrders] = useState<OrderHistoryItemDto[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'My Orders | Mandala Art Store';
  }, []);

  const loadOrders = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchOrderHistory(page, 10);
      setOrders(data.orders);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to retrieve order history. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
            <li aria-current="page" className="font-medium text-art-charcoal">
              My Orders
            </li>
          </ol>
        </Container>
      </nav>

      {/* 2. Order History Header */}
      <Section background="cream" spacing="md">
        <Container size="7xl">
          <div className="py-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-art-ochre">
              Customer Account
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-art-charcoal mt-1">
              My Artwork Orders
            </h1>
            <p className="mt-1.5 text-sm text-stone-600 max-w-2xl leading-relaxed">
              Track fulfillment progress, view payment verification status, and review historical
              invoices for your commissioned artworks.
            </p>
          </div>

          {/* 3. Main Content Area */}
          <div className="mt-6">
            {loading ? (
              <div className="py-20 rounded-2xl bg-white border border-art-stone">
                <LoadingState message="Loading your order history..." />
              </div>
            ) : error ? (
              <div className="py-12 rounded-2xl bg-white border border-art-stone p-6">
                <ErrorState
                  title="Unable to Load Orders"
                  message={error}
                  onRetry={() => loadOrders(currentPage)}
                />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 rounded-2xl bg-white p-8 border border-art-stone">
                <EmptyState
                  title="No Orders Placed Yet"
                  description="You have not placed any artwork orders with us. Explore our authentic handcrafted mandala collections to place your first order."
                  actionLabel="Explore Collections"
                  onAction={() => navigate('/products')}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                  <span>
                    Showing {orders.length} of {totalCount} total orders
                  </span>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                  {orders.map(order => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-art-stone bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-art-stone/60 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-base text-art-charcoal">
                              #{order.orderNumber}
                            </span>
                            <Badge
                              variant={order.status === 'CONFIRMED' ? 'success' : 'default'}
                              className="text-[11px]"
                            >
                              {order.status}
                            </Badge>
                            <Badge
                              variant={order.paymentStatus === 'CAPTURED' ? 'success' : 'ochre'}
                              className="text-[11px]"
                            >
                              Payment: {order.paymentStatus}
                            </Badge>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
                          <span className="text-xs text-stone-500 sm:block">Total Amount</span>
                          <span className="font-serif text-lg font-bold text-art-terracotta">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>

                      {/* Line item summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-stone-600">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold uppercase text-stone-400">
                            Artworks Included:
                          </span>
                          {order.items && order.items.length > 0 ? (
                            <ul className="space-y-1">
                              {order.items.map(item => (
                                <li key={item.id} className="truncate">
                                  • {item.productName} ({item.quantity} ×{' '}
                                  {formatPrice(item.unitPrice)})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-stone-500 italic">
                              {order.itemCount} {order.itemCount === 1 ? 'artwork' : 'artworks'}
                            </p>
                          )}
                        </div>

                        <div className="flex items-end justify-start md:justify-end pt-2 md:pt-0">
                          <Link
                            to={`/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-art-stone bg-stone-50 px-4 py-2.5 text-xs font-bold text-art-charcoal hover:bg-art-cream hover:border-art-ochre/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
                          >
                            <span>View Order Details</span>
                            <span aria-hidden="true">→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pt-6 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </Section>
    </div>
  );
}

export default OrderHistoryPage;
