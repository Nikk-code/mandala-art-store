import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../src/services/auth.service';
import { UserRepository } from '../src/repositories/user.repository';
import { ConflictError, UnauthorizedError, ValidationError } from '../src/errors';
import { config } from '../src/config/env';
import { UserRole, type User } from '@prisma/client';

describe('AuthService Unit Tests', () => {
  let userRepo: UserRepository;
  let authService: AuthService;

  const samplePassword = 'StrongPassword123';
  let sampleHashedPassword = '';

  const sampleUser: User = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'test@example.com',
    passwordHash: '',
    firstName: 'Test',
    lastName: 'Customer',
    phone: '9876543210',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T12:00:00.000Z'),
    updatedAt: new Date('2026-10-05T12:00:00.000Z'),
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    userRepo = new UserRepository();
    authService = new AuthService(userRepo);
    sampleHashedPassword = await bcrypt.hash(samplePassword, 10);
    sampleUser.passwordHash = sampleHashedPassword;
  });

  describe('register', () => {
    it('creates a user with hashed password and generates a valid JWT', async () => {
      vi.spyOn(userRepo, 'findByEmail').mockResolvedValue(null);
      const createSpy = vi.spyOn(userRepo, 'create').mockResolvedValue(sampleUser);

      const result = await authService.register({
        name: 'Test Customer',
        email: 'TEST@example.COM',
        password: samplePassword,
        phone: '9876543210',
      });

      expect(result.user.id).toBe(sampleUser.id);
      expect(result.user.email).toBe('test@example.com');
      expect((result.user as any).passwordHash).toBeUndefined();

      // Verify password was hashed before creating
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          role: UserRole.CUSTOMER,
        })
      );
      const passedHash = createSpy.mock.calls[0][0].passwordHash;
      expect(passedHash).not.toBe(samplePassword);
      expect(await bcrypt.compare(samplePassword, passedHash)).toBe(true);

      // Verify JWT token
      const decoded = jwt.verify(result.token, config.jwtSecret) as any;
      expect(decoded.id).toBe(sampleUser.id);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('CUSTOMER');
    });

    it('throws ConflictError when email already exists', async () => {
      vi.spyOn(userRepo, 'findByEmail').mockResolvedValue(sampleUser);

      await expect(
        authService.register({
          name: 'Test Customer',
          email: 'test@example.com',
          password: samplePassword,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('throws ValidationError when input is malformed', async () => {
      await expect(
        authService.register({
          name: 'T',
          email: 'invalid-email',
          password: '123',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('authenticates user with correct credentials and returns JWT', async () => {
      vi.spyOn(userRepo, 'findByEmail').mockResolvedValue(sampleUser);

      const result = await authService.login({
        email: 'test@example.com',
        password: samplePassword,
      });

      expect(result.user.id).toBe(sampleUser.id);
      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();

      const decoded = jwt.verify(result.token, config.jwtSecret) as any;
      expect(decoded.id).toBe(sampleUser.id);
    });

    it('throws UnauthorizedError when password does not match', async () => {
      vi.spyOn(userRepo, 'findByEmail').mockResolvedValue(sampleUser);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'IncorrectPassword999',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when user is not found', async () => {
      vi.spyOn(userRepo, 'findByEmail').mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: samplePassword,
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when user account is deactivated', async () => {
      vi.spyOn(userRepo, 'findByEmail').mockResolvedValue({
        ...sampleUser,
        isActive: false,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: samplePassword,
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getCurrentUser', () => {
    it('returns sanitized user when active user exists', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(sampleUser);

      const user = await authService.getCurrentUser(sampleUser.id);

      expect(user.id).toBe(sampleUser.id);
      expect(user.email).toBe(sampleUser.email);
      expect((user as any).passwordHash).toBeUndefined();
    });

    it('throws UnauthorizedError when user is not found', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(null);

      await expect(authService.getCurrentUser('non-existent-id')).rejects.toThrow(
        UnauthorizedError
      );
    });
  });
});
