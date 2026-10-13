import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedAddressSelector } from '@/components/checkout/SavedAddressSelector';
import type { AddressDto } from '@/types';

describe('SavedAddressSelector Component', () => {
  const sampleAddresses: AddressDto[] = [
    {
      id: 'addr-1',
      userId: 'user-1',
      recipientName: 'Aarav Sharma',
      phone: '9876543210',
      addressLine1: '123 Heritage Lane',
      addressLine2: null,
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302001',
      country: 'India',
      isDefault: true,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
    },
    {
      id: 'addr-2',
      userId: 'user-1',
      recipientName: 'Priya Sharma',
      phone: '9876543211',
      addressLine1: '456 Royal Circle',
      addressLine2: 'Block A',
      city: 'Udaipur',
      state: 'Rajasthan',
      postalCode: '313001',
      country: 'India',
      isDefault: false,
      createdAt: '2026-10-02T10:00:00.000Z',
      updatedAt: '2026-10-02T10:00:00.000Z',
    },
  ];

  it('renders nothing when address list is empty', () => {
    const { container } = render(
      <SavedAddressSelector
        addresses={[]}
        selectedAddressId={null}
        onSelectAddress={vi.fn()}
        onUseNewAddress={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders address cards with details and radios', () => {
    render(
      <SavedAddressSelector
        addresses={sampleAddresses}
        selectedAddressId="addr-1"
        onSelectAddress={vi.fn()}
        onUseNewAddress={vi.fn()}
      />
    );

    expect(screen.getByText('Saved Delivery Addresses')).toBeInTheDocument();
    expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('calls onSelectAddress when clicking an address card', () => {
    const handleSelect = vi.fn();
    render(
      <SavedAddressSelector
        addresses={sampleAddresses}
        selectedAddressId="addr-1"
        onSelectAddress={handleSelect}
        onUseNewAddress={vi.fn()}
      />
    );

    const priyaCard = screen.getByRole('radio', { name: /Priya Sharma/i });
    fireEvent.click(priyaCard);

    expect(handleSelect).toHaveBeenCalledWith(sampleAddresses[1]);
  });

  it('calls onUseNewAddress when clicking enter new address', () => {
    const handleNew = vi.fn();
    render(
      <SavedAddressSelector
        addresses={sampleAddresses}
        selectedAddressId="addr-1"
        onSelectAddress={vi.fn()}
        onUseNewAddress={handleNew}
      />
    );

    const newBtn = screen.getByText('+ Enter new address');
    fireEvent.click(newBtn);

    expect(handleNew).toHaveBeenCalled();
  });
});
