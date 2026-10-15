import { prisma } from '../db/prisma';
import type { Prisma, Coupon } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import type {
  CreateCouponInput,
  UpdateCouponInput,
  AdminCouponFilters,
  AdminCouponListOptions,
} from '../types/coupon';
import { ConflictError, NotFoundError } from '../errors';

export type AdminCouponRecord = Coupon & {
  _count: {
    orders: number;
  };
};

export class CouponRepository {
  private readonly prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prismaClient = prismaClient;
  }

  async findById(id: string): Promise<Coupon | null> {
    return this.prismaClient.coupon.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();
    return this.prismaClient.coupon.findUnique({
      where: { code: normalized },
    });
  }

  /**
   * Acquires an exclusive row-level lock on a coupon inside an interactive database transaction.
   * Prevents concurrent checkouts or capture events from racing on capacity or timesUsed.
   */
  async findForUpdate(tx: Prisma.TransactionClient, couponId: string): Promise<Coupon | null> {
    const rows = await tx.$queryRaw<Coupon[]>`
      SELECT * FROM "coupons"
      WHERE "id" = ${couponId}::uuid
      FOR UPDATE
    `;
    return rows[0] || null;
  }

  /**
   * Counts active, unexpired pending payment reservations for a coupon inside an interactive transaction.
   * Enforces the 15-minute reservation TTL window.
   */
  async countActivePendingReservations(
    tx: Prisma.TransactionClient,
    couponId: string,
    windowMinutes = 15
  ): Promise<number> {
    const rows = await tx.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count FROM "orders"
      WHERE "coupon_id" = ${couponId}::uuid
        AND "status" = 'PENDING_PAYMENT'
        AND "created_at" >= (NOW() - (${windowMinutes} || ' minutes')::interval)
    `;
    return Number(rows[0]?.count ?? 0);
  }

  /**
   * Retrieves paginated coupons for administration with search and status filtering.
   */
  async findAdminCoupons(
    filters: AdminCouponFilters,
    options: AdminCouponListOptions
  ): Promise<{ coupons: AdminCouponRecord[]; total: number }> {
    const where: Prisma.CouponWhereInput = {};

    if (filters.search && filters.search.trim()) {
      where.code = { contains: filters.search.trim(), mode: 'insensitive' };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.discountType) {
      where.discountType = filters.discountType;
    }

    let orderBy: Prisma.CouponOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (options.sort === 'code_asc') {
      orderBy = { code: 'asc' };
    } else if (options.sort === 'times_used_desc') {
      orderBy = { timesUsed: 'desc' };
    }

    const [coupons, total] = await Promise.all([
      this.prismaClient.coupon.findMany({
        where,
        include: {
          _count: {
            select: { orders: true },
          },
        },
        orderBy,
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prismaClient.coupon.count({ where }),
    ]);

    return { coupons, total };
  }

  async create(data: CreateCouponInput): Promise<Coupon> {
    return this.prismaClient.coupon.create({
      data: {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount ?? null,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        usageLimit: data.usageLimit ?? null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateCouponInput): Promise<Coupon> {
    const updateData: Prisma.CouponUpdateInput = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
    if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.validFrom !== undefined) updateData.validFrom = new Date(data.validFrom);
    if (data.validUntil !== undefined) updateData.validUntil = new Date(data.validUntil);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prismaClient.coupon.update({
      where: { id },
      data: updateData,
    });
  }

  async toggleStatus(id: string, isActive: boolean): Promise<Coupon> {
    return this.prismaClient.coupon.update({
      where: { id },
      data: { isActive },
    });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.prismaClient.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError(`Coupon with ID "${id}" was not found.`);
    }

    if (existing._count.orders > 0) {
      throw new ConflictError(
        `Cannot delete coupon "${existing.code}" because it is referenced by ${existing._count.orders} order(s). Please deactivate it instead.`
      );
    }

    await this.prismaClient.coupon.delete({
      where: { id },
    });

    return true;
  }
}

export const couponRepository = new CouponRepository();
