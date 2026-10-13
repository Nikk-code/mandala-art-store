import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Section, Button, Badge, LoadingState } from '@/components/ui';
import { AddressModal } from './AddressModal';
import { fetchAddresses, deleteAddress, setDefaultAddress } from '@/services/address-service';
import type { AddressDto } from '@/types';

export function SavedAddressesSection(): ReactNode {
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchAddresses();
      setAddresses(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load saved addresses.';
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
    setActionError(null);
  };

  const handleOpenEdit = (address: AddressDto) => {
    setEditingAddress(address);
    setIsModalOpen(true);
    setActionError(null);
  };

  const handleAddressSaved = (_savedAddress: AddressDto) => {
    setSuccessMessage(
      editingAddress
        ? 'Delivery address updated successfully.'
        : 'Delivery address added successfully.'
    );
    loadAddresses();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setActionError(null);
    setDeletingId(id);

    try {
      await deleteAddress(id);
      setSuccessMessage('Delivery address deleted successfully.');
      await loadAddresses();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete address.';
      setActionError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setActionError(null);
    try {
      await setDefaultAddress(id);
      setSuccessMessage('Default delivery address updated.');
      await loadAddresses();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set default address.';
      setActionError(msg);
    }
  };

  return (
    <Section className="rounded-2xl border border-art-stone bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-art-stone/60 pb-4 mb-6 gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-art-charcoal">
            Saved Delivery Addresses
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Manage your shipping destinations for streamlined artwork delivery.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleOpenAdd}
          className="self-start sm:self-auto text-xs py-2 px-3.5"
        >
          + Add New Address
        </Button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          className="mb-6 rounded-xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800 border border-emerald-200 flex items-center justify-between animate-fadeIn"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mb-6 rounded-xl bg-rose-50 p-4 text-xs font-medium text-rose-800 border border-rose-200 flex items-center justify-between animate-fadeIn"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-12">
          <LoadingState message="Loading your saved delivery addresses..." />
        </div>
      ) : fetchError ? (
        <div className="rounded-xl bg-rose-50 p-6 text-center border border-rose-200">
          <p className="text-xs font-medium text-rose-800 mb-3">{fetchError}</p>
          <Button variant="outline" onClick={loadAddresses} className="text-xs">
            Retry Loading Addresses
          </Button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-art-stone/80 bg-art-cream/20 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-art-ochre/10 text-art-ochre mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="font-serif text-sm font-bold text-art-charcoal mb-1">
            No saved addresses yet
          </h3>
          <p className="text-xs text-stone-500 mb-4 max-w-sm mx-auto">
            Add your residential or studio address to expedite checkout during authentic art
            purchases.
          </p>
          <Button variant="primary" onClick={handleOpenAdd} className="text-xs">
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-art-ochre/50 bg-art-cream/20 shadow-sm'
                  : 'border-art-stone bg-white hover:border-art-stone/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-serif text-sm font-bold text-art-charcoal">
                    {addr.recipientName}
                  </h3>
                  {addr.isDefault && <Badge variant="ochre">Default Address</Badge>}
                </div>

                <p className="text-xs text-stone-500 font-medium mb-2">📞 {addr.phone}</p>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  <br />
                  {addr.city}, {addr.state} — {addr.postalCode}
                  <br />
                  {addr.country}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-art-stone/40 flex items-center justify-between gap-2 text-xs">
                <div>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-art-ochre hover:text-amber-800 font-medium transition text-xs"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(addr)}
                    className="text-stone-600 hover:text-art-charcoal font-medium transition"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === addr.id}
                    onClick={() => handleDelete(addr.id)}
                    className="text-rose-600 hover:text-rose-800 font-medium transition disabled:opacity-50"
                  >
                    {deletingId === addr.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleAddressSaved}
        initialData={editingAddress}
      />
    </Section>
  );
}
