import type { ReactNode } from 'react';
import { Input } from '@/components/ui';
import type { CheckoutFormData, CheckoutFormErrors } from '@/types';

export interface ContactInfoSectionProps {
  formData: CheckoutFormData;
  errors: CheckoutFormErrors;
  onChange: (field: keyof CheckoutFormData, value: string) => void;
  disabled?: boolean;
}

export function ContactInfoSection({
  formData,
  errors,
  onChange,
  disabled = false,
}: ContactInfoSectionProps): ReactNode {
  return (
    <div className="rounded-2xl border border-art-stone bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-art-stone/60 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-art-ochre">
            Step 1 of 2
          </span>
          <h2 className="font-serif text-lg font-bold text-art-charcoal">Contact Information</h2>
        </div>
        <span className="text-xs text-stone-500 font-medium">Guest Checkout</span>
      </div>

      <p className="text-xs text-stone-600">
        We will send your order confirmation, crafting timeline updates, and courier tracking
        details to this contact.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            id="fullName"
            name="fullName"
            label="Full Name"
            placeholder="e.g. Radhika Sharma"
            value={formData.fullName}
            error={errors.fullName}
            onChange={e => onChange('fullName', e.target.value)}
            required
            autoComplete="name"
            disabled={disabled}
          />
        </div>

        <div>
          <Input
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="radhika@example.com"
            value={formData.email}
            error={errors.email}
            onChange={e => onChange('email', e.target.value)}
            required
            autoComplete="email"
            disabled={disabled}
            helperText="Order receipt will be sent here"
          />
        </div>

        <div>
          <Input
            id="phone"
            name="phone"
            type="tel"
            label="Phone Number"
            placeholder="9876543210"
            value={formData.phone}
            error={errors.phone}
            onChange={e => onChange('phone', e.target.value)}
            required
            autoComplete="tel"
            disabled={disabled}
            helperText="For courier delivery coordination"
          />
        </div>
      </div>
    </div>
  );
}
