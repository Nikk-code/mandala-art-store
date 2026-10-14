import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { config } from '../config/env';
import type { JwtUserPayload } from '../types/auth';

import { userRepository } from '../repositories/user.repository';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Extracts and cryptographically verifies the JWT token from HttpOnly cookie or Authorization header.
 */
function extractAndVerifyUser(req: Request): AuthenticatedUser | null {
  let token: string | null = null;

  // 1. Check HttpOnly session cookie
  if (req.cookies && typeof req.cookies.auth_token === 'string') {
    token = req.cookies.auth_token.trim();
  }

  // 2. Check Authorization Bearer header
  if (!token && req.headers.authorization && typeof req.headers.authorization === 'string') {
    const parts = req.headers.authorization.trim().split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1].trim();
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    }) as JwtUserPayload;

    if (
      !decoded ||
      typeof decoded !== 'object' ||
      typeof decoded.id !== 'string' ||
      !decoded.id.trim() ||
      typeof decoded.email !== 'string' ||
      !decoded.email.trim()
    ) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'CUSTOMER',
    };
  } catch {
    // Malformed, tampered, expired, or invalid signature
    return null;
  }
}

/**
 * Middleware requiring valid customer authentication.
 * Cryptographically verifies token and ensures customer account is active in the database.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const tokenPayload = extractAndVerifyUser(req);

  if (!tokenPayload) {
    return next(new UnauthorizedError('Authentication required to access this resource.'));
  }

  try {
    const user = await userRepository.findById(tokenPayload.id);

    if (!user || !user.isActive) {
      return next(new UnauthorizedError('User account not found or deactivated.'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware requiring verified administrator authorization.
 * Ensures the requesting user is authenticated, active in the database, and has the ADMIN role.
 * - Unauthenticated requests receive 401 Unauthorized.
 * - Deactivated accounts receive 401 Unauthorized.
 * - Authenticated non-admin accounts receive 403 Forbidden.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  // If requireAuth has not already run on this request, authenticate the user first
  if (!req.user) {
    const tokenPayload = extractAndVerifyUser(req);
    if (!tokenPayload) {
      return next(new UnauthorizedError('Authentication required to access admin resources.'));
    }

    try {
      const user = await userRepository.findById(tokenPayload.id);
      if (!user || !user.isActive) {
        return next(new UnauthorizedError('User account not found or deactivated.'));
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      return next(error);
    }
  }

  // Verify the user has the explicit ADMIN role
  if (req.user.role !== UserRole.ADMIN && req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Administrator access required.'));
  }

  next();
}

/**
 * Middleware optionally extracting verified customer authentication.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const tokenPayload = extractAndVerifyUser(req);

  if (!tokenPayload) {
    return next();
  }

  try {
    const user = await userRepository.findById(tokenPayload.id);

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }
    next();
  } catch (error) {
    next(error);
  }
}
