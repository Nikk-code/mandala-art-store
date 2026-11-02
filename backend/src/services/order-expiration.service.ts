import { prisma } from '../db/prisma';
import { PrismaClient } from '@prisma/client';
import { orderRepository, type OrderRepository } from '../repositories/order.repository';

export interface FailedOrderRecord {
  orderId: string;
  orderNumber: string;
  error: string;
}

export interface ExpirationResult {
  ordersExamined: number;
  ordersExpired: number;
  ordersSkipped: number;
  ordersFailed: number;
  expiredOrderCount: number;
  restoredItemCount: number;
  expiredOrderIds: string[];
  failedOrders: FailedOrderRecord[];
}

export class OrderExpirationService {
  private readonly repository: OrderRepository;
  private readonly prismaClient: PrismaClient;
  private scheduledTimer: NodeJS.Timeout | null = null;

  constructor(repository: OrderRepository = orderRepository, prismaClient: PrismaClient = prisma) {
    this.repository = repository;
    this.prismaClient = prismaClient;
  }

  /**
   * Scans for stale PENDING_PAYMENT orders older than threshold minutes (default: 15)
   * and cancels them atomically, releasing reserved inventory and coupon capacity.
   *
   * Resilient batch processing:
   * - Each order cancellation runs independently in its own try/catch.
   * - A failure on one order never terminates or prevents processing remaining orders.
   * - Returns comprehensive summary of examined, expired, skipped, and failed orders.
   */
  async expireStaleOrders(olderThanMinutes = 15): Promise<ExpirationResult> {
    const cutoffDate = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    // Find candidate orders eligible for expiration
    const staleOrders = await this.prismaClient.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: { lte: cutoffDate },
        payments: {
          none: {
            status: { in: ['CAPTURED', 'AUTHORIZED'] },
          },
        },
      },
      select: {
        id: true,
        orderNumber: true,
      },
    });

    const ordersExamined = staleOrders.length;
    const expiredOrderIds: string[] = [];
    const failedOrders: FailedOrderRecord[] = [];
    let ordersSkipped = 0;
    let restoredItemCount = 0;

    for (const order of staleOrders) {
      try {
        const reason = `[ORDER_EXPIRED] Order "${order.orderNumber}" was automatically cancelled after ${olderThanMinutes} minutes of payment inactivity. Stock released.`;
        const result = await this.repository.cancelOrderAndRestoreStock(order.id, reason);

        if (result.cancelled) {
          expiredOrderIds.push(order.id);
          restoredItemCount += result.restoredItems;
        } else {
          ordersSkipped += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[OrderExpirationService] Failed to expire order "${order.id}":`, message);
        failedOrders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          error: message,
        });
      }
    }

    return {
      ordersExamined,
      ordersExpired: expiredOrderIds.length,
      ordersSkipped,
      ordersFailed: failedOrders.length,
      expiredOrderCount: expiredOrderIds.length,
      restoredItemCount,
      expiredOrderIds,
      failedOrders,
    };
  }

  /**
   * Starts a process-local background interval for automated expiration (useful for dev/test).
   * Note: For multi-instance production environments, an external cron runner or Cloud Scheduler
   * invoking `npm run orders:expire` is required to avoid duplicate timer overhead.
   */
  startScheduledExpiration(intervalMs = 60_000, olderThanMinutes = 15): void {
    if (this.scheduledTimer) {
      return;
    }

    this.scheduledTimer = setInterval(() => {
      this.expireStaleOrders(olderThanMinutes).catch(err => {
        console.error('[OrderExpirationService] Error during scheduled expiration sweep:', err);
      });
    }, intervalMs);

    if (this.scheduledTimer.unref) {
      this.scheduledTimer.unref();
    }
  }

  /**
   * Stops the scheduled background interval if active.
   */
  stopScheduledExpiration(): void {
    if (this.scheduledTimer) {
      clearInterval(this.scheduledTimer);
      this.scheduledTimer = null;
    }
  }
}

export const orderExpirationService = new OrderExpirationService();
