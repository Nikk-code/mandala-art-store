import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../src/services/auth.service';
import { UserRepository } from '../src/repositories/user.repository';
import { ConflictError, UnauthorizedError, ValidationError, BadRequestError } from '../src/errors';
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

  describe('updateProfile', () => {
    it('updates allowed profile fields and returns sanitized user DTO', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(sampleUser);
      vi.spyOn(userRepo, 'update').mockResolvedValue({
        ...sampleUser,
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        phone: '9876543210',
      });

      const updated = await authService.updateProfile(sampleUser.id, {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        phone: '9876543210',
      });

      expect(updated.firstName).toBe('UpdatedFirst');
      expect(updated.lastName).toBe('UpdatedLast');
      expect(updated.phone).toBe('9876543210');
      expect((updated as any).passwordHash).toBeUndefined();
    });

    it('ignores and never updates protected fields (role, passwordHash, email, isActive)', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepo, 'update').mockResolvedValue({
        ...sampleUser,
        firstName: 'NewName',
      });

      await authService.updateProfile(sampleUser.id, {
        firstName: 'NewName',
        role: 'ADMIN',
        passwordHash: 'hacked_hash',
        email: 'attacker@example.com',
        isActive: false,
      } as any);

      // Verify update called ONLY with allowed fields
      expect(updateSpy).toHaveBeenCalledWith(sampleUser.id, {
        firstName: 'NewName',
      });
    });

    it('throws ValidationError when input payload contains no valid fields', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(sampleUser);

      await expect(authService.updateProfile(sampleUser.id, {})).rejects.toThrow(ValidationError);
    });

    it('throws UnauthorizedError when updating a deactivated or nonexistent account', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue({
        ...sampleUser,
        isActive: false,
      });

      await expect(
        authService.updateProfile(sampleUser.id, {
          firstName: 'NewName',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('changePassword', () => {
    it('successfully updates password hash with bcrypt when current password matches', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepo, 'update').mockResolvedValue({
        ...sampleUser,
      });

      const newPassword = 'NewSecretPassword456';
      await authService.changePassword(sampleUser.id, {
        currentPassword: samplePassword,
        newPassword,
      });

      expect(updateSpy).toHaveBeenCalledWith(
        sampleUser.id,
        expect.objectContaining({
          passwordHash: expect.any(String),
        })
      );

      const passedHash = updateSpy.mock.calls[0][1].passwordHash as string;
      expect(passedHash).not.toBe(sampleUser.passwordHash);
      expect(passedHash).not.toBe(newPassword);
      expect(await bcrypt.compare(newPassword, passedHash)).toBe(true);
    });

    it('throws BadRequestError when current password does not match', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepo, 'update');

      await expect(
        authService.changePassword(sampleUser.id, {
          currentPassword: 'WrongPassword999',
          newPassword: 'NewSecretPassword456',
        })
      ).rejects.toThrow(BadRequestError);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('throws ValidationError when new password is the same as current password', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepo, 'update');

      await expect(
        authService.changePassword(sampleUser.id, {
          currentPassword: samplePassword,
          newPassword: samplePassword,
        })
      ).rejects.toThrow(ValidationError);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('throws ValidationError when new password is shorter than 8 characters', async () => {
      await expect(
        authService.changePassword(sampleUser.id, {
          currentPassword: samplePassword,
          newPassword: 'short1',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when new password exceeds 128 characters', async () => {
      const longPassword = 'A'.repeat(128) + '1';
      await expect(
        authService.changePassword(sampleUser.id, {
          currentPassword: samplePassword,
          newPassword: longPassword,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when new password lacks numbers', async () => {
      await expect(
        authService.changePassword(sampleUser.id, {
          currentPassword: samplePassword,
          newPassword: 'OnlyLettersPassword',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when new password lacks letters', async () => {
      await expect(
        authService.changePassword(sampleUser.id, {
          currentPassword: samplePassword,
          newPassword: '1234567890',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when input payload is malformed or missing fields', async () => {
      await expect(authService.changePassword(sampleUser.id, {})).rejects.toThrow(ValidationError);

      await expect(
        authService.changePassword(sampleUser.id, {
          currentPassword: samplePassword,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        authService.changePassword(sampleUser.id, {
          newPassword: 'ValidNewPassword123',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws UnauthorizedError when user is not found or deactivated', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(null);

      await expect(
        authService.changePassword('non-existent-user-id', {
          currentPassword: samplePassword,
          newPassword: 'NewValidPassword123',
        })
      ).rejects.toThrow(UnauthorizedError);

      vi.spyOn(userRepo, 'findById').mockResolvedValue({
        ...sampleUser,
        isActive: false,
      });

      await expect(
        authService.changePassword(sampleUser.id, {
          currentPassword: samplePassword,
          newPassword: 'NewValidPassword123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('strictly updates the authenticated userId and ignores client-submitted target userId in payload', async () => {
      vi.spyOn(userRepo, 'findById').mockResolvedValue(sampleUser);
      const updateSpy = vi.spyOn(userRepo, 'update').mockResolvedValue({
        ...sampleUser,
      });

      await authService.changePassword(sampleUser.id, {
        currentPassword: samplePassword,
        newPassword: 'NewValidPassword123',
        userId: 'malicious-victim-id',
        role: 'ADMIN',
      } as any);

      // Verify that update was called for sampleUser.id, never malicious-victim-id
      expect(updateSpy).toHaveBeenCalledWith(sampleUser.id, expect.any(Object));
      expect(updateSpy).not.toHaveBeenCalledWith('malicious-victim-id', expect.any(Object));
    });
  });
});
