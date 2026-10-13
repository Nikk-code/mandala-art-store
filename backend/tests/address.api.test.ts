import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { addressRepository } from '../src/repositories/address.repository';
import { userRepository } from '../src/repositories/user.repository';
import { config } from '../src/config/env';
import { UserRole } from '@prisma/client';
import type { Address } from '@prisma/client';

describe('Address REST API Endpoints (/api/addresses)', () => {
  const customerAId = '11111111-1111-4111-8111-111111111111';
  const customerBId = '22222222-2222-4222-8222-222222222222';
  const addressAId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const addressBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const customerA = {
    id: customerAId,
    email: 'ananya@example.com',
    passwordHash: 'hashed',
    firstName: 'Ananya',
    lastName: 'Sharma',
    phone: '9876543210',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T12:00:00.000Z'),
    updatedAt: new Date('2026-10-05T12:00:00.000Z'),
  };

  const addressA: Address = {
    id: addressAId,
    userId: customerAId,
    recipientName: 'Ananya Sharma',
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

  const addressB: Address = {
    id: addressBId,
    userId: customerBId,
    recipientName: 'Karan Patel',
    phone: '9876543211',
    addressLine1: '456 Lotus Boulevard',
    addressLine2: null,
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380001',
    country: 'India',
    isDefault: true,
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
  };

  function createAuthToken(
    userId: string = customerAId,
    email: string = 'ananya@example.com'
  ): string {
    return jwt.sign({ id: userId, email, role: 'CUSTOMER' }, config.jwtSecret, {
      expiresIn: '7d',
      algorithm: 'HS256',
    });
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(userRepository, 'findById').mockResolvedValue(customerA);
  });

  describe('Authentication & Authorization Guards', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/addresses');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects access if user account has been deactivated', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue({
        ...customerA,
        isActive: false,
      });

      const token = createAuthToken();
      const res = await request(app).get('/api/addresses').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/addresses', () => {
    it('returns list of addresses for authenticated user', async () => {
      vi.spyOn(addressRepository, 'findByUserId').mockResolvedValue([addressA]);

      const token = createAuthToken();
      const res = await request(app).get('/api/addresses').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.addresses).toHaveLength(1);
      expect(res.body.data.addresses[0].id).toBe(addressAId);
      expect(res.body.data.addresses[0].recipientName).toBe('Ananya Sharma');
      expect(addressRepository.findByUserId).toHaveBeenCalledWith(customerAId);
    });
  });

  describe('POST /api/addresses', () => {
    it('creates a new address with valid inputs', async () => {
      vi.spyOn(addressRepository, 'createAddress').mockResolvedValue(addressA);

      const token = createAuthToken();
      const res = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipientName: 'Ananya Sharma',
          phone: '+91 9876543210',
          addressLine1: '123 Heritage Lane',
          addressLine2: 'Apt 4B',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.address.id).toBe(addressAId);
      expect(addressRepository.createAddress).toHaveBeenCalledWith(
        customerAId,
        expect.objectContaining({
          recipientName: 'Ananya Sharma',
          phone: '9876543210',
          postalCode: '302001',
        })
      );
    });

    it('rejects invalid PIN code with 400 Validation Error', async () => {
      const token = createAuthToken();
      const res = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipientName: 'Ananya Sharma',
          phone: '9876543210',
          addressLine1: '123 Heritage Lane',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '000000', // Invalid PIN
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid Indian mobile number with 400 Validation Error', async () => {
      const token = createAuthToken();
      const res = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipientName: 'Ananya Sharma',
          phone: '1234567890', // Must start with 6-9
          addressLine1: '123 Heritage Lane',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('derives user ID strictly from authentication and ignores client-supplied userId', async () => {
      vi.spyOn(addressRepository, 'createAddress').mockResolvedValue(addressA);

      const token = createAuthToken();
      const res = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: 'attacker-injected-id',
          recipientName: 'Ananya Sharma',
          phone: '9876543210',
          addressLine1: '123 Heritage Lane',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
        });

      expect(res.status).toBe(201);
      expect(addressRepository.createAddress).toHaveBeenCalledWith(
        customerAId, // Strictly verified from token!
        expect.anything()
      );
    });
  });

  describe('GET /api/addresses/:id', () => {
    it('returns address for owner', async () => {
      vi.spyOn(addressRepository, 'findByIdAndUserId').mockResolvedValue(addressA);

      const token = createAuthToken();
      const res = await request(app)
        .get(`/api/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.address.id).toBe(addressAId);
    });

    it('returns 404 Not Found when Customer A attempts to view Customer B address (anti-IDOR)', async () => {
      vi.spyOn(addressRepository, 'findByIdAndUserId').mockResolvedValue(null);

      const token = createAuthToken();
      const res = await request(app)
        .get(`/api/addresses/${addressBId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(addressRepository.findByIdAndUserId).toHaveBeenCalledWith(addressBId, customerAId);
    });
  });

  describe('PATCH /api/addresses/:id', () => {
    it('updates permitted fields for owner', async () => {
      const updated = { ...addressA, recipientName: 'Ananya S. Sharma' };
      vi.spyOn(addressRepository, 'updateAddress').mockResolvedValue(updated);

      const token = createAuthToken();
      const res = await request(app)
        .patch(`/api/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipientName: 'Ananya S. Sharma',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.address.recipientName).toBe('Ananya S. Sharma');
    });

    it('returns 404 Not Found when attempting to update another customer address (anti-IDOR)', async () => {
      vi.spyOn(addressRepository, 'updateAddress').mockResolvedValue(null);

      const token = createAuthToken();
      const res = await request(app)
        .patch(`/api/addresses/${addressBId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipientName: 'Malicious Update',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(addressRepository.updateAddress).toHaveBeenCalledWith(
        addressBId,
        customerAId,
        expect.anything()
      );
    });
  });

  describe('POST /api/addresses/:id/default', () => {
    it('sets address as default for owner', async () => {
      vi.spyOn(addressRepository, 'setDefaultAddress').mockResolvedValue(addressA);

      const token = createAuthToken();
      const res = await request(app)
        .post(`/api/addresses/${addressAId}/default`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.address.isDefault).toBe(true);
      expect(addressRepository.setDefaultAddress).toHaveBeenCalledWith(addressAId, customerAId);
    });

    it('returns 404 when setting default on another customer address (anti-IDOR)', async () => {
      vi.spyOn(addressRepository, 'setDefaultAddress').mockResolvedValue(null);

      const token = createAuthToken();
      const res = await request(app)
        .post(`/api/addresses/${addressBId}/default`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/addresses/:id', () => {
    it('deletes address for owner', async () => {
      vi.spyOn(addressRepository, 'deleteAddress').mockResolvedValue(true);

      const token = createAuthToken();
      const res = await request(app)
        .delete(`/api/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(addressRepository.deleteAddress).toHaveBeenCalledWith(addressAId, customerAId);
    });

    it('returns 404 when attempting to delete another customer address (anti-IDOR)', async () => {
      vi.spyOn(addressRepository, 'deleteAddress').mockResolvedValue(false);

      const token = createAuthToken();
      const res = await request(app)
        .delete(`/api/addresses/${addressBId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Concurrency & Invariant Hardening (409 Conflict)', () => {
    it('returns 409 Conflict when concurrent POST /api/addresses violates default constraint', async () => {
      const p2002Error = new Error('Unique constraint failed on addresses_user_default_unique_idx');
      (p2002Error as unknown as { code: string }).code = 'P2002';
      vi.spyOn(addressRepository, 'createAddress').mockRejectedValue(p2002Error);

      const token = createAuthToken();
      const res = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipientName: 'Ananya Sharma',
          phone: '9876543210',
          addressLine1: '123 Heritage Lane',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
          isDefault: true,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 409 Conflict when concurrent POST /api/addresses/:id/default violates default constraint', async () => {
      const p2002Error = new Error('Unique constraint failed on addresses_user_default_unique_idx');
      (p2002Error as unknown as { code: string }).code = 'P2002';
      vi.spyOn(addressRepository, 'setDefaultAddress').mockRejectedValue(p2002Error);

      const token = createAuthToken();
      const res = await request(app)
        .post(`/api/addresses/${addressAId}/default`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });
});
