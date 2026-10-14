import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../src/app';
import { userRepository } from '../src/repositories/user.repository';
import { config } from '../src/config/env';

describe('Admin REST API Endpoints (/api/admin)', () => {
  const adminUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const customerUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  const sampleAdmin = {
    id: adminUserId,
    email: 'admin@mandala.test',
    passwordHash: 'secret_hash_not_exposed',
    firstName: 'Meera',
    lastName: 'Deshmukh',
    phone: '9876543210',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
  };

  const sampleCustomer = {
    id: customerUserId,
    email: 'customer@mandala.test',
    passwordHash: 'customer_secret_hash',
    firstName: 'Rohan',
    lastName: 'Verma',
    phone: '9123456780',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T10:00:00.000Z'),
    updatedAt: new Date('2026-10-05T10:00:00.000Z'),
  };

  function createToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/admin/dashboard', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/dashboard');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects tampered or forged JWT signature with 401 Unauthorized', async () => {
      const forgedToken = jwt.sign(
        { id: adminUserId, email: sampleAdmin.email, role: 'ADMIN' },
        'wrong_secret_signature'
      );

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects authenticated CUSTOMER with 403 Forbidden', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleCustomer);

      const customerToken = createToken({
        id: customerUserId,
        email: sampleCustomer.email,
        role: 'CUSTOMER',
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('Administrator access required');
    });

    it('rejects customer even if role: ADMIN is injected in query or body', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleCustomer);

      const customerToken = createToken({
        id: customerUserId,
        email: sampleCustomer.email,
        role: 'CUSTOMER',
      });

      const res = await request(app)
        .get('/api/admin/dashboard?role=ADMIN')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects deactivated administrator with 401 Unauthorized', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue({
        ...sampleAdmin,
        isActive: false,
      });

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('deactivated');
    });

    it('successfully returns dashboard metadata to authenticated ADMIN via Authorization header', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin).toEqual({
        id: adminUserId,
        email: 'admin@mandala.test',
        firstName: 'Meera',
        lastName: 'Deshmukh',
        role: 'ADMIN',
      });
      expect(res.body.data.system).toBeDefined();
      expect(res.body.data.system.environment).toBe(config.nodeEnv);
      expect(Array.isArray(res.body.data.modules)).toBe(true);
      expect(res.body.data.modules.length).toBeGreaterThan(0);

      // Verify no passwords, hashes, or secrets are leaked
      expect(res.body.data.admin.passwordHash).toBeUndefined();
      expect(res.body.data.admin.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('secret_hash_not_exposed');
    });

    it('successfully returns dashboard metadata to authenticated ADMIN via HttpOnly cookie', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);

      const adminToken = createToken({
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `auth_token=${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.role).toBe('ADMIN');
    });
  });
});
