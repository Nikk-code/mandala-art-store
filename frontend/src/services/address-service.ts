import { apiGet, apiPost, apiPatch, apiDelete } from './api-client';
import type {
  AddressDto,
  CreateAddressInput,
  UpdateAddressInput,
  ApiSuccessResponse,
} from '@/types';

export async function fetchAddresses(): Promise<AddressDto[]> {
  const response = await apiGet<ApiSuccessResponse<{ addresses: AddressDto[] }>>('addresses');
  return response.data.addresses;
}

export async function fetchAddressById(id: string): Promise<AddressDto> {
  const response = await apiGet<ApiSuccessResponse<{ address: AddressDto }>>(`addresses/${id}`);
  return response.data.address;
}

export async function createAddress(data: CreateAddressInput): Promise<AddressDto> {
  const response = await apiPost<ApiSuccessResponse<{ address: AddressDto }>>('addresses', data);
  return response.data.address;
}

export async function updateAddress(id: string, data: UpdateAddressInput): Promise<AddressDto> {
  const response = await apiPatch<ApiSuccessResponse<{ address: AddressDto }>>(
    `addresses/${id}`,
    data
  );
  return response.data.address;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiDelete<ApiSuccessResponse<{ message: string }>>(`addresses/${id}`);
}

export async function setDefaultAddress(id: string): Promise<AddressDto> {
  const response = await apiPost<ApiSuccessResponse<{ address: AddressDto }>>(
    `addresses/${id}/default`,
    {}
  );
  return response.data.address;
}
