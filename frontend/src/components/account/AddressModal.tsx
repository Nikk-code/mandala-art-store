import { useState, useEffect } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Input, Button } from '@/components/ui';
import { createAddress, updateAddress } from '@/services/address-service';
import type { AddressDto, AddressFormData, AddressFormErrors } from '@/types';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (address: AddressDto) => void;
  initialData?: AddressDto | null;
}

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const INDIAN_PIN_REGEX = /^[1-9][0-9]{5}$/;

export function AddressModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
}: AddressModalProps): ReactNode {
  const [formData, setFormData] = useState<AddressFormData>({
    recipientName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState<AddressFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        recipientName: initialData.recipientName,
        phone: initialData.phone,
        addressLine1: initialData.addressLine1,
        addressLine2: initialData.addressLine2 ?? '',
        city: initialData.city,
        state: initialData.state,
        postalCode: initialData.postalCode,
        isDefault: initialData.isDefault,
      });
    } else {
      setFormData({
        recipientName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        isDefault: false,
      });
    }
    setErrors({});
    setApiError(null);
  }, [initialData, isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const nextErrors: AddressFormErrors = {};

    if (!formData.recipientName.trim()) {
      nextErrors.recipientName = 'Recipient name is required';
    } else if (formData.recipientName.trim().length < 2) {
      nextErrors.recipientName = 'Recipient name must be at least 2 characters';
    }

    const cleanedPhone = formData.phone
      .trim()
      .replace(/[\s\-()]/g, '')
      .replace(/^(?:\+91|0)/, '');
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required';
    } else if (!INDIAN_PHONE_REGEX.test(cleanedPhone)) {
      nextErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (!formData.addressLine1.trim()) {
      nextErrors.addressLine1 = 'Address line 1 is required';
    } else if (formData.addressLine1.trim().length < 5) {
      nextErrors.addressLine1 = 'Address line 1 must be at least 5 characters';
    }

    if (!formData.city.trim()) {
      nextErrors.city = 'City is required';
    } else if (formData.city.trim().length < 2) {
      nextErrors.city = 'City must be at least 2 characters';
    }

    if (!formData.state.trim()) {
      nextErrors.state = 'State is required';
    } else if (formData.state.trim().length < 2) {
      nextErrors.state = 'State must be at least 2 characters';
    }

    const pin = formData.postalCode.trim();
    if (!pin) {
      nextErrors.postalCode = 'PIN code is required';
    } else if (!INDIAN_PIN_REGEX.test(pin)) {
      nextErrors.postalCode = 'Please enter a valid 6-digit Indian PIN code';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      let saved: AddressDto;
      const cleanedPhone = formData.phone
        .trim()
        .replace(/[\s\-()]/g, '')
        .replace(/^(?:\+91|0)/, '');

      if (initialData) {
        saved = await updateAddress(initialData.id, {
          recipientName: formData.recipientName.trim(),
          phone: cleanedPhone,
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || null,
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          isDefault: formData.isDefault,
        });
      } else {
        saved = await createAddress({
          recipientName: formData.recipientName.trim(),
          phone: cleanedPhone,
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || null,
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          isDefault: formData.isDefault,
        });
      }

      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save address. Please try again.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-art-stone max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-art-stone/60 pb-4 mb-6">
          <h2 id="address-modal-title" className="font-serif text-xl font-bold text-art-charcoal">
            {initialData ? 'Edit Delivery Address' : 'Add Delivery Address'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-stone-400 hover:text-art-charcoal hover:bg-art-stone/30 transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {apiError && (
          <div
            role="alert"
            className="mb-6 rounded-xl bg-rose-50 p-4 text-xs font-medium text-rose-800 border border-rose-200"
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="recipientName"
              label="Recipient Name"
              required
              value={formData.recipientName}
              onChange={e => {
                setFormData(p => ({ ...p, recipientName: e.target.value }));
                if (errors.recipientName) setErrors(p => ({ ...p, recipientName: undefined }));
              }}
              error={errors.recipientName}
              placeholder="e.g. Priya Sharma"
            />
            <Input
              id="phone"
              label="Phone Number"
              type="tel"
              required
              value={formData.phone}
              onChange={e => {
                setFormData(p => ({ ...p, phone: e.target.value }));
                if (errors.phone) setErrors(p => ({ ...p, phone: undefined }));
              }}
              error={errors.phone}
              placeholder="10-digit mobile"
            />
          </div>

          <Input
            id="addressLine1"
            label="Street Address / House No."
            required
            value={formData.addressLine1}
            onChange={e => {
              setFormData(p => ({ ...p, addressLine1: e.target.value }));
              if (errors.addressLine1) setErrors(p => ({ ...p, addressLine1: undefined }));
            }}
            error={errors.addressLine1}
            placeholder="e.g. 42 Art Studio Road, Heritage Heights"
          />

          <Input
            id="addressLine2"
            label="Apartment, Suite, Landmark (Optional)"
            value={formData.addressLine2}
            onChange={e => setFormData(p => ({ ...p, addressLine2: e.target.value }))}
            error={errors.addressLine2}
            placeholder="e.g. Near City Palace, Block B"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="city"
              label="City"
              required
              value={formData.city}
              onChange={e => {
                setFormData(p => ({ ...p, city: e.target.value }));
                if (errors.city) setErrors(p => ({ ...p, city: undefined }));
              }}
              error={errors.city}
              placeholder="e.g. Jaipur"
            />
            <Input
              id="state"
              label="State"
              required
              value={formData.state}
              onChange={e => {
                setFormData(p => ({ ...p, state: e.target.value }));
                if (errors.state) setErrors(p => ({ ...p, state: undefined }));
              }}
              error={errors.state}
              placeholder="e.g. Rajasthan"
            />
            <Input
              id="postalCode"
              label="PIN Code"
              required
              maxLength={6}
              value={formData.postalCode}
              onChange={e => {
                setFormData(p => ({ ...p, postalCode: e.target.value }));
                if (errors.postalCode) setErrors(p => ({ ...p, postalCode: undefined }));
              }}
              error={errors.postalCode}
              placeholder="6-digit PIN"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={e => setFormData(p => ({ ...p, isDefault: e.target.checked }))}
                className="h-4 w-4 rounded border-art-stone text-art-ochre focus:ring-art-ochre cursor-pointer"
              />
              <span className="text-xs font-semibold text-art-charcoal">
                Set as default delivery address
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-art-stone/60">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
