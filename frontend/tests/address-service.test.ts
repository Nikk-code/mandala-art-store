import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/services/api-client';
import {
  fetchAddresses,
  fetchAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/services/address-service';
import type { AddressDto } from '@/types';

describe('Address Client Service', () => {
  const sampleAddress: AddressDto = {
    id: 'addr-1111-2222',
    userId: 'user-1111',
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
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchAddresses fetches customer addresses', async () => {
    vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: { addresses: [sampleAddress] },
    });

    const result = await fetchAddresses();
    expect(result).toEqual([sampleAddress]);
    expect(apiClient.apiGet).toHaveBeenCalledWith('addresses');
  });

  it('fetchAddressById fetches a single address by ID', async () => {
    vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: { address: sampleAddress },
    });

    const result = await fetchAddressById('addr-1111-2222');
    expect(result).toEqual(sampleAddress);
    expect(apiClient.apiGet).toHaveBeenCalledWith('addresses/addr-1111-2222');
  });

  it('createAddress sends new address payload', async () => {
    vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
      success: true,
      data: { address: sampleAddress },
    });

    const payload = {
      recipientName: 'Aarav Sharma',
      phone: '9876543210',
      addressLine1: '123 Heritage Lane',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302001',
    };

    const result = await createAddress(payload);
    expect(result).toEqual(sampleAddress);
    expect(apiClient.apiPost).toHaveBeenCalledWith('addresses', payload);
  });

  it('updateAddress sends patch payload', async () => {
    const updated = { ...sampleAddress, recipientName: 'Priya Sharma' };
    vi.spyOn(apiClient, 'apiPatch').mockResolvedValue({
      success: true,
      data: { address: updated },
    });

    const result = await updateAddress('addr-1111-2222', { recipientName: 'Priya Sharma' });
    expect(result).toEqual(updated);
    expect(apiClient.apiPatch).toHaveBeenCalledWith('addresses/addr-1111-2222', {
      recipientName: 'Priya Sharma',
    });
  });

  it('deleteAddress sends delete request', async () => {
    vi.spyOn(apiClient, 'apiDelete').mockResolvedValue({
      success: true,
      data: { message: 'Address deleted successfully.' },
    });

    await expect(deleteAddress('addr-1111-2222')).resolves.toBeUndefined();
    expect(apiClient.apiDelete).toHaveBeenCalledWith('addresses/addr-1111-2222');
  });

  it('setDefaultAddress sets address as default', async () => {
    vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
      success: true,
      data: { address: sampleAddress },
    });

    const result = await setDefaultAddress('addr-1111-2222');
    expect(result).toEqual(sampleAddress);
    expect(apiClient.apiPost).toHaveBeenCalledWith('addresses/addr-1111-2222/default', {});
  });
});
