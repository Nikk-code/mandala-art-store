import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SavedAddressesSection } from '@/components/account/SavedAddressesSection';
import * as addressService from '@/services/address-service';
import type { AddressDto } from '@/types';

describe('SavedAddressesSection Component', () => {
  const sampleAddresses: AddressDto[] = [
    {
      id: 'addr-1',
      userId: 'user-1',
      recipientName: 'Aarav Sharma',
      phone: '9876543210',
      addressLine1: '123 Heritage Lane',
      addressLine2: 'Apt 4B',
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
      addressLine2: null,
      city: 'Udaipur',
      state: 'Rajasthan',
      postalCode: '313001',
      country: 'India',
      isDefault: false,
      createdAt: '2026-10-02T10:00:00.000Z',
      updatedAt: '2026-10-02T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    vi.spyOn(addressService, 'fetchAddresses').mockReturnValue(new Promise(() => {}));

    render(<SavedAddressesSection />);
    expect(screen.getByText(/Loading your saved delivery addresses/i)).toBeInTheDocument();
  });

  it('renders empty state when customer has no saved addresses', async () => {
    vi.spyOn(addressService, 'fetchAddresses').mockResolvedValue([]);

    render(<SavedAddressesSection />);

    await waitFor(() => {
      expect(screen.getByText(/No saved addresses yet/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Add Your First Address/i)).toBeInTheDocument();
  });

  it('renders saved addresses with details and default badge', async () => {
    vi.spyOn(addressService, 'fetchAddresses').mockResolvedValue(sampleAddresses);

    render(<SavedAddressesSection />);

    await waitFor(() => {
      expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
    });
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText(/123 Heritage Lane/i)).toBeInTheDocument();
    expect(screen.getByText(/456 Royal Circle/i)).toBeInTheDocument();
    expect(screen.getByText('Default Address')).toBeInTheDocument();
    expect(screen.getByText('Set as Default')).toBeInTheDocument();
  });

  it('opens AddressModal when clicking Add New Address', async () => {
    vi.spyOn(addressService, 'fetchAddresses').mockResolvedValue(sampleAddresses);

    render(<SavedAddressesSection />);

    await waitFor(() => {
      expect(screen.getByText('+ Add New Address')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add New Address'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Delivery Address')).toBeInTheDocument();
  });

  it('deletes address and refreshes list when clicking Delete', async () => {
    vi.spyOn(addressService, 'fetchAddresses')
      .mockResolvedValueOnce(sampleAddresses)
      .mockResolvedValueOnce([sampleAddresses[0]]);
    vi.spyOn(addressService, 'deleteAddress').mockResolvedValue(undefined);

    render(<SavedAddressesSection />);

    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[1]); // Delete Priya Sharma's address

    await waitFor(() => {
      expect(addressService.deleteAddress).toHaveBeenCalledWith('addr-2');
    });
  });

  it('sets address as default when clicking Set as Default', async () => {
    vi.spyOn(addressService, 'fetchAddresses')
      .mockResolvedValueOnce(sampleAddresses)
      .mockResolvedValueOnce([
        { ...sampleAddresses[0], isDefault: false },
        { ...sampleAddresses[1], isDefault: true },
      ]);
    vi.spyOn(addressService, 'setDefaultAddress').mockResolvedValue({
      ...sampleAddresses[1],
      isDefault: true,
    });

    render(<SavedAddressesSection />);

    await waitFor(() => {
      expect(screen.getByText('Set as Default')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Set as Default'));

    await waitFor(() => {
      expect(addressService.setDefaultAddress).toHaveBeenCalledWith('addr-2');
    });
  });
});
