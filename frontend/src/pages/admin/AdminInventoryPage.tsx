import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import {
  fetchAdminInventory,
  fetchAdminCategories,
  adjustAdminInventory,
} from '@/services/admin-service';
import type {
  AdminInventoryItemDto,
  AdminCategoryDto,
  ProductAvailability,
  AdjustStockInput,
  AdminInventoryQuery,
} from '@/types';
import { LoadingState, EmptyState, Badge, Pagination } from '@/components/ui';
import { getAvailabilityInfo } from '@/utils';

export function AdminInventoryPage(): ReactNode {
  const [items, setItems] = useState<AdminInventoryItemDto[]>([]);
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('stock_asc');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stock Adjustment Modal
  const [adjustingItem, setAdjustingItem] = useState<AdminInventoryItemDto | null>(null);
  const [adjustMode, setAdjustMode] = useState<'set' | 'delta'>('set');
  const [setQuantity, setSetQuantity] = useState<number>(0);
  const [deltaQuantity, setDeltaQuantity] = useState<number>(0);
  const [targetAvailability, setTargetAvailability] = useState<ProductAvailability>('IN_STOCK');
  const [saving, setSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [forceRecount, setForceRecount] = useState<boolean>(false);

  // Load Categories for dropdown
  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchAdminCategories();
      setCategories(data);
    } catch {
      // Ignore
    }
  }, []);

  // Load Inventory
  const loadInventory = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminInventory({
        page,
        pageSize,
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        availability: (selectedAvailability as ProductAvailability) || undefined,
        sort: (selectedSort as AdminInventoryQuery['sort']) || undefined,
      });

      setItems(res.items);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedCategory, selectedAvailability, selectedSort]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Open Adjust Modal
  const handleOpenAdjust = (item: AdminInventoryItemDto): void => {
    setAdjustingItem(item);
    setAdjustMode('set');
    setSetQuantity(item.stockQuantity);
    setDeltaQuantity(0);
    setTargetAvailability(item.availability);
    setModalError(null);
    setForceRecount(false);
  };

  // Submit Stock Adjustment
  const handleSubmitAdjust = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!adjustingItem) return;

    setModalError(null);

    const input: AdjustStockInput = {};

    if (adjustMode === 'set') {
      if (setQuantity < 0) {
        setModalError('Stock quantity cannot be negative.');
        return;
      }
      input.stockQuantity = setQuantity;
      input.expectedStock = adjustingItem.stockQuantity;
      if (forceRecount) {
        input.force = true;
      }
    } else {
      if (deltaQuantity === 0) {
        setModalError('Please enter a non-zero adjustment amount.');
        return;
      }
      if (adjustingItem.stockQuantity + deltaQuantity < 0) {
        setModalError(
          `Adjustment of ${deltaQuantity} would reduce stock below 0. Current stock is ${adjustingItem.stockQuantity}.`
        );
        return;
      }
      input.adjustment = deltaQuantity;
    }

    input.availability = targetAvailability;

    setSaving(true);
    try {
      const updated = await adjustAdminInventory(adjustingItem.id, input);
      setItems(prev =>
        prev.map(i =>
          i.id === adjustingItem.id
            ? {
                ...i,
                stockQuantity: updated.stockQuantity,
                availability: updated.availability,
                isLowStock:
                  updated.availability === 'IN_STOCK' &&
                  updated.stockQuantity > 0 &&
                  updated.stockQuantity <= 3,
              }
            : i
        )
      );

      setSuccessMessage(
        `Stock for "${adjustingItem.name}" updated to ${updated.stockQuantity} (${updated.availability}).`
      );
      setAdjustingItem(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to adjust stock.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const lowStockCount = items.filter(i => i.isLowStock).length;
  const soldOutCount = items.filter(i => i.availability === 'SOLD_OUT').length;
  const inStockCount = items.filter(i => i.availability === 'IN_STOCK' && !i.isLowStock).length;
  const madeToOrderCount = items.filter(i => i.availability === 'MADE_TO_ORDER').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-art-charcoal">
          Inventory & Stock Management
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Monitor stock across {totalItems} catalog artworks, prevent stock depletion, and update
          availability states.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Healthy In Stock
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{inStockCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Low Stock Alerts
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-2xl font-bold font-mono text-amber-700">{lowStockCount}</p>
            {lowStockCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Action Needed
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Sold Out Pieces
          </p>
          <p className="text-2xl font-bold font-mono text-stone-600 mt-1">{soldOutCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Made to Order
          </p>
          <p className="text-2xl font-bold font-mono text-art-charcoal mt-1">{madeToOrderCount}</p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Global Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div>
            <label
              htmlFor="inventory-search"
              className="block text-xs font-semibold text-stone-600 mb-1"
            >
              Search Artwork / SKU
            </label>
            <input
              id="inventory-search"
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. Lotus, MND-001..."
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-art-ochre"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label
              htmlFor="inv-category-select"
              className="block text-xs font-semibold text-stone-600 mb-1"
            >
              Category
            </label>
            <select
              id="inv-category-select"
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-art-ochre bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label
              htmlFor="inv-availability-select"
              className="block text-xs font-semibold text-stone-600 mb-1"
            >
              Availability
            </label>
            <select
              id="inv-availability-select"
              value={selectedAvailability}
              onChange={e => {
                setSelectedAvailability(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-art-ochre bg-white"
            >
              <option value="">All Availability</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="MADE_TO_ORDER">Made to Order</option>
              <option value="SOLD_OUT">Sold Out</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label
              htmlFor="inv-sort-select"
              className="block text-xs font-semibold text-stone-600 mb-1"
            >
              Sort By
            </label>
            <select
              id="inv-sort-select"
              value={selectedSort}
              onChange={e => {
                setSelectedSort(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-art-ochre bg-white"
            >
              <option value="stock_asc">Lowest Stock First</option>
              <option value="stock_desc">Highest Stock First</option>
              <option value="name_asc">Artwork Name (A-Z)</option>
              <option value="newest">Newest Listed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="py-16">
          <LoadingState message="Loading inventory allocations..." />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No Items Found"
          description="No products match the selected inventory filter criteria."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[11px] tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3">
                    SKU
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Availability
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Stock Count
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Stock Alert
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map(item => {
                  const avail = getAvailabilityInfo(item.availability);
                  const primaryImg = item.images.find(img => img.isPrimary) || item.images[0];

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          {primaryImg ? (
                            <img
                              src={primaryImg.url}
                              alt={primaryImg.altText || item.name}
                              className="w-10 h-10 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] text-stone-400 flex-shrink-0">
                              No Art
                            </div>
                          )}
                          <div className="truncate max-w-[200px] sm:max-w-[280px]">
                            <p
                              className="font-semibold text-art-charcoal truncate"
                              title={item.name}
                            >
                              {item.name}
                            </p>
                            <span className="text-[11px] text-stone-500 font-mono truncate block">
                              /{item.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-stone-600">{item.sku}</td>

                      <td className="px-4 py-3.5 text-stone-600">{item.category.name}</td>

                      <td className="px-4 py-3.5">
                        <Badge variant={avail.badgeVariant}>{avail.label}</Badge>
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono font-bold text-sm text-art-charcoal">
                        {item.stockQuantity}
                      </td>

                      <td className="px-4 py-3.5">
                        {item.isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                            Low Stock (≤ 3)
                          </span>
                        ) : item.availability === 'SOLD_OUT' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 text-stone-600">
                            Out of Stock
                          </span>
                        ) : item.availability === 'MADE_TO_ORDER' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700">
                            On-Demand Crafting
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                            Healthy Stock
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(item)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-art-ochre hover:bg-amber-600 text-art-charcoal transition-colors shadow-sm"
                        >
                          Adjust Stock
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

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-lg font-serif font-bold text-art-charcoal">
                Adjust Inventory Stock
              </h2>
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="text-stone-400 hover:text-stone-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Item Summary */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs space-y-1">
              <p className="font-semibold text-art-charcoal truncate">{adjustingItem.name}</p>
              <div className="flex items-center justify-between text-stone-500 font-mono">
                <span>SKU: {adjustingItem.sku}</span>
                <span>Current Stock: {adjustingItem.stockQuantity}</span>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitAdjust} className="space-y-4 text-xs sm:text-sm">
              {/* Mode Toggle */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">Adjustment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustMode('set')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                      adjustMode === 'set'
                        ? 'bg-art-ochre/20 border-art-ochre text-art-charcoal'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Set Exact Quantity
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode('delta')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                      adjustMode === 'delta'
                        ? 'bg-art-ochre/20 border-art-ochre text-art-charcoal'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Relative Increment (+ / -)
                  </button>
                </div>
              </div>

              {/* Mode Inputs */}
              {adjustMode === 'set' ? (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    New Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={setQuantity}
                    onChange={e => setSetQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-base focus:ring-2 focus:ring-art-ochre"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Directly updates the inventory total for this artwork piece.
                  </p>
                  <div className="mt-2.5 flex items-center space-x-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <input
                      id="forceRecount"
                      type="checkbox"
                      checked={forceRecount}
                      onChange={e => setForceRecount(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-art-ochre focus:ring-art-ochre cursor-pointer"
                    />
                    <label
                      htmlFor="forceRecount"
                      className="text-[11px] text-stone-700 font-medium cursor-pointer"
                    >
                      Authoritative physical recount (override concurrent checkouts/changes)
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Quantity Delta (+ / -) *
                  </label>
                  <input
                    type="number"
                    required
                    value={deltaQuantity}
                    onChange={e => setDeltaQuantity(parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g. +5 or -2"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-base focus:ring-2 focus:ring-art-ochre"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Resulting stock:{' '}
                    <span className="font-bold">
                      {Math.max(0, adjustingItem.stockQuantity + deltaQuantity)}
                    </span>
                  </p>
                </div>
              )}

              {/* Availability Selection */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Availability Status
                </label>
                <select
                  value={targetAvailability}
                  onChange={e => setTargetAvailability(e.target.value as ProductAvailability)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre bg-white"
                >
                  <option value="IN_STOCK">IN_STOCK (Available for immediate dispatch)</option>
                  <option value="MADE_TO_ORDER">MADE_TO_ORDER (Crafted on demand)</option>
                  <option value="SOLD_OUT">SOLD_OUT (Unavailable for purchase)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-art-ochre hover:bg-amber-600 text-art-charcoal font-semibold disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
