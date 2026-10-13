import { prisma } from '../db/prisma';
import type { Address } from '@prisma/client';
import type { CreateAddressInput, UpdateAddressInput } from '../types';

export class AddressRepository {
  async findByUserId(userId: string): Promise<Address[]> {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Address | null> {
    return prisma.address.findFirst({
      where: { id, userId },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.address.count({
      where: { userId },
    });
  }

  async createAddress(userId: string, data: CreateAddressInput): Promise<Address> {
    return prisma.$transaction(async tx => {
      const existingCount = await tx.address.count({
        where: { userId },
      });

      // If user has no existing addresses, this one must become default
      const shouldBeDefault = existingCount === 0 || data.isDefault === true;

      // If new address is default, unset default on other addresses
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          recipientName: data.recipientName,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 ?? null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country ?? 'India',
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async updateAddress(
    id: string,
    userId: string,
    data: UpdateAddressInput
  ): Promise<Address | null> {
    return prisma.$transaction(async tx => {
      const existing = await tx.address.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return null;
      }

      // If setting to default, clear default on other addresses
      if (data.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, id: { not: id }, isDefault: true },
          data: { isDefault: false },
        });
      }

      // If explicitly unsetting default on an address that was previously default:
      // Check if user has other addresses. If yes, promote the most recently updated other address
      // to maintain default address consistency.
      if (data.isDefault === false && existing.isDefault) {
        const otherAddress = await tx.address.findFirst({
          where: { userId, id: { not: id } },
          orderBy: { updatedAt: 'desc' },
        });
        if (otherAddress) {
          await tx.address.update({
            where: { id: otherAddress.id },
            data: { isDefault: true },
          });
        } else {
          // If this is the only address, preserve it as default
          data.isDefault = true;
        }
      }

      return tx.address.update({
        where: { id },
        data: {
          ...(data.recipientName !== undefined && { recipientName: data.recipientName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
          ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      });
    });
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    return prisma.$transaction(async tx => {
      const existing = await tx.address.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return false;
      }

      await tx.address.delete({
        where: { id },
      });

      // If deleted address was default, promote the newest remaining address to default
      if (existing.isDefault) {
        const remaining = await tx.address.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });

        if (remaining) {
          await tx.address.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }

      return true;
    });
  }

  async setDefaultAddress(id: string, userId: string): Promise<Address | null> {
    return prisma.$transaction(async tx => {
      const existing = await tx.address.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return null;
      }

      // Unset previous defaults
      await tx.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }
}

export const addressRepository = new AddressRepository();
