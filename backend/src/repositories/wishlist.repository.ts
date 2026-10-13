import { prisma } from '../db/prisma';
import type { Prisma, WishlistItem } from '@prisma/client';

export type WishlistItemWithProduct = Prisma.WishlistItemGetPayload<{
  include: {
    product: {
      include: {
        category: true;
        images: true;
      };
    };
  };
}>;

export class WishlistRepository {
  async findByUserId(userId: string): Promise<WishlistItemWithProduct[]> {
    return prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<WishlistItem | null> {
    return prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  async add(userId: string, productId: string): Promise<WishlistItemWithProduct> {
    return prisma.wishlistItem.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async remove(userId: string, productId: string): Promise<WishlistItem> {
    return prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.wishlistItem.count({
      where: { userId },
    });
  }
}

export const wishlistRepository = new WishlistRepository();
