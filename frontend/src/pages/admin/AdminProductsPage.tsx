import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import {
  fetchAdminProducts,
  fetchAdminCategories,
  createAdminProduct,
  updateAdminProduct,
  toggleAdminProductStatus,
  addAdminProductImage,
  removeAdminProductImage,
  setPrimaryAdminProductImage,
} from '@/services/admin-service';
import type {
  AdminProductDto,
  AdminCategoryDto,
  ProductAvailability,
  CreateProductInput,
  UpdateProductInput,
  AdminProductListQuery,
} from '@/types';
import { LoadingState, EmptyState, Badge, Pagination } from '@/components/ui';
import { formatPrice, getAvailabilityInfo } from '@/utils';

export function AdminProductsPage(): ReactNode {
  const [products, setProducts] = useState<AdminProductDto[]>([]);
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('');
  const [selectedActive, setSelectedActive] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('newest');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductDto | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formSku, setFormSku] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formShortDescription, setFormShortDescription] = useState<string>('');
  const [formPriceRupees, setFormPriceRupees] = useState<string>('');
  const [formCompareAtPriceRupees, setFormCompareAtPriceRupees] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formAvailability, setFormAvailability] = useState<ProductAvailability>('IN_STOCK');
  const [formStockQuantity, setFormStockQuantity] = useState<number>(1);
  const [formDimensions, setFormDimensions] = useState<string>('');
  const [formMaterial, setFormMaterial] = useState<string>('');
  const [formWeightGrams, setFormWeightGrams] = useState<string>('');
  const [formIsHandmade, setFormIsHandmade] = useState<boolean>(true);
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formMetaTitle, setFormMetaTitle] = useState<string>('');
  const [formMetaDescription, setFormMetaDescription] = useState<string>('');

  // Initial Image for Create
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formImageAlt, setFormImageAlt] = useState<string>('');

  // New Image for Edit Mode
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newImageAlt, setNewImageAlt] = useState<string>('');
  const [addingImage, setAddingImage] = useState<boolean>(false);

  // Load Categories for dropdowns
  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchAdminCategories();
      setCategories(data);
    } catch {
      // Non-critical, ignore
    }
  }, []);

  // Load Products with filters
  const loadProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const activeParam =
        selectedActive === 'true' ? true : selectedActive === 'false' ? false : undefined;

      const res = await fetchAdminProducts({
        page,
        pageSize,
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        availability: (selectedAvailability as ProductAvailability) || undefined,
        isActive: activeParam,
        sort: (selectedSort as AdminProductListQuery['sort']) || undefined,
      });

      setProducts(res.items);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    search,
    selectedCategory,
    selectedAvailability,
    selectedActive,
    selectedSort,
  ]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Open Modal for Create
  const handleOpenCreate = (): void => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('');
    setFormSlug('');
    setFormDescription('');
    setFormShortDescription('');
    setFormPriceRupees('');
    setFormCompareAtPriceRupees('');
    setFormCategoryId(categories[0]?.id || '');
    setFormAvailability('IN_STOCK');
    setFormStockQuantity(1);
    setFormDimensions('12 × 12 inches');
    setFormMaterial('Acrylic on stretched canvas');
    setFormWeightGrams('800');
    setFormIsHandmade(true);
    setFormIsFeatured(false);
    setFormIsActive(true);
    setFormMetaTitle('');
    setFormMetaDescription('');
    setFormImageUrl('');
    setFormImageAlt('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (prod: AdminProductDto): void => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSku(prod.sku);
    setFormSlug(prod.slug);
    setFormDescription(prod.description);
    setFormShortDescription(prod.shortDescription || '');
    setFormPriceRupees((prod.price / 100).toString());
    setFormCompareAtPriceRupees(prod.compareAtPrice ? (prod.compareAtPrice / 100).toString() : '');
    setFormCategoryId(prod.categoryId);
    setFormAvailability(prod.availability);
    setFormStockQuantity(prod.stockQuantity);
    setFormDimensions(prod.dimensions || '');
    setFormMaterial(prod.material || '');
    setFormWeightGrams(prod.weightGrams ? prod.weightGrams.toString() : '');
    setFormIsHandmade(prod.isHandmade);
    setFormIsFeatured(prod.isFeatured);
    setFormIsActive(prod.isActive);
    setFormMetaTitle(prod.metaTitle || '');
    setFormMetaDescription(prod.metaDescription || '');
    setNewImageUrl('');
    setNewImageAlt('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Toggle Product Active
  const handleToggleActive = async (prod: AdminProductDto): Promise<void> => {
    try {
      const updated = await toggleAdminProductStatus(prod.id, !prod.isActive);
      setProducts(prev => prev.map(p => (p.id === prod.id ? updated : p)));
      setSuccessMessage(
        `Product "${prod.name}" is now ${updated.isActive ? 'Active' : 'Deactivated'}.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product status.');
    }
  };

  // Submit Product Form
  const handleSubmitForm = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(formPriceRupees);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid price in rupees.');
      return;
    }
    const pricePaise = Math.round(priceNum * 100);

    let compareAtPricePaise: number | null = null;
    if (formCompareAtPriceRupees.trim()) {
      const compNum = parseFloat(formCompareAtPriceRupees);
      if (isNaN(compNum) || compNum < 0) {
        setFormError('Compare-at price must be a valid non-negative number.');
        return;
      }
      compareAtPricePaise = Math.round(compNum * 100);
    }

    if (!formCategoryId) {
      setFormError('Please select a valid category.');
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        const updatePayload: UpdateProductInput = {
          name: formName.trim(),
          sku: formSku.trim(),
          slug: formSlug.trim() || undefined,
          description: formDescription.trim(),
          shortDescription: formShortDescription.trim() || null,
          price: pricePaise,
          compareAtPrice: compareAtPricePaise,
          categoryId: formCategoryId,
          availability: formAvailability,
          stockQuantity: formStockQuantity,
          dimensions: formDimensions.trim() || null,
          material: formMaterial.trim() || null,
          weightGrams: formWeightGrams ? parseInt(formWeightGrams, 10) : null,
          isHandmade: formIsHandmade,
          isFeatured: formIsFeatured,
          isActive: formIsActive,
          metaTitle: formMetaTitle.trim() || null,
          metaDescription: formMetaDescription.trim() || null,
        };

        const updated = await updateAdminProduct(editingProduct.id, updatePayload);
        setProducts(prev => prev.map(p => (p.id === editingProduct.id ? updated : p)));
        setSuccessMessage(`Product "${updated.name}" updated successfully.`);
      } else {
        const createPayload: CreateProductInput = {
          name: formName.trim(),
          sku: formSku.trim(),
          slug: formSlug.trim() || undefined,
          description: formDescription.trim(),
          shortDescription: formShortDescription.trim() || undefined,
          price: pricePaise,
          compareAtPrice: compareAtPricePaise,
          categoryId: formCategoryId,
          availability: formAvailability,
          stockQuantity: formStockQuantity,
          dimensions: formDimensions.trim() || undefined,
          material: formMaterial.trim() || undefined,
          weightGrams: formWeightGrams ? parseInt(formWeightGrams, 10) : undefined,
          isHandmade: formIsHandmade,
          isFeatured: formIsFeatured,
          isActive: formIsActive,
          metaTitle: formMetaTitle.trim() || undefined,
          metaDescription: formMetaDescription.trim() || undefined,
          ...(formImageUrl.trim()
            ? {
                images: [
                  {
                    url: formImageUrl.trim(),
                    altText: formImageAlt.trim() || formName.trim(),
                    isPrimary: true,
                    displayOrder: 0,
                  },
                ],
              }
            : {}),
        };

        const created = await createAdminProduct(createPayload);
        setProducts(prev => [created, ...prev]);
        setSuccessMessage(`Product "${created.name}" created successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  // Add Image in Edit Mode
  const handleAddImage = async (): Promise<void> => {
    if (!editingProduct || !newImageUrl.trim()) return;
    setAddingImage(true);
    setFormError(null);
    try {
      const added = await addAdminProductImage(editingProduct.id, {
        url: newImageUrl.trim(),
        altText: newImageAlt.trim() || editingProduct.name,
        displayOrder: editingProduct.images.length,
      });

      const updatedProd = {
        ...editingProduct,
        images: [...editingProduct.images, added],
      };
      setEditingProduct(updatedProd);
      setProducts(prev => prev.map(p => (p.id === editingProduct.id ? updatedProd : p)));
      setNewImageUrl('');
      setNewImageAlt('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add image.');
    } finally {
      setAddingImage(false);
    }
  };

  // Remove Image in Edit Mode
  const handleRemoveImage = async (imageId: string): Promise<void> => {
    if (!editingProduct) return;
    try {
      await removeAdminProductImage(editingProduct.id, imageId);
      const updatedImages = editingProduct.images.filter(img => img.id !== imageId);
      const updatedProd = {
        ...editingProduct,
        images: updatedImages,
      };
      setEditingProduct(updatedProd);
      setProducts(prev => prev.map(p => (p.id === editingProduct.id ? updatedProd : p)));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to remove image.');
    }
  };

  // Set Primary Image in Edit Mode
  const handleSetPrimaryImage = async (imageId: string): Promise<void> => {
    if (!editingProduct) return;
    try {
      await setPrimaryAdminProductImage(editingProduct.id, imageId);
      const updatedImages = editingProduct.images.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      }));
      const updatedProd = {
        ...editingProduct,
        images: updatedImages,
      };
      setEditingProduct(updatedProd);
      setProducts(prev => prev.map(p => (p.id === editingProduct.id ? updatedProd : p)));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to set primary image.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-art-charcoal">
            Product Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Managing {totalItems} artworks in the sacred store catalog.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-art-ochre hover:bg-amber-600 text-art-charcoal font-semibold text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Artwork</span>
        </button>
      </div>

      {/* Success Notification Banner */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2">
            <label
              htmlFor="search-input"
              className="block text-xs font-semibold text-stone-600 mb-1"
            >
              Search by Name or SKU
            </label>
            <input
              id="search-input"
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
              htmlFor="category-select"
              className="block text-xs font-semibold text-stone-600 mb-1"
            >
              Category
            </label>
            <select
              id="category-select"
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
              htmlFor="availability-select"
              className="block text-xs font-semibold text-stone-600 mb-1"
            >
              Availability
            </label>
            <select
              id="availability-select"
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

          {/* Active Status Filter */}
          <div>
            <label
              htmlFor="active-select"
              className="block text-xs font-semibold text-stone-600 mb-1"
            >
              Catalog Status
            </label>
            <select
              id="active-select"
              value={selectedActive}
              onChange={e => {
                setSelectedActive(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-art-ochre bg-white"
            >
              <option value="all">All (Active & Hidden)</option>
              <option value="true">Active Only</option>
              <option value="false">Deactivated Only</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label
              htmlFor="sort-select"
              className="block text-xs font-semibold text-stone-600 mb-1"
            >
              Sort
            </label>
            <select
              id="sort-select"
              value={selectedSort}
              onChange={e => {
                setSelectedSort(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-art-ochre bg-white"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Table View */}
      {loading ? (
        <div className="py-16">
          <LoadingState message="Loading catalog artworks..." />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No Artworks Found"
          description="Try clearing filters or search terms, or add a new artwork to the store catalog."
          actionLabel="Create Product"
          onAction={handleOpenCreate}
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
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Stock & Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Catalog
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map(p => {
                  const avail = getAvailabilityInfo(p.availability);
                  const primaryImg = p.images.find(img => img.isPrimary) || p.images[0];

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          {primaryImg ? (
                            <img
                              src={primaryImg.url}
                              alt={primaryImg.altText || p.name}
                              className="w-10 h-10 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] text-stone-400 flex-shrink-0">
                              No Art
                            </div>
                          )}
                          <div className="truncate max-w-[200px] sm:max-w-[260px]">
                            <p className="font-semibold text-art-charcoal truncate" title={p.name}>
                              {p.name}
                            </p>
                            <p className="text-[11px] text-stone-500 font-mono truncate">
                              {p.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-stone-600">{p.sku}</td>

                      <td className="px-4 py-3.5 text-stone-600">{p.category.name}</td>

                      <td className="px-4 py-3.5 font-semibold text-art-charcoal">
                        {formatPrice(p.price)}
                        {p.compareAtPrice && (
                          <span className="block text-[11px] text-stone-400 line-through font-normal">
                            {formatPrice(p.compareAtPrice)}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2">
                          <Badge variant={avail.badgeVariant}>{avail.label}</Badge>
                          <span className="text-xs text-stone-500 font-mono">
                            ({p.stockQuantity})
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={p.isActive ? 'success' : 'stone'}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                            p.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-3xl w-full p-6 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h2 className="text-xl font-serif font-bold text-art-charcoal">
                {editingProduct ? 'Edit Artwork' : 'Create New Artwork'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Artwork Title *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Sacred Lotus Mandala"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={e => setFormSku(e.target.value)}
                    placeholder="e.g. MND-LOTUS-01"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre uppercase font-mono"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    value={formCategoryId}
                    onChange={e => setFormCategoryId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.isActive ? '' : '(Inactive)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slug (Optional) */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    URL Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={e => setFormSlug(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre font-mono text-xs"
                  />
                </div>

                {/* Price (in Rupees) */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Selling Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formPriceRupees}
                    onChange={e => setFormPriceRupees(e.target.value)}
                    placeholder="e.g. 1499.00"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Authoritative stored in integer paise.
                  </p>
                </div>

                {/* Compare-At Price (MRP) */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Compare-at MRP (₹ INR, Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCompareAtPriceRupees}
                    onChange={e => setFormCompareAtPriceRupees(e.target.value)}
                    placeholder="e.g. 1999.00"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                  />
                </div>

                {/* Availability */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Availability State *
                  </label>
                  <select
                    value={formAvailability}
                    onChange={e => setFormAvailability(e.target.value as ProductAvailability)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre bg-white"
                  >
                    <option value="IN_STOCK">In Stock (Tracked inventory)</option>
                    <option value="MADE_TO_ORDER">Made to Order (Craft on demand)</option>
                    <option value="SOLD_OUT">Sold Out</option>
                  </select>
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStockQuantity}
                    onChange={e => setFormStockQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                  />
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Dimensions (e.g. 12 × 12 inches)
                  </label>
                  <input
                    type="text"
                    value={formDimensions}
                    onChange={e => setFormDimensions(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                  />
                </div>

                {/* Material */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Material / Medium
                  </label>
                  <input
                    type="text"
                    value={formMaterial}
                    onChange={e => setFormMaterial(e.target.value)}
                    placeholder="e.g. Acrylic on stretched canvas"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                  />
                </div>

                {/* Weight in Grams */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Shipping Weight (Grams)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formWeightGrams}
                    onChange={e => setFormWeightGrams(e.target.value)}
                    placeholder="e.g. 800"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center space-x-6 pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsHandmade}
                      onChange={e => setFormIsHandmade(e.target.checked)}
                      className="rounded border-stone-300 text-art-ochre focus:ring-art-ochre h-4 w-4"
                    />
                    <span className="font-semibold text-stone-700">Handmade</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={e => setFormIsFeatured(e.target.checked)}
                      className="rounded border-stone-300 text-art-ochre focus:ring-art-ochre h-4 w-4"
                    />
                    <span className="font-semibold text-stone-700">Featured</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={e => setFormIsActive(e.target.checked)}
                      className="rounded border-stone-300 text-art-ochre focus:ring-art-ochre h-4 w-4"
                    />
                    <span className="font-semibold text-stone-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Short Summary (Catalog snippet)
                </label>
                <input
                  type="text"
                  value={formShortDescription}
                  onChange={e => setFormShortDescription(e.target.value)}
                  placeholder="One sentence summary of the artwork"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Full Artwork Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Detailed description of geometry, symbolism, materials, and care..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                />
              </div>

              {/* Initial Image Upload if Creating */}
              {!editingProduct && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <h3 className="font-semibold text-xs text-stone-700">Initial Primary Image</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-600 mb-1">Image URL</label>
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={e => setFormImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-600 mb-1">Alt Text</label>
                      <input
                        type="text"
                        value={formImageAlt}
                        onChange={e => setFormImageAlt(e.target.value)}
                        placeholder="Visual description for accessibility"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Image Gallery Manager if Editing */}
              {editingProduct && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                  <h3 className="font-semibold text-xs text-stone-700">Artwork Images & Gallery</h3>

                  {editingProduct.images.length === 0 ? (
                    <p className="text-xs text-stone-500 italic">No images currently uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {editingProduct.images.map(img => (
                        <div
                          key={img.id}
                          className="relative rounded-lg border border-stone-200 bg-white p-2 flex flex-col justify-between"
                        >
                          <img
                            src={img.url}
                            alt={img.altText || ''}
                            className="w-full h-24 object-cover rounded mb-2 border border-stone-100"
                          />
                          <div className="flex items-center justify-between text-[10px]">
                            {img.isPrimary ? (
                              <span className="bg-art-ochre text-art-charcoal font-bold px-1.5 py-0.5 rounded">
                                Primary
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(img.id)}
                                className="text-stone-600 hover:text-stone-900 underline"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(img.id)}
                              className="text-rose-600 hover:text-rose-900 font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Image Input */}
                  <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder="Add image URL..."
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-art-ochre"
                    />
                    <input
                      type="text"
                      placeholder="Alt text"
                      value={newImageAlt}
                      onChange={e => setNewImageAlt(e.target.value)}
                      className="sm:w-1/3 px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-art-ochre"
                    />
                    <button
                      type="button"
                      disabled={addingImage || !newImageUrl.trim()}
                      onClick={handleAddImage}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 text-white font-medium text-xs hover:bg-stone-900 disabled:opacity-50"
                    >
                      {addingImage ? 'Adding...' : 'Add Image'}
                    </button>
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-art-ochre hover:bg-amber-600 text-art-charcoal font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
