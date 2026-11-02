#!/usr/bin/env node
/**
 * Order Expiration CLI Script
 *
 * Usage:
 *   npm run orders:expire
 *
 * Requirements:
 * - Scans and cancels stale PENDING_PAYMENT orders older than TTL (default 15 minutes).
 * - Restores reserved inventory atomically.
 * - Releases reserved coupon capacity.
 * - Safe for repeated execution (idempotent).
 * - Exits with code 1 if any orders in the batch fail, while attempting all orders.
 */

import { orderExpirationService } from '../src/services/order-expiration.service';
import { prisma } from '../src/db/prisma';

async function main(): Promise<void> {
  console.log('[OrderExpirationCLI] Running order expiration sweep...');
  try {
    const result = await orderExpirationService.expireStaleOrders(15);
    console.log(
      `[OrderExpirationCLI] Sweep finished. Examined: ${result.ordersExamined}, Expired: ${result.ordersExpired}, Skipped: ${result.ordersSkipped}, Failed: ${result.ordersFailed}, Restored items: ${result.restoredItemCount}.`
    );
    if (result.expiredOrderIds.length > 0) {
      console.log(`[OrderExpirationCLI] Expired order IDs: ${result.expiredOrderIds.join(', ')}`);
    }
    if (result.ordersFailed > 0) {
      console.error(
        `[OrderExpirationCLI] Warning: ${result.ordersFailed} order(s) failed during sweep:`
      );
      for (const failed of result.failedOrders) {
        console.error(`  - Order ${failed.orderNumber} (${failed.orderId}): ${failed.error}`);
      }
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('[OrderExpirationCLI] Fatal error during order expiration sweep:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
