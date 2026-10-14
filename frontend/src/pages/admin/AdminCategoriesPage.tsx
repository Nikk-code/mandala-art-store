import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  toggleAdminCategoryStatus,
  deleteAdminCategory,
} from '@/services/admin-service';
import type { AdminCategoryDto, CreateCategoryInput, UpdateCategoryInput } from '@/types';
import { LoadingState, EmptyState, Badge } from '@/components/ui';

export function AdminCategoriesPage(): ReactNode {
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryDto | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Load Categories
  const loadCategories = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Open Create
  const handleOpenCreate = (): void => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormImageUrl('');
    setFormDisplayOrder(categories.length + 1);
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (cat: AdminCategoryDto): void => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormImageUrl(cat.imageUrl || '');
    setFormDisplayOrder(cat.displayOrder);
    setFormIsActive(cat.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Toggle Category Active with Dependency Safeguard Handling
  const handleToggleActive = async (cat: AdminCategoryDto): Promise<void> => {
    setError(null);
    try {
      const updated = await toggleAdminCategoryStatus(cat.id, !cat.isActive);
      setCategories(prev =>
        prev.map(c => (c.id === cat.id ? { ...c, isActive: updated.isActive } : c))
      );
      setSuccessMessage(
        `Category "${cat.name}" is now ${updated.isActive ? 'Active' : 'Deactivated'}.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update category status. Active products may depend on this category.'
      );
    }
  };

  // Delete Category with Dependency Safeguard Handling
  const handleDeleteCategory = async (cat: AdminCategoryDto): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    setError(null);
    try {
      await deleteAdminCategory(cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setSuccessMessage(`Category "${cat.name}" deleted successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Cannot delete category because existing products depend on it.'
      );
    }
  };

  // Submit Form
  const handleSubmitForm = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const payload: UpdateCategoryInput = {
          name: formName.trim(),
          slug: formSlug.trim() || undefined,
          description: formDescription.trim() || null,
          imageUrl: formImageUrl.trim() || null,
          displayOrder: formDisplayOrder,
          isActive: formIsActive,
        };

        const updated = await updateAdminCategory(editingCategory.id, payload);
        setCategories(prev =>
          prev.map(c => (c.id === editingCategory.id ? { ...c, ...updated } : c))
        );
        setSuccessMessage(`Category "${updated.name}" updated successfully.`);
      } else {
        const payload: CreateCategoryInput = {
          name: formName.trim(),
          slug: formSlug.trim() || undefined,
          description: formDescription.trim() || undefined,
          imageUrl: formImageUrl.trim() || undefined,
          displayOrder: formDisplayOrder,
          isActive: formIsActive,
        };

        const created = await createAdminCategory(payload);
        setCategories(prev => [...prev, created]);
        setSuccessMessage(`Category "${created.name}" created successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-art-charcoal">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Organize art collections, manage display hierarchy, and configure category media.
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
          <span>Create Category</span>
        </button>
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

      {/* Error Alert */}
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

      {/* Categories View */}
      {loading ? (
        <div className="py-16">
          <LoadingState message="Loading categories..." />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No Categories Available"
          description="Create your first art category to start organizing artworks."
          actionLabel="Create Category"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-art-ochre/60 transition-colors"
            >
              <div>
                {/* Thumbnail Header */}
                <div className="relative h-36 bg-stone-100 overflow-hidden">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                      No Header Image
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                    <Badge variant={cat.isActive ? 'success' : 'stone'}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-3 bg-stone-900/70 text-white text-[11px] px-2 py-0.5 rounded font-mono">
                    Order: {cat.displayOrder}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif font-bold text-lg text-art-charcoal">{cat.name}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {cat.productCount} {cat.productCount === 1 ? 'artwork' : 'artworks'}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-stone-500">/{cat.slug}</p>

                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleActive(cat)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                    cat.isActive
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title={
                    cat.productCount > 0 && cat.isActive
                      ? 'Dependent products will prevent deactivation'
                      : undefined
                  }
                >
                  {cat.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="text-xs font-semibold px-3 py-1.5 rounded bg-white border border-stone-300 hover:bg-stone-50 text-stone-700"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    disabled={cat.productCount > 0}
                    className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                      cat.productCount > 0
                        ? 'text-stone-300 cursor-not-allowed'
                        : 'text-rose-600 hover:bg-rose-50'
                    }`}
                    title={
                      cat.productCount > 0
                        ? 'Cannot delete category while artworks depend on it'
                        : 'Delete category'
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-xl font-serif font-bold text-art-charcoal">
                {editingCategory ? 'Edit Category' : 'Create Category'}
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
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Lippan Art"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Slug (Optional)</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={e => setFormSlug(e.target.value)}
                  placeholder="e.g. lippan-art (auto-generated if empty)"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={e => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={e => setFormDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                  />
                </div>

                <div className="flex items-center pt-5">
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

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Heritage mud-relief and mirror wall art..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-art-ochre"
                />
              </div>

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
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
