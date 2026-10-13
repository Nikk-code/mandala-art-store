import type { Address } from '@prisma/client';
import { AddressRepository, addressRepository } from '../repositories/address.repository';
import { NotFoundError, ConflictError } from '../errors';
import type { AddressDto } from '../types';
import {
  validateAddressId,
  validateCreateAddressInput,
  validateUpdateAddressInput,
} from '../utils/address-validation';

export class AddressService {
  constructor(private readonly repo: AddressRepository = addressRepository) {}

  private toAddressDto(address: Address): AddressDto {
    return {
      id: address.id,
      userId: address.userId,
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    };
  }

  private handleDatabaseError(error: unknown): never {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictError(
        'A conflicting default address operation occurred. Please refresh and try again.'
      );
    }
    throw error;
  }

  async getUserAddresses(userId: string): Promise<AddressDto[]> {
    const addresses = await this.repo.findByUserId(userId);
    return addresses.map(addr => this.toAddressDto(addr));
  }

  async getAddressById(id: string, userId: string): Promise<AddressDto> {
    const validId = validateAddressId(id);
    const address = await this.repo.findByIdAndUserId(validId, userId);

    if (!address) {
      throw new NotFoundError('Address not found.');
    }

    return this.toAddressDto(address);
  }

  async createAddress(userId: string, rawInput: unknown): Promise<AddressDto> {
    const validatedInput = validateCreateAddressInput(rawInput);
    try {
      const address = await this.repo.createAddress(userId, validatedInput);
      return this.toAddressDto(address);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async updateAddress(id: string, userId: string, rawInput: unknown): Promise<AddressDto> {
    const validId = validateAddressId(id);
    const validatedInput = validateUpdateAddressInput(rawInput);
    try {
      const updated = await this.repo.updateAddress(validId, userId, validatedInput);

      if (!updated) {
        throw new NotFoundError('Address not found.');
      }

      return this.toAddressDto(updated);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    const validId = validateAddressId(id);
    const deleted = await this.repo.deleteAddress(validId, userId);

    if (!deleted) {
      throw new NotFoundError('Address not found.');
    }
  }

  async setDefaultAddress(id: string, userId: string): Promise<AddressDto> {
    const validId = validateAddressId(id);
    try {
      const updated = await this.repo.setDefaultAddress(validId, userId);

      if (!updated) {
        throw new NotFoundError('Address not found.');
      }

      return this.toAddressDto(updated);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}

export const addressService = new AddressService();
