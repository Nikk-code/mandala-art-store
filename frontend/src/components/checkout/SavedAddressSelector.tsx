import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';
import type { AddressDto } from '@/types';

interface SavedAddressSelectorProps {
  addresses: AddressDto[];
  selectedAddressId: string | null;
  onSelectAddress: (address: AddressDto) => void;
  onUseNewAddress: () => void;
  disabled?: boolean;
}

export function SavedAddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onUseNewAddress,
  disabled = false,
}: SavedAddressSelectorProps): ReactNode {
  if (addresses.length === 0) return null;

  return (
    <div className="rounded-2xl border border-art-stone bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-art-stone/60 pb-3">
        <div>
          <h2 className="font-serif text-base font-bold text-art-charcoal">
            Saved Delivery Addresses
          </h2>
          <p className="text-xs text-stone-500">
            Select a verified delivery destination or enter a different address below.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onUseNewAddress}
          className={`text-xs font-semibold text-art-ochre hover:text-amber-800 transition py-1 self-start sm:self-auto ${
            selectedAddressId === null ? 'underline' : ''
          }`}
        >
          + Enter new address
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="Saved addresses"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {addresses.map(addr => {
          const isSelected = selectedAddressId === addr.id;

          return (
            <button
              key={addr.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelectAddress(addr)}
              className={`text-left rounded-xl p-4 border transition-all text-xs flex flex-col justify-between ${
                isSelected
                  ? 'border-art-ochre bg-art-ochre/10 shadow-sm ring-1 ring-art-ochre'
                  : 'border-art-stone bg-white hover:border-art-stone/80'
              } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
                        isSelected
                          ? 'border-art-ochre bg-art-ochre text-white'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                    <span className="font-serif font-bold text-art-charcoal text-xs">
                      {addr.recipientName}
                    </span>
                  </div>
                  {addr.isDefault && (
                    <Badge variant="ochre" className="text-[10px] py-0 px-2">
                      Default
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-stone-500 mb-1">📞 {addr.phone}</p>

                <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} —{' '}
                  {addr.postalCode}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
