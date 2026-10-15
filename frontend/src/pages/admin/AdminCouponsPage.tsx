import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import {
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  toggleAdminCouponStatus,
  deleteAdminCoupon,
} from '@/services/coupon-service';
import type { CouponDto, CreateCouponInput, UpdateCouponInput } from '@/types';
import { LoadingState, EmptyState, Badge, Pagination } from '@/components/ui';
import { formatPrice } from '@/utils';

export function AdminCouponsPage(): ReactNode {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [totalCoupons, setTotalCoupons] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('newest');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: string; // rupees or percentage
    minOrderRupees: string;
    maxDiscountRupees: string;
    usageLimit: string;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
  }>({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    minOrderRupees: '',
    maxDiscountRupees: '',
    usageLimit: '',
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
  });

  // Delete Confirmation Modal State
  const [deletingCoupon, setDeletingCoupon] = useState<CouponDto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load Coupons
  const loadCoupons = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      let isActiveFilter: boolean | undefined = undefined;
      if (statusFilter === 'active') isActiveFilter = true;
      if (statusFilter === 'inactive') isActiveFilter = false;

      const res = await fetchAdminCoupons(
        {
          search: search.trim() || undefined,
          isActive: isActiveFilter,
          discountType: (typeFilter as 'PERCENTAGE' | 'FIXED_AMOUNT') || undefined,
        },
        {
          page,
          pageSize,
          sort: (sort as 'newest' | 'oldest' | 'code_asc' | 'times_used_desc') || undefined,
        }
      );

      setCoupons(res.coupons);
      setTotalCoupons(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, typeFilter, sort]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // Open Create Modal
  const handleOpenCreate = (): void => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '10',
      minOrderRupees: '',
      maxDiscountRupees: '',
      usageLimit: '',
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      isActive: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (coupon: CouponDto): void => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue:
        coupon.discountType === 'PERCENTAGE'
          ? String(coupon.discountValue)
          : String(coupon.discountValue / 100),
      minOrderRupees:
        coupon.minOrderAmount !== null && coupon.minOrderAmount !== undefined
          ? String(coupon.minOrderAmount / 100)
          : '',
      maxDiscountRupees:
        coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined
          ? String(coupon.maxDiscountAmount / 100)
          : '',
      usageLimit: coupon.usageLimit !== null ? String(coupon.usageLimit) : '',
      validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
      isActive: coupon.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const cleanCode = formData.code.trim().toUpperCase();
      if (!cleanCode) throw new Error('Coupon code is required.');

      const parsedDiscountValue = Number(formData.discountValue);
      if (isNaN(parsedDiscountValue) || parsedDiscountValue <= 0) {
        throw new Error('Please provide a valid positive discount value.');
      }

      // Convert rupees to paise if FIXED_AMOUNT
      const finalDiscountValue =
        formData.discountType === 'PERCENTAGE'
          ? Math.round(parsedDiscountValue)
          : Math.round(parsedDiscountValue * 100);

      const minOrderPaise = formData.minOrderRupees.trim()
        ? Math.round(Number(formData.minOrderRupees) * 100)
        : null;

      const maxDiscountPaise = formData.maxDiscountRupees.trim()
        ? Math.round(Number(formData.maxDiscountRupees) * 100)
        : null;

      const usageLimitVal = formData.usageLimit.trim()
        ? Math.round(Number(formData.usageLimit))
        : null;

      const fromDate = new Date(formData.validFrom);
      const untilDate = new Date(formData.validUntil);
      if (untilDate <= fromDate) {
        throw new Error('Valid Until date must be strictly after Valid From date.');
      }

      if (editingCoupon) {
        const updatePayload: UpdateCouponInput = {
          code: cleanCode,
          discountType: formData.discountType,
          discountValue: finalDiscountValue,
          minOrderAmount: minOrderPaise,
          maxDiscountAmount: maxDiscountPaise,
          usageLimit: usageLimitVal,
          validFrom: fromDate.toISOString(),
          validUntil: untilDate.toISOString(),
          isActive: formData.isActive,
        };

        await updateAdminCoupon(editingCoupon.id, updatePayload);
        setSuccessMessage(`Coupon "${cleanCode}" updated successfully.`);
      } else {
        const createPayload: CreateCouponInput = {
          code: cleanCode,
          discountType: formData.discountType,
          discountValue: finalDiscountValue,
          minOrderAmount: minOrderPaise,
          maxDiscountAmount: maxDiscountPaise,
          usageLimit: usageLimitVal,
          validFrom: fromDate.toISOString(),
          validUntil: untilDate.toISOString(),
          isActive: formData.isActive,
        };

        await createAdminCoupon(createPayload);
        setSuccessMessage(`Coupon "${cleanCode}" created successfully.`);
      }

      setIsModalOpen(false);
      loadCoupons();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to save coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (coupon: CouponDto): Promise<void> => {
    try {
      const updated = await toggleAdminCouponStatus(coupon.id, !coupon.isActive);
      setCoupons(prev => prev.map(c => (c.id === coupon.id ? updated : c)));
      setSuccessMessage(
        `Coupon "${coupon.code}" is now ${updated.isActive ? 'Active' : 'Inactive'}.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status.');
    }
  };

  // Confirm Delete Action
  const handleDeleteCoupon = async (): Promise<void> => {
    if (!deletingCoupon) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAdminCoupon(deletingCoupon.id);
      setSuccessMessage(`Coupon "${deletingCoupon.code}" was deleted.`);
      setDeletingCoupon(null);
      loadCoupons();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete coupon.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-art-stone pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-art-charcoal">
            Promotions & Coupons {totalCoupons > 0 ? `(${totalCoupons})` : ''}
          </h1>
          <p className="mt-1 text-xs text-stone-600">
            Create, configure, and monitor customer discount codes with authoritative usage limits.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center rounded-xl bg-art-ochre px-4 py-2 text-xs font-bold text-art-charcoal shadow-sm hover:bg-art-ochre/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
        >
          + Create Coupon
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center justify-between animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center justify-between animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-900 font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-art-stone bg-white p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div>
          <label
            htmlFor="couponSearch"
            className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1"
          >
            Search Code
          </label>
          <input
            id="couponSearch"
            type="text"
            placeholder="Search code..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-art-stone px-3 py-1.5 text-xs text-art-charcoal focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="statusFilter"
            className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1"
          >
            Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-art-stone px-3 py-1.5 text-xs text-art-charcoal bg-white focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Discount Type Filter */}
        <div>
          <label
            htmlFor="typeFilter"
            className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1"
          >
            Discount Type
          </label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={e => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-art-stone px-3 py-1.5 text-xs text-art-charcoal bg-white focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
          >
            <option value="">All Types</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
          </select>
        </div>

        {/* Sorting */}
        <div>
          <label
            htmlFor="sortFilter"
            className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1"
          >
            Sort Order
          </label>
          <select
            id="sortFilter"
            value={sort}
            onChange={e => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-art-stone px-3 py-1.5 text-xs text-art-charcoal bg-white focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="code_asc">Code (A–Z)</option>
            <option value="times_used_desc">Most Redeemed</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 rounded-2xl bg-white border border-art-stone flex justify-center">
          <LoadingState message="Loading promotions and coupons..." />
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-art-stone bg-white p-8">
          <EmptyState
            title="No Coupons Found"
            description={
              search || statusFilter || typeFilter
                ? 'No promotions match your filter criteria. Try clearing search filters.'
                : 'No promotional coupons created yet. Click "+ Create Coupon" to launch your first promotion.'
            }
            actionLabel={search || statusFilter || typeFilter ? 'Clear Filters' : '+ Create Coupon'}
            onAction={
              search || statusFilter || typeFilter
                ? () => {
                    setSearch('');
                    setStatusFilter('');
                    setTypeFilter('');
                    setPage(1);
                  }
                : handleOpenCreate
            }
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-art-stone bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-art-stone/60 text-xs text-left text-art-charcoal">
              <thead className="bg-stone-50 font-bold uppercase tracking-wider text-[10px] text-stone-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Discount
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Usage & Limits
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Min Order
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Validity Window
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-art-stone/50">
                {coupons.map(coupon => {
                  const now = new Date();
                  const isExpired = new Date(coupon.validUntil) < now;
                  const isFuture = new Date(coupon.validFrom) > now;

                  return (
                    <tr key={coupon.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Code */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-xs bg-stone-100 px-2 py-1 rounded border border-stone-200 text-art-charcoal">
                          {coupon.code}
                        </span>
                      </td>

                      {/* Discount Details */}
                      <td className="px-4 py-3.5">
                        {coupon.discountType === 'PERCENTAGE' ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-art-ochre text-sm">
                              {coupon.discountValue}% Off
                            </span>
                            {coupon.maxDiscountAmount && (
                              <p className="text-[10px] text-stone-500">
                                Max {formatPrice(coupon.maxDiscountAmount)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="font-bold text-art-terracotta text-sm">
                            {formatPrice(coupon.discountValue)} Off
                          </span>
                        )}
                      </td>

                      {/* Usage & Limits */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-art-charcoal">
                              {coupon.timesUsed}
                            </span>
                            <span className="text-stone-400">/</span>
                            <span className="text-stone-600">
                              {coupon.usageLimit !== null ? coupon.usageLimit : '∞'} used
                            </span>
                          </div>
                          {coupon.ordersCount !== undefined && coupon.ordersCount > 0 && (
                            <p className="text-[10px] text-stone-500">
                              Linked to {coupon.ordersCount} order(s)
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Min Order */}
                      <td className="px-4 py-3.5">
                        {coupon.minOrderAmount ? (
                          <span className="text-stone-700">
                            {formatPrice(coupon.minOrderAmount)}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">None</span>
                        )}
                      </td>

                      {/* Validity Dates */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5 text-[11px]">
                          <p className="text-stone-600">
                            Until{' '}
                            {new Date(coupon.validUntil).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          {isExpired && (
                            <Badge variant="terracotta" className="text-[9px] py-0">
                              Expired
                            </Badge>
                          )}
                          {isFuture && (
                            <Badge variant="ochre" className="text-[9px] py-0">
                              Upcoming
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          aria-label={`Toggle active status for coupon ${coupon.code}`}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            coupon.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                          title={`Click to ${coupon.isActive ? 'Deactivate' : 'Activate'}`}
                        >
                          {coupon.isActive ? '● Active' : '○ Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(coupon)}
                          className="text-art-ochre hover:text-art-ochre/80 font-semibold p-1"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingCoupon(coupon);
                            setDeleteError(null);
                          }}
                          className="text-stone-400 hover:text-rose-600 font-semibold p-1"
                          title="Delete coupon"
                          aria-label={`Delete coupon ${coupon.code}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-art-stone/60 p-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-art-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="couponModalTitle"
            className="rounded-2xl border border-art-stone bg-white shadow-xl max-w-lg w-full p-6 space-y-5 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-art-stone pb-3">
              <h2 id="couponModalTitle" className="font-serif text-lg font-bold text-art-charcoal">
                {editingCoupon
                  ? `Edit Coupon: ${editingCoupon.code}`
                  : 'Create New Promotional Coupon'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-art-charcoal font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Code */}
              <div>
                <label htmlFor="couponCodeInput" className="block font-bold text-stone-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  id="couponCodeInput"
                  type="text"
                  required
                  placeholder="e.g. DIWALI2026"
                  value={formData.code}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  className="w-full rounded-xl border border-art-stone px-3 py-2 uppercase font-mono text-sm tracking-wider focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Uppercase letters, numbers, and hyphens (3–50 chars).
                </p>
              </div>

              {/* Type and Value Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="discountTypeInput"
                    className="block font-bold text-stone-700 mb-1"
                  >
                    Discount Type *
                  </label>
                  <select
                    id="discountTypeInput"
                    value={formData.discountType}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT',
                      }))
                    }
                    className="w-full rounded-xl border border-art-stone px-3 py-2 bg-white text-xs focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="discountValueInput"
                    className="block font-bold text-stone-700 mb-1"
                  >
                    {formData.discountType === 'PERCENTAGE'
                      ? 'Discount Percentage (%) *'
                      : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    id="discountValueInput"
                    type="number"
                    required
                    min={formData.discountType === 'PERCENTAGE' ? '1' : '1'}
                    max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                    step={formData.discountType === 'PERCENTAGE' ? '1' : '1'}
                    value={formData.discountValue}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, discountValue: e.target.value }))
                    }
                    className="w-full rounded-xl border border-art-stone px-3 py-2 text-xs focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
                  />
                </div>
              </div>

              {/* Optional Limits Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Min Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional (e.g. 1000)"
                    value={formData.minOrderRupees}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, minOrderRupees: e.target.value }))
                    }
                    className="w-full rounded-xl border border-art-stone px-3 py-2 text-xs focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Optional (e.g. 500)"
                    disabled={formData.discountType !== 'PERCENTAGE'}
                    value={formData.maxDiscountRupees}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, maxDiscountRupees: e.target.value }))
                    }
                    className="w-full rounded-xl border border-art-stone px-3 py-2 text-xs disabled:bg-stone-100 disabled:text-stone-400 focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
                  />
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Global Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Optional (leave empty for unlimited)"
                  value={formData.usageLimit}
                  onChange={e => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                  className="w-full rounded-xl border border-art-stone px-3 py-2 text-xs focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
                />
              </div>

              {/* Validity Dates Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Valid From *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.validFrom}
                    onChange={e => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full rounded-xl border border-art-stone px-3 py-2 text-xs focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Valid Until *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.validUntil}
                    onChange={e => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full rounded-xl border border-art-stone px-3 py-2 text-xs focus:border-art-ochre focus:outline-none focus:ring-1 focus:ring-art-ochre"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="couponActiveToggle"
                  checked={formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-art-stone text-art-ochre focus:ring-art-ochre h-4 w-4"
                />
                <label
                  htmlFor="couponActiveToggle"
                  className="text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  Activate coupon immediately upon saving
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-art-stone/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-art-ochre text-art-charcoal font-bold hover:bg-art-ochre/90 shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-art-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteCouponModalTitle"
            className="rounded-2xl border border-art-stone bg-white shadow-xl max-w-md w-full p-6 space-y-4 animate-fadeIn"
          >
            <h2
              id="deleteCouponModalTitle"
              className="font-serif text-lg font-bold text-art-charcoal"
            >
              Delete Coupon: {deletingCoupon.code}
            </h2>

            {deleteError ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
              >
                {deleteError}
              </div>
            ) : deletingCoupon.ordersCount !== undefined && deletingCoupon.ordersCount > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                <p className="font-bold">Cannot Delete Linked Coupon</p>
                <p>
                  This coupon has been redeemed in {deletingCoupon.ordersCount} historical order(s).
                  Deleting it would break order history. Please deactivate it instead.
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-600">
                Are you sure you want to permanently delete coupon &quot;{deletingCoupon.code}
                &quot;? This action cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-art-stone/60">
              <button
                type="button"
                onClick={() => setDeletingCoupon(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs"
              >
                Close
              </button>

              {(!deletingCoupon.ordersCount || deletingCoupon.ordersCount === 0) && (
                <button
                  type="button"
                  onClick={handleDeleteCoupon}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-sm text-xs"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Coupon'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
