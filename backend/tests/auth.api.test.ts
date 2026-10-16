import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { userRepository } from '../src/repositories/user.repository';
import { config } from '../src/config/env';
import { UserRole } from '@prisma/client';

describe('Auth REST API Endpoints (/api/auth)', () => {
  const sampleUserId = '11111111-1111-4111-8111-111111111111';
  const samplePassword = 'StrongPassword123';
  let sampleHashedPassword = '';

  const sampleUser = {
    id: sampleUserId,
    email: 'ananya@example.com',
    passwordHash: '',
    firstName: 'Ananya',
    lastName: 'Sharma',
    phone: '9876543210',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T12:00:00.000Z'),
    updatedAt: new Date('2026-10-05T12:00:00.000Z'),
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    sampleHashedPassword = await bcrypt.hash(samplePassword, 10);
    sampleUser.passwordHash = sampleHashedPassword;
  });

  describe('POST /api/auth/register', () => {
    it('successfully registers a new customer with valid inputs', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(userRepository, 'create').mockResolvedValue(sampleUser);

      const res = await request(app).post('/api/auth/register').send({
        name: 'Ananya Sharma',
        email: 'ANANYA@Example.com',
        password: samplePassword,
        phone: '9876543210',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(sampleUserId);
      expect(res.body.data.user.email).toBe('ananya@example.com');
      expect(res.body.data.user.firstName).toBe('Ananya');
      expect(res.body.data.user.lastName).toBe('Sharma');
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.password).toBeUndefined();

      // Verify Set-Cookie header contains HttpOnly auth_token
      const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(cookies?.some(c => c.includes('auth_token='))).toBe(true);
      expect(cookies?.some(c => c.includes('HttpOnly'))).toBe(true);
    });

    it('normalizes email to lowercase and trims whitespace', async () => {
      const findSpy = vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      const createSpy = vi.spyOn(userRepository, 'create').mockResolvedValue(sampleUser);

      const res = await request(app).post('/api/auth/register').send({
        name: 'Ananya Sharma',
        email: '  ANANYA@Example.COM  ',
        password: samplePassword,
      });

      expect(res.status).toBe(201);
      expect(findSpy).toHaveBeenCalledWith('ananya@example.com');
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ananya@example.com',
          role: UserRole.CUSTOMER,
        })
      );
    });

    it('rejects duplicate email with 409 Conflict', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(sampleUser);

      const res = await request(app).post('/api/auth/register').send({
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
        password: samplePassword,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already exists');
    });

    it('rejects short passwords (< 8 characters) with 400 Validation Error', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid email formats with 400 Validation Error', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Ananya Sharma',
        email: 'invalid-email-format',
        password: samplePassword,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('prevents privilege escalation by ignoring client-submitted role: ADMIN', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      const createSpy = vi.spyOn(userRepository, 'create').mockResolvedValue(sampleUser);

      const res = await request(app).post('/api/auth/register').send({
        name: 'Malicious User',
        email: 'malicious@example.com',
        password: samplePassword,
        role: 'ADMIN',
      });

      expect(res.status).toBe(201);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CUSTOMER,
        })
      );
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates customer with valid credentials and sets session cookie', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(sampleUser);

      const res = await request(app).post('/api/auth/login').send({
        email: 'ananya@example.com',
        password: samplePassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(sampleUserId);
      expect(res.body.data.user.email).toBe('ananya@example.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();

      const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(cookies?.some(c => c.includes('auth_token='))).toBe(true);
    });

    it('returns generic 401 Unauthorized for incorrect password (no password hash leakage)', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(sampleUser);

      const res = await request(app).post('/api/auth/login').send({
        email: 'ananya@example.com',
        password: 'WrongPassword999',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid email or password.');
    });

    it('returns the same generic 401 Unauthorized for non-existent email (prevents enumeration)', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: samplePassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid email or password.');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns authenticated customer profile when valid JWT is provided in Bearer header', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);

      const token = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(sampleUserId);
      expect(res.body.data.user.email).toBe('ananya@example.com');
      expect(res.body.data.user.firstName).toBe('Ananya');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('returns authenticated customer profile when valid session cookie is provided', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);

      const token = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(sampleUserId);
    });

    it('rejects unauthenticated request to /me with 401', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects tampered JWT signature with 401', async () => {
      const forgedToken = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        'different_tampered_secret_key'
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects expired JWT token with 401', async () => {
      const expiredToken = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects JWT with missing or empty claims with 401', async () => {
      const invalidClaimToken = jwt.sign({ id: '', email: '' }, config.jwtSecret, {
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidClaimToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects access if user account has been deactivated in the database', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue({
        ...sampleUser,
        isActive: false,
      });

      const token = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PATCH /api/auth/me', () => {
    it('successfully updates permitted customer profile fields and returns sanitized user', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
      vi.spyOn(userRepository, 'update').mockResolvedValue({
        ...sampleUser,
        firstName: 'AnanyaUpdated',
        lastName: 'SharmaUpdated',
        phone: '9876543210',
      });

      const token = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'AnanyaUpdated',
          lastName: 'SharmaUpdated',
          phone: '9876543210',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.firstName).toBe('AnanyaUpdated');
      expect(res.body.data.user.lastName).toBe('SharmaUpdated');
      expect(res.body.data.user.phone).toBe('9876543210');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('strips and prevents modification of protected fields (role, passwordHash, email, id)', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepository, 'update').mockResolvedValue({
        ...sampleUser,
        firstName: 'NewFirst',
      });

      const token = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'NewFirst',
          role: 'ADMIN',
          passwordHash: 'injected_hash',
          email: 'newemail@evil.com',
          id: 'other-user-uuid',
          isActive: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Ensure update called ONLY with verified user ID and allowed fields
      expect(updateSpy).toHaveBeenCalledWith(sampleUserId, {
        firstName: 'NewFirst',
      });
    });

    it('rejects unauthenticated request to PATCH /me with 401', async () => {
      const res = await request(app).patch('/api/auth/me').send({ firstName: 'Anon' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects tampered JWT signature with 401', async () => {
      const forgedToken = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        'tampered_key'
      );

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`)
        .send({ firstName: 'Tampered' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects update if user account has been deactivated in the database', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue({
        ...sampleUser,
        isActive: false,
      });

      const token = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Deactivated' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid input payloads with 400 Validation Error', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);

      const token = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      // Empty payload
      const res1 = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res1.status).toBe(400);

      // Invalid phone format
      const res2 = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '123' });
      expect(res2.status).toBe(400);
    });

    it('ensures Customer A cannot update Customer B profile through client identity spoofing', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepository, 'update').mockResolvedValue({
        ...sampleUser,
        firstName: 'LegitCustomerA',
      });

      const customerAToken = jwt.sign(
        { id: sampleUserId, email: 'customerA@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const victimId = '99999999-9999-4999-8999-999999999999';

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          id: victimId,
          userId: victimId,
          firstName: 'LegitCustomerA',
        });

      expect(res.status).toBe(200);
      // Must update Customer A (sampleUserId) only, never victimId
      expect(updateSpy).toHaveBeenCalledWith(sampleUserId, {
        firstName: 'LegitCustomerA',
      });
      expect(updateSpy).not.toHaveBeenCalledWith(victimId, expect.anything());
    });
  });

  describe('CORS and Origin Security', () => {
    it('does not set Access-Control-Allow-Origin for untrusted origins', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Origin', 'http://malicious-site.example.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('sets Access-Control-Allow-Origin for configured trusted origin', async () => {
      const res = await request(app).get('/api/auth/me').set('Origin', config.corsOrigin);

      expect(res.headers['access-control-allow-origin']).toBe(config.corsOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears auth_token cookie and returns 200', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully.');

      const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(
        cookies?.some(
          c => c.includes('auth_token=;') || c.includes('Max-Age=0') || c.includes('expires=')
        )
      ).toBe(true);
    });
  });

  describe('POST /api/auth/change-password', () => {
    const validNewPassword = 'BrandNewPassword123';
    let customerAuthToken = '';

    beforeEach(() => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
      customerAuthToken = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );
    });

    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/auth/change-password').send({
        currentPassword: samplePassword,
        newPassword: validNewPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects tampered or forged JWT tokens with 401 Unauthorized', async () => {
      const forgedToken = jwt.sign(
        { id: sampleUserId, email: 'ananya@example.com', role: 'CUSTOMER' },
        'invalid_signature_secret'
      );

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${forgedToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: validNewPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('successfully changes password when current password matches, returning 200 without exposing hash', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepository, 'update').mockResolvedValue(sampleUser);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: validNewPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password changed successfully.');
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.newPassword).toBeUndefined();
      expect(res.body.data).toBeUndefined();

      expect(updateSpy).toHaveBeenCalledWith(
        sampleUserId,
        expect.objectContaining({
          passwordHash: expect.any(String),
        })
      );
      const updatedHash = updateSpy.mock.calls[0][1].passwordHash as string;
      expect(await bcrypt.compare(validNewPassword, updatedHash)).toBe(true);
    });

    it('the new password works with login and old password no longer authenticates', async () => {
      let currentStoredUser = { ...sampleUser };

      vi.spyOn(userRepository, 'findById').mockImplementation(async () => currentStoredUser);
      vi.spyOn(userRepository, 'findByEmail').mockImplementation(async () => currentStoredUser);
      vi.spyOn(userRepository, 'update').mockImplementation(async (_id, data) => {
        currentStoredUser = {
          ...currentStoredUser,
          ...(data as any),
        };
        return currentStoredUser;
      });

      // 1. Change password
      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: validNewPassword,
        });
      expect(changeRes.status).toBe(200);

      // 2. Login with new password -> SUCCESS
      const loginNewRes = await request(app).post('/api/auth/login').send({
        email: 'ananya@example.com',
        password: validNewPassword,
      });
      expect(loginNewRes.status).toBe(200);
      expect(loginNewRes.body.success).toBe(true);

      // 3. Login with old password -> REJECTED (401)
      const loginOldRes = await request(app).post('/api/auth/login').send({
        email: 'ananya@example.com',
        password: samplePassword,
      });
      expect(loginOldRes.status).toBe(401);
      expect(loginOldRes.body.success).toBe(false);
      expect(loginOldRes.body.error.message).toBe('Invalid email or password.');
    });

    it('rejects incorrect current password with 400 without modifying stored hash', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepository, 'update');

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: 'IncorrectCurrentPassword1',
          newPassword: validNewPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toBe('Current password is incorrect.');
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('rejects identical new password with 400 Validation Error', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepository, 'update');

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: samplePassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('same as your current password');
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('rejects new password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: 'short1',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('at least 8 characters');
    });

    it('rejects new password longer than 128 characters', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: 'A'.repeat(128) + '1',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('not exceed 128 characters');
    });

    it('rejects new password without a letter', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: '1234567890',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('at least one letter and one number');
    });

    it('rejects new password without a digit', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: 'NoNumbersInPasswordHere',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('at least one letter and one number');
    });

    it('rejects missing or malformed payload fields', async () => {
      const res1 = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({});

      expect(res1.status).toBe(400);
      expect(res1.body.success).toBe(false);

      const res2 = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({ currentPassword: samplePassword });

      expect(res2.status).toBe(400);
      expect(res2.body.success).toBe(false);

      const res3 = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({ newPassword: validNewPassword });

      expect(res3.status).toBe(400);
      expect(res3.body.success).toBe(false);
    });

    it('safely handles missing or inactive user', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(null);

      const resMissing = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: validNewPassword,
        });

      expect(resMissing.status).toBe(401);
      expect(resMissing.body.success).toBe(false);

      vi.spyOn(userRepository, 'findById').mockResolvedValue({
        ...sampleUser,
        isActive: false,
      });

      const resInactive = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: validNewPassword,
        });

      expect(resInactive.status).toBe(401);
      expect(resInactive.body.success).toBe(false);
    });

    it('cannot change another user password by supplying a user ID in the body', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepository, 'update').mockResolvedValue(sampleUser);

      const victimUserId = '99999999-9999-4999-8999-999999999999';

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          userId: victimUserId,
          currentPassword: samplePassword,
          newPassword: validNewPassword,
        });

      expect(res.status).toBe(200);
      expect(updateSpy).toHaveBeenCalledWith(sampleUserId, expect.any(Object));
      expect(updateSpy).not.toHaveBeenCalledWith(victimUserId, expect.any(Object));
    });

    it('attaches standard RateLimit headers to live change-password requests', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
      vi.spyOn(userRepository, 'update').mockResolvedValue(sampleUser);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerAuthToken}`)
        .send({
          currentPassword: samplePassword,
          newPassword: validNewPassword,
        });

      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
    });
  });
});
