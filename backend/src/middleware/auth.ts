import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors';
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
