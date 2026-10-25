import { prisma } from '../db/prisma';
import type { Prisma, Review, ReviewStatus } from '@prisma/client';
import type { RatingSummaryDto, AdminReviewFilters, AdminReviewListOptions } from '../types/review';

export type ReviewWithAuthor = Prisma.ReviewGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    };
  };
}>;

export type ReviewWithDetails = Prisma.ReviewGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
    product: {
      select: {
        id: true;
        name: true;
        slug: true;
        sku: true;
      };
    };
  };
}>;

export interface CreateReviewData {
  productId: string;
  userId: string;
  orderId?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  status?: ReviewStatus;
  isVerifiedPurchase: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string | null;
  body?: string | null;
}

export class ReviewRepository {
  /**
   * Finds all reviews for a product filtered by status (defaults to APPROVED).
   */
  async findByProductId(
    productId: string,
    status: ReviewStatus = 'APPROVED'
  ): Promise<ReviewWithAuthor[]> {
    return prisma.review.findMany({
      where: {
        productId,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Finds a specific review by its unique ID.
   */
  async findById(id: string): Promise<ReviewWithAuthor | null> {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Finds a review by its ID with full customer and product moderation details.
   */
  async findByIdWithDetails(id: string): Promise<ReviewWithDetails | null> {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
          },
        },
      },
    });
  }

  /**
   * Lists reviews for administrative moderation with filters, pagination, and sorting.
   */
  async findAdminReviews(
    filters: AdminReviewFilters,
    options: AdminReviewListOptions
  ): Promise<{ items: ReviewWithDetails[]; totalItems: number }> {
    const where: Prisma.ReviewWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.search) {
      const search = filters.search;
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let orderBy: Prisma.ReviewOrderByWithRelationInput | Prisma.ReviewOrderByWithRelationInput[];
    switch (options.sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'rating_asc':
        orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
        break;
      case 'rating_desc':
        orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const skip = (options.page - 1) * options.pageSize;
    const take = options.pageSize;

    const [items, totalItems] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.review.count({ where }),
    ]);

    return { items, totalItems };
  }

  /**
   * Updates moderation status of a review and returns full details.
   */
  async updateStatus(id: string, status: ReviewStatus): Promise<ReviewWithDetails> {
    return prisma.review.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
          },
        },
      },
    });
  }

  /**
   * Finds a review by user and product (utilizing unique index).
   */
  async findByUserAndProduct(userId: string, productId: string): Promise<ReviewWithAuthor | null> {
    return prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Computes authoritative rating summary and star distribution for approved reviews.
   */
  async getRatingSummary(productId: string): Promise<RatingSummaryDto> {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: 'APPROVED',
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = reviews.length;
    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution,
      };
    }

    let sum = 0;
    for (const r of reviews) {
      sum += r.rating;
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    }

    const averageRating = Math.round((sum / totalReviews) * 10) / 10;

    return {
      averageRating,
      totalReviews,
      distribution,
    };
  }

  /**
   * Verifies if a user has an eligible successfully paid order containing the product.
   * Eligible orders:
   * 1. Belong to the user (userId).
   * 2. Status in CONFIRMED, PROCESSING, SHIPPED, DELIVERED (not PENDING_PAYMENT, PAYMENT_FAILED, or CANCELLED).
   * 3. Contain OrderItem with productId.
   * 4. Associated Payment has status CAPTURED.
   */
  async findEligiblePurchase(
    userId: string,
    productId: string
  ): Promise<{ orderId: string } | null> {
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
        items: {
          some: {
            productId,
          },
        },
        payments: {
          some: {
            status: 'CAPTURED',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    return order ? { orderId: order.id } : null;
  }

  /**
   * Inserts a new review into the database.
   */
  async create(data: CreateReviewData): Promise<ReviewWithAuthor> {
    return prisma.review.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        orderId: data.orderId ?? null,
        rating: data.rating,
        title: data.title ?? null,
        body: data.body ?? null,
        status: data.status ?? 'PENDING',
        isVerifiedPurchase: data.isVerifiedPurchase,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Updates an existing review's rating, title, and body.
   */
  async update(id: string, data: UpdateReviewData): Promise<ReviewWithAuthor> {
    return prisma.review.update({
      where: { id },
      data: {
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Removes a review by its ID.
   */
  async delete(id: string): Promise<Review> {
    return prisma.review.delete({
      where: { id },
    });
  }
}

export const reviewRepository = new ReviewRepository();
