import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';
import { config } from '../config/env';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
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
 * Extracts the authenticated user identity.
 *
 * NOTE: Full cryptographic JWT authentication & session token verification is scheduled for Step 16.
 * In non-test / production environments, client-supplied unverified UUIDs or x-user-id headers are
 * strictly rejected to prevent identity spoofing and impersonation attacks.
 *
 * Test-only identity injection is strictly restricted to automated testing (NODE_ENV === 'test').
 */
function extractUserId(req: Request): string | null {
  // Never permit test identity injection in production or when not in test mode
  if (config.isProduction || config.nodeEnv !== 'test') {
    return null;
  }

  // Isolated test harness identity extraction (active ONLY in NODE_ENV === 'test')
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const token = parts[1].trim();
      if (UUID_REGEX.test(token)) {
        return token;
      }
    }
  }

  return null;
}

/**
 * Middleware requiring customer authentication.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const userId = extractUserId(req);

  if (!userId) {
    throw new UnauthorizedError('Authentication required to access this resource.');
  }

  req.user = { id: userId };
  next();
}

/**
 * Middleware optionally extracting customer authentication if provided in test environment.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const userId = extractUserId(req);
  if (userId) {
    req.user = { id: userId };
  }
  next();
}
