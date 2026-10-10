import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/services/api-client';
import { registerUser, loginUser, logoutUser, fetchCurrentUser } from '@/services/auth-service';
import type { UserDto } from '@/types';

describe('Auth Service Client API', () => {
  const sampleUser: UserDto = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'ananya@example.com',
    firstName: 'Ananya',
    lastName: 'Sharma',
    phone: '9876543210',
    role: 'CUSTOMER',
    createdAt: '2026-10-05T12:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerUser', () => {
    it('sends register payload to auth/register and returns user DTO', async () => {
      const apiSpy = vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
        success: true,
        data: { user: sampleUser },
      });

      const result = await registerUser({
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
        password: 'Password123',
      });

      expect(apiSpy).toHaveBeenCalledWith('auth/register', {
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
        password: 'Password123',
      });
      expect(result).toEqual(sampleUser);
    });
  });

  describe('loginUser', () => {
    it('sends credentials to auth/login and returns user DTO', async () => {
      const apiSpy = vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
        success: true,
        data: { user: sampleUser },
      });

      const result = await loginUser({
        email: 'ananya@example.com',
        password: 'Password123',
      });

      expect(apiSpy).toHaveBeenCalledWith('auth/login', {
        email: 'ananya@example.com',
        password: 'Password123',
      });
      expect(result).toEqual(sampleUser);
    });
  });

  describe('logoutUser', () => {
    it('sends POST request to auth/logout', async () => {
      const apiSpy = vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
        success: true,
        message: 'Logged out successfully.',
      });

      await logoutUser();

      expect(apiSpy).toHaveBeenCalledWith('auth/logout');
    });
  });

  describe('fetchCurrentUser', () => {
    it('sends GET request to auth/me and returns user DTO', async () => {
      const apiSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
        success: true,
        data: { user: sampleUser },
      });

      const result = await fetchCurrentUser();

      expect(apiSpy).toHaveBeenCalledWith('auth/me');
      expect(result).toEqual(sampleUser);
    });
  });
});
