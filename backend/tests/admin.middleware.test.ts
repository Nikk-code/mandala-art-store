import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { requireAdmin } from '../src/middleware/auth';
import { userRepository } from '../src/repositories/user.repository';
import { config } from '../src/config/env';
import { UnauthorizedError, ForbiddenError } from '../src/errors';

describe('requireAdmin Middleware', () => {
  const adminUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const customerUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  const sampleAdmin = {
    id: adminUserId,
    email: 'admin@mandala.test',
    passwordHash: 'hash',
    firstName: 'Admin',
    lastName: 'User',
    phone: null,
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleCustomer = {
    id: customerUserId,
    email: 'customer@mandala.test',
    passwordHash: 'hash',
    firstName: 'Customer',
    lastName: 'User',
    phone: null,
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated request with 401 Unauthorized', async () => {
    const req = {
      cookies: {},
      headers: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as UnauthorizedError;
    expect(error.statusCode).toBe(401);
  });

  it('rejects deactivated account with 401 Unauthorized', async () => {
    const token = jwt.sign(
      { id: adminUserId, email: sampleAdmin.email, role: 'ADMIN' },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    vi.spyOn(userRepository, 'findById').mockResolvedValue({
      ...sampleAdmin,
      isActive: false,
    });

    const req = {
      cookies: { auth_token: token },
      headers: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as UnauthorizedError;
    expect(error.statusCode).toBe(401);
  });

  it('rejects authenticated non-admin customer with 403 Forbidden', async () => {
    const token = jwt.sign(
      { id: customerUserId, email: sampleCustomer.email, role: 'CUSTOMER' },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleCustomer);

    const req = {
      cookies: { auth_token: token },
      headers: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ForbiddenError;
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('Administrator access required');
  });

  it('allows active administrator with ADMIN role and calls next()', async () => {
    const token = jwt.sign(
      { id: adminUserId, email: sampleAdmin.email, role: 'ADMIN' },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdmin);

    const req = {
      cookies: { auth_token: token },
      headers: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({
      id: adminUserId,
      email: sampleAdmin.email,
      role: UserRole.ADMIN,
    });
  });

  it('uses already-populated req.user from requireAuth if present', async () => {
    const req = {
      user: {
        id: adminUserId,
        email: sampleAdmin.email,
        role: 'ADMIN',
      },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
