import crypto from 'crypto';

/**
 * Generates a cryptographically secure, high-entropy random token for guest checkout access.
 * Returns 64 lowercase hexadecimal characters (256 bits of entropy).
 */
export function generateGuestAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes a deterministic SHA-256 hash of the guest access token for secure database persistence.
 * Plaintext tokens are never stored in the database.
 */
export function hashGuestAccessToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Verifies a client-provided guest access token against the database-persisted token hash
 * using constant-time comparison to prevent timing side-channel attacks.
 *
 * Requirements:
 * - Stored hash must be a valid 64-character SHA-256 hex string.
 * - Provided token must be non-empty and hash to the identical digest.
 * - Constant-time comparison via crypto.timingSafeEqual.
 */
export function verifyGuestAccessToken(
  storedHash: string | null | undefined,
  providedToken: string | null | undefined
): boolean {
  if (!storedHash || !providedToken || typeof providedToken !== 'string') {
    return false;
  }

  const trimmedToken = providedToken.trim();
  if (trimmedToken.length === 0) {
    return false;
  }

  const providedHash = hashGuestAccessToken(trimmedToken);
  const storedBuffer = Buffer.from(storedHash, 'hex');
  const providedBuffer = Buffer.from(providedHash, 'hex');

  if (storedBuffer.length !== 32 || providedBuffer.length !== 32) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, providedBuffer);
}

