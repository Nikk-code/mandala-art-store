import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddressService } from '../src/services/address.service';
import { AddressRepository } from '../src/repositories/address.repository';
import { NotFoundError, ValidationError, ConflictError } from '../src/errors';
import type { Address } from '@prisma/client';

describe('AddressService Unit Tests', () => {
  const sampleUserId = '11111111-1111-4111-8111-111111111111';
  const sampleAddressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const sampleAddress: Address = {
    id: sampleAddressId,
    userId: sampleUserId,
    recipientName: 'Aarav Sharma',
    phone: '9876543210',
    addressLine1: '123 Heritage Lane',
    addressLine2: 'Apt 4B',
    city: 'Jaipur',
    state: 'Rajasthan',
    postalCode: '302001',
    country: 'India',
    isDefault: true,
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
  };

  let mockRepo: AddressRepository;
  let service: AddressService;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepo = new AddressRepository();
    service = new AddressService(mockRepo);
  });

  describe('getUserAddresses', () => {
    it('returns formatted AddressDto array for user', async () => {
      vi.spyOn(mockRepo, 'findByUserId').mockResolvedValue([sampleAddress]);

      const result = await service.getUserAddresses(sampleUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: sampleAddressId,
        userId: sampleUserId,
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
      });
    });
  });

  describe('getAddressById', () => {
    it('returns address DTO when address exists and belongs to user', async () => {
      vi.spyOn(mockRepo, 'findByIdAndUserId').mockResolvedValue(sampleAddress);

      const result = await service.getAddressById(sampleAddressId, sampleUserId);

      expect(result.id).toBe(sampleAddressId);
      expect(result.recipientName).toBe('Aarav Sharma');
    });

    it('throws NotFoundError if address does not exist or belongs to another user', async () => {
      vi.spyOn(mockRepo, 'findByIdAndUserId').mockResolvedValue(null);

      await expect(service.getAddressById(sampleAddressId, sampleUserId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('throws ValidationError if address ID format is invalid', async () => {
      await expect(service.getAddressById('invalid-uuid', sampleUserId)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('createAddress', () => {
    it('validates input and creates address', async () => {
      vi.spyOn(mockRepo, 'createAddress').mockResolvedValue(sampleAddress);

      const input = {
        recipientName: 'Aarav Sharma',
        phone: '+91 9876543210',
        addressLine1: '123 Heritage Lane',
        addressLine2: 'Apt 4B',
        city: 'Jaipur',
        state: 'Rajasthan',
        postalCode: '302001',
      };

      const result = await service.createAddress(sampleUserId, input);

      expect(result.id).toBe(sampleAddressId);
      expect(result.phone).toBe('9876543210');
      expect(mockRepo.createAddress).toHaveBeenCalledWith(
        sampleUserId,
        expect.objectContaining({
          recipientName: 'Aarav Sharma',
          phone: '9876543210',
          city: 'Jaipur',
        })
      );
    });

    it('rejects invalid inputs', async () => {
      await expect(
        service.createAddress(sampleUserId, {
          recipientName: 'A',
          phone: '1234',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateAddress', () => {
    it('updates address when valid input is provided', async () => {
      const updatedAddress = { ...sampleAddress, recipientName: 'Priya Sharma' };
      vi.spyOn(mockRepo, 'updateAddress').mockResolvedValue(updatedAddress);

      const result = await service.updateAddress(sampleAddressId, sampleUserId, {
        recipientName: 'Priya Sharma',
      });

      expect(result.recipientName).toBe('Priya Sharma');
      expect(mockRepo.updateAddress).toHaveBeenCalledWith(sampleAddressId, sampleUserId, {
        recipientName: 'Priya Sharma',
      });
    });

    it('throws NotFoundError if address not found during update', async () => {
      vi.spyOn(mockRepo, 'updateAddress').mockResolvedValue(null);

      await expect(
        service.updateAddress(sampleAddressId, sampleUserId, {
          city: 'Udaipur',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteAddress', () => {
    it('deletes address successfully', async () => {
      vi.spyOn(mockRepo, 'deleteAddress').mockResolvedValue(true);

      await expect(service.deleteAddress(sampleAddressId, sampleUserId)).resolves.toBeUndefined();

      expect(mockRepo.deleteAddress).toHaveBeenCalledWith(sampleAddressId, sampleUserId);
    });

    it('throws NotFoundError if address not found during delete', async () => {
      vi.spyOn(mockRepo, 'deleteAddress').mockResolvedValue(false);

      await expect(service.deleteAddress(sampleAddressId, sampleUserId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('setDefaultAddress', () => {
    it('sets address as default successfully', async () => {
      vi.spyOn(mockRepo, 'setDefaultAddress').mockResolvedValue(sampleAddress);

      const result = await service.setDefaultAddress(sampleAddressId, sampleUserId);

      expect(result.id).toBe(sampleAddressId);
      expect(result.isDefault).toBe(true);
      expect(mockRepo.setDefaultAddress).toHaveBeenCalledWith(sampleAddressId, sampleUserId);
    });

    it('throws NotFoundError if address not found when setting default', async () => {
      vi.spyOn(mockRepo, 'setDefaultAddress').mockResolvedValue(null);

      await expect(service.setDefaultAddress(sampleAddressId, sampleUserId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('throws ConflictError if P2002 unique constraint violation occurs concurrently', async () => {
      const p2002Error = new Error('Unique constraint failed');
      (p2002Error as unknown as { code: string }).code = 'P2002';
      vi.spyOn(mockRepo, 'setDefaultAddress').mockRejectedValue(p2002Error);

      await expect(service.setDefaultAddress(sampleAddressId, sampleUserId)).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('concurrency and database invariant handling', () => {
    it('throws ConflictError when createAddress encounters P2002 unique default constraint violation', async () => {
      const p2002Error = new Error('Unique constraint failed on addresses_user_default_unique_idx');
      (p2002Error as unknown as { code: string }).code = 'P2002';
      vi.spyOn(mockRepo, 'createAddress').mockRejectedValue(p2002Error);

      const input = {
        recipientName: 'Aarav Sharma',
        phone: '9876543210',
        addressLine1: '123 Heritage Lane',
        city: 'Jaipur',
        state: 'Rajasthan',
        postalCode: '302001',
      };

      await expect(service.createAddress(sampleUserId, input)).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError when updateAddress encounters P2002 unique default constraint violation', async () => {
      const p2002Error = new Error('Unique constraint failed on addresses_user_default_unique_idx');
      (p2002Error as unknown as { code: string }).code = 'P2002';
      vi.spyOn(mockRepo, 'updateAddress').mockRejectedValue(p2002Error);

      await expect(
        service.updateAddress(sampleAddressId, sampleUserId, { isDefault: true })
      ).rejects.toThrow(ConflictError);
    });
  });
});
