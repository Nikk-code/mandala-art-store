import type { ReactNode } from 'react';
import { Input } from '@/components/ui';
import type { CheckoutFormData, CheckoutFormErrors } from '@/types';

export interface ShippingAddressSectionProps {
  formData: CheckoutFormData;
  errors: CheckoutFormErrors;
  onChange: (field: keyof CheckoutFormData, value: string) => void;
  disabled?: boolean;
}

export function ShippingAddressSection({
  formData,
  errors,
  onChange,
  disabled = false,
}: ShippingAddressSectionProps): ReactNode {
  return (
    <div className="rounded-2xl border border-art-stone bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-art-stone/60 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-art-ochre">
            Step 2 of 2
          </span>
          <h2 className="font-serif text-lg font-bold text-art-charcoal">
            Shipping & Art Delivery Address
          </h2>
        </div>
        <span className="text-xs text-stone-500 font-medium">Pan-India Delivery</span>
      </div>

      <p className="text-xs text-stone-600">
        All original artworks are packaged in custom shock-absorbing reinforced wooden crates for
        safe transit.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            id="addressLine1"
            name="addressLine1"
            label="Street Address / House No. / Apartment"
            placeholder="e.g. 402, Lotus Heritage Apartments, MG Road"
            value={formData.addressLine1}
            error={errors.addressLine1}
            onChange={e => onChange('addressLine1', e.target.value)}
            required
            autoComplete="street-address"
            disabled={disabled}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            id="addressLine2"
            name="addressLine2"
            label="Apartment, Suite, Landmark (Optional)"
            placeholder="e.g. Near Shanti Stupa, Behind Central Park"
            value={formData.addressLine2}
            error={errors.addressLine2}
            onChange={e => onChange('addressLine2', e.target.value)}
            autoComplete="address-line2"
            disabled={disabled}
          />
        </div>

        <div>
          <Input
            id="city"
            name="city"
            label="City / Town"
            placeholder="e.g. Ahmedabad"
            value={formData.city}
            error={errors.city}
            onChange={e => onChange('city', e.target.value)}
            required
            autoComplete="address-level2"
            disabled={disabled}
          />
        </div>

        <div>
          <Input
            id="state"
            name="state"
            label="State"
            placeholder="e.g. Gujarat"
            value={formData.state}
            error={errors.state}
            onChange={e => onChange('state', e.target.value)}
            required
            autoComplete="address-level1"
            disabled={disabled}
          />
        </div>

        <div>
          <Input
            id="postalCode"
            name="postalCode"
            label="PIN / Postal Code"
            placeholder="380015"
            value={formData.postalCode}
            error={errors.postalCode}
            onChange={e => onChange('postalCode', e.target.value)}
            required
            autoComplete="postal-code"
            disabled={disabled}
            helperText="6-digit Indian PIN code"
          />
        </div>

        <div>
          <Input
            id="country"
            name="country"
            label="Country"
            value={formData.country || 'India'}
            readOnly
            disabled
            autoComplete="country-name"
            helperText="Currently delivering across India"
          />
        </div>
      </div>
    </div>
  );
}
