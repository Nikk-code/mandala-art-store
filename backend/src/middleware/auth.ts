import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';

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
 * Extracts and validates the customer user ID from Authorization header or x-user-id header.
 */
function extractUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const token = parts[1].trim();
      if (UUID_REGEX.test(token)) {
        return token;
      }
    } else if (UUID_REGEX.test(authHeader.trim())) {
      return authHeader.trim();
    }
  }

  const userIdHeader = req.headers['x-user-id'];
  if (userIdHeader && typeof userIdHeader === 'string' && UUID_REGEX.test(userIdHeader.trim())) {
    return userIdHeader.trim();
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
 * Middleware optionally extracting customer authentication if provided.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const userId = extractUserId(req);
  if (userId) {
    req.user = { id: userId };
  }
  next();
}
