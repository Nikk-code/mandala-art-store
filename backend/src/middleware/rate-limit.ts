import rateLimit, { type Options } from 'express-rate-limit';
import { config } from '../config/env';

export const AUTH_RATE_LIMIT_ERROR_MESSAGE = 'Too many attempts. Please try again later.';

/**
 * Creates an in-memory rate limiter for sensitive authentication endpoints.
 *
 * NOTE ON MULTI-INSTANCE DEPLOYMENTS:
 * This in-memory limiter operates within the local Node.js process memory.
 * In a horizontally scaled production deployment with multiple backend instances
 * behind a load balancer, limits are tracked per-instance rather than globally.
 * For globally shared limits across clusters, a distributed store (e.g. Redis)
 * should be integrated when infrastructure requirements necessitate it.
 */
export function createAuthRateLimiter(options?: Partial<Options>) {
  const isTest = config.nodeEnv === 'test';

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute sliding window
    max: isTest ? 1000 : 20, // 20 requests per 15 min in production, relaxed in general tests
    standardHeaders: true, // Return standard RateLimit-* headers (RFC draft-6)
    legacyHeaders: false, // Disable X-RateLimit-* legacy headers
    statusCode: 429,
    validate: {
      trustProxy: false,
    },
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: AUTH_RATE_LIMIT_ERROR_MESSAGE,
      },
    },
    ...options,
  });
}

/**
 * Rate limiter applied to customer login (POST /api/auth/login).
 * Protects against credential-stuffing and brute-force password attacks.
 */
export const loginRateLimiter = createAuthRateLimiter();

/**
 * Rate limiter applied to customer registration (POST /api/auth/register).
 * Protects against automated bot account generation and resource exhaustion.
 */
export const registerRateLimiter = createAuthRateLimiter();

/**
 * Rate limiter applied to customer password change (POST /api/auth/change-password).
 * Protects against brute-force verification of the current password.
 */
export const passwordChangeRateLimiter = createAuthRateLimiter();
