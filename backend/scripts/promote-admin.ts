#!/usr/bin/env node
/**
 * Safe Administrator Account Promotion CLI Script
 *
 * Usage:
 *   npm run admin:promote -- <email>
 *   or
 *   ADMIN_PROMOTION_EMAIL=<email> npm run admin:promote
 *
 * Requirements:
 * - Promotes an existing, active registered account to ADMIN role.
 * - Never creates default admin credentials or hardcoded accounts.
 * - Safe for repeated execution (idempotent).
 * - Never logs secrets or sensitive attributes.
 */

import { adminService } from '../src/services/admin.service';
import { prisma } from '../src/db/prisma';

async function main(): Promise<void> {
  const emailArg = process.argv[2]?.trim() || process.env.ADMIN_PROMOTION_EMAIL?.trim();

  if (!emailArg) {
    console.error('Error: Missing required administrator account email.');
    console.error('');
    console.error('Usage:');
    console.error('  npm run admin:promote -- <customer-email>');
    console.error('  or:');
    console.error('  ADMIN_PROMOTION_EMAIL=<customer-email> npm run admin:promote');
    process.exit(1);
  }

  try {
    const result = await adminService.promoteUserToAdmin(emailArg);

    if (result.alreadyAdmin) {
      console.log(
        `[Notice] Account ${result.email} is already an active ADMIN. No changes needed.`
      );
    } else {
      console.log(
        `[Success] Account ${result.email} (ID: ${result.userId}) has been promoted to ADMIN.`
      );
    }

    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Error] Failed to promote administrator: ${message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
