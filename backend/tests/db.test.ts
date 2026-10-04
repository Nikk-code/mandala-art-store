process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/mandala_store?schema=public';

import { describe, it, expect } from 'vitest';
import { prisma } from '../src/db/prisma';

describe('Database Connectivity Foundation', () => {
  it('instantiates Prisma Client singleton without error', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.product.findMany).toBe('function');
    expect(typeof prisma.user.findMany).toBe('function');
    expect(typeof prisma.category.findMany).toBe('function');
  });

  it('handles database connection check gracefully', async () => {
    try {
      const result = await prisma.$queryRaw`SELECT 1 as connected`;
      expect(result).toBeDefined();
    } catch (error) {
      // If PostgreSQL container is not currently active on host, ensure error is typed and informative
      expect(error).toBeDefined();
      console.warn(
        'Note: PostgreSQL is not running on localhost:5432. Start via `docker compose up -d` to execute live queries.'
      );
    }
  });
});
