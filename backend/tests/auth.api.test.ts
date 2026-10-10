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
});
