import { prisma } from '../db/prisma';
import type { Prisma, Product, ProductImage } from '@prisma/client';
import { PrismaClient, ProductAvailability } from '@prisma/client';
import { NotFoundError, ConflictError } from '../errors';

export interface AdjustStockParams {
  stockQuantity?: number;
  adjustment?: number;
  availability?: ProductAvailability;
  expectedStock?: number;
  force?: boolean;
}

export type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
  };
}> & {
  reviews?: Array<{ rating: number }>;
};

export interface FindActiveProductsPaginatedParams {
  filter?: {
    categoryId?: string;
    availability?: ProductAvailability;
    isFeatured?: boolean;
  };
  pagination?: {
    skip: number;
    take: number;
  };
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

export interface FindAdminProductsPaginatedParams {
  filter?: {
    search?: string;
    categoryId?: string;
    availability?: ProductAvailability;
    isActive?: boolean;
  };
  pagination?: {
    skip: number;
    take: number;
  };
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'stock_asc' | 'stock_desc';
}

export class ProductRepository {
  private readonly prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prismaClient = prismaClient;
  }

  async findById(id: string): Promise<ProductWithDetails | null> {
    return this.prismaClient.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: { rating: true },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<ProductWithDetails | null> {
    return this.prismaClient.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: { rating: true },
        },
      },
    });
  }

  async findBySku(sku: string): Promise<ProductWithDetails | null> {
    return this.prismaClient.product.findUnique({
      where: { sku },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: { rating: true },
        },
      },
    });
  }

  async findActiveProducts(filter?: {
    categoryId?: string;
    isFeatured?: boolean;
  }): Promise<ProductWithDetails[]> {
    return this.prismaClient.product.findMany({
      where: {
        isActive: true,
        ...(filter?.categoryId ? { categoryId: filter.categoryId } : {}),
        ...(filter?.isFeatured !== undefined ? { isFeatured: filter.isFeatured } : {}),
      },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveProductsPaginated(
    params: FindActiveProductsPaginatedParams
  ): Promise<{ items: ProductWithDetails[]; totalItems: number }> {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(params.filter?.categoryId ? { categoryId: params.filter.categoryId } : {}),
      ...(params.filter?.availability ? { availability: params.filter.availability } : {}),
      ...(params.filter?.isFeatured !== undefined ? { isFeatured: params.filter.isFeatured } : {}),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (params.sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [items, totalItems] = await Promise.all([
      this.prismaClient.product.findMany({
        where,
        include: {
          category: true,
          images: {
            orderBy: { displayOrder: 'asc' },
          },
          reviews: {
            where: { status: 'APPROVED' },
            select: { rating: true },
          },
        },
        orderBy,
        skip: params.pagination?.skip,
        take: params.pagination?.take,
      }),
      this.prismaClient.product.count({ where }),
    ]);

    return { items, totalItems };
  }

  async findAdminProductsPaginated(
    params: FindAdminProductsPaginatedParams
  ): Promise<{ items: ProductWithDetails[]; totalItems: number }> {
    const where: Prisma.ProductWhereInput = {
      ...(params.filter?.isActive !== undefined ? { isActive: params.filter.isActive } : {}),
      ...(params.filter?.categoryId ? { categoryId: params.filter.categoryId } : {}),
      ...(params.filter?.availability ? { availability: params.filter.availability } : {}),
      ...(params.filter?.search
        ? {
            OR: [
              { name: { contains: params.filter.search, mode: 'insensitive' } },
              { sku: { contains: params.filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (params.sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'stock_asc':
        orderBy = { stockQuantity: 'asc' };
        break;
      case 'stock_desc':
        orderBy = { stockQuantity: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [items, totalItems] = await Promise.all([
      this.prismaClient.product.findMany({
        where,
        include: {
          category: true,
          images: {
            orderBy: { displayOrder: 'asc' },
          },
          reviews: {
            where: { status: 'APPROVED' },
            select: { rating: true },
          },
        },
        orderBy,
        skip: params.pagination?.skip,
        take: params.pagination?.take,
      }),
      this.prismaClient.product.count({ where }),
    ]);

    return { items, totalItems };
  }

  async create(data: Prisma.ProductCreateInput): Promise<ProductWithDetails> {
    return this.prismaClient.product.create({
      data,
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductWithDetails> {
    return this.prismaClient.product.update({
      where: { id },
      data,
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async deactivate(id: string): Promise<Product> {
    return this.prismaClient.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string): Promise<Product> {
    return this.prismaClient.product.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async adjustStock(id: string, data: AdjustStockParams): Promise<ProductWithDetails> {
    return this.prismaClient.$transaction(async tx => {
      // 1. Fetch current product inside transaction to check existence and base attributes
      const product = await tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!product) {
        throw new NotFoundError(`Product not found with ID: ${id}`);
      }

      // 2. Set mode: direct absolute stock quantity
      if (data.stockQuantity !== undefined) {
        let targetAvailability = data.availability ?? product.availability;
        // Auto-transition availability if not MADE_TO_ORDER and not explicitly provided
        if (
          data.availability === undefined &&
          product.availability !== ProductAvailability.MADE_TO_ORDER
        ) {
          if (data.stockQuantity === 0) {
            targetAvailability = ProductAvailability.SOLD_OUT;
          } else if (
            product.availability === ProductAvailability.SOLD_OUT &&
            data.stockQuantity > 0
          ) {
            targetAvailability = ProductAvailability.IN_STOCK;
          }
        }

        if (data.expectedStock !== undefined && !data.force) {
          // Atomic conditional update: update ONLY when id = id AND stockQuantity = expectedStock
          const updateResult = await tx.product.updateMany({
            where: {
              id,
              stockQuantity: data.expectedStock,
            },
            data: {
              stockQuantity: data.stockQuantity,
              availability: targetAvailability,
            },
          });

          if (updateResult.count === 0) {
            const current = await tx.product.findUnique({ where: { id } });
            const currentStock = current ? current.stockQuantity : product.stockQuantity;
            throw new ConflictError(
              `Stock quantity conflict for "${product.name}". Expected stock was ${data.expectedStock}, but current stock in database is ${currentStock}. A concurrent order or stock adjustment occurred.`
            );
          }
        } else {
          // Either no expectedStock provided (legacy caller) OR force: true (authoritative physical recount)
          await tx.product.update({
            where: { id },
            data: {
              stockQuantity: data.stockQuantity,
              availability: targetAvailability,
            },
          });
        }

        const finalProduct = await tx.product.findUnique({
          where: { id },
          include: {
            category: true,
            images: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        });

        if (!finalProduct) {
          throw new NotFoundError(`Product not found with ID: ${id}`);
        }

        return finalProduct;
      }

      // 3. Delta adjustment mode
      if (data.adjustment !== undefined) {
        const delta = data.adjustment;

        if (delta < 0) {
          const absDelta = Math.abs(delta);
          // Atomic conditional update: only decrement if stockQuantity >= absDelta
          const updateResult = await tx.product.updateMany({
            where: {
              id,
              stockQuantity: { gte: absDelta },
            },
            data: {
              stockQuantity: { decrement: absDelta },
            },
          });

          if (updateResult.count === 0) {
            const current = await tx.product.findUnique({ where: { id } });
            const currentStock = current ? current.stockQuantity : 0;
            throw new ConflictError(
              `Cannot reduce stock by ${absDelta}. Available stock for "${product.name}" is ${currentStock}, minimum allowed is 0.`
            );
          }
        } else if (delta > 0) {
          // Atomic increment
          await tx.product.update({
            where: { id },
            data: {
              stockQuantity: { increment: delta },
            },
          });
        }

        // Atomic conditional availability transitions:
        // Ensures availability updates only when the database stock strictly matches the condition at write time
        if (data.availability === undefined) {
          // Only transition to SOLD_OUT if current stock is strictly 0 AND status is currently IN_STOCK
          // (Protects against overlapping increments and never touches MADE_TO_ORDER)
          await tx.product.updateMany({
            where: {
              id,
              stockQuantity: 0,
              availability: ProductAvailability.IN_STOCK,
            },
            data: {
              availability: ProductAvailability.SOLD_OUT,
            },
          });

          // Only transition to IN_STOCK if current stock is strictly > 0 AND status is currently SOLD_OUT
          // (Protects against overlapping checkouts and never touches MADE_TO_ORDER)
          await tx.product.updateMany({
            where: {
              id,
              stockQuantity: { gt: 0 },
              availability: ProductAvailability.SOLD_OUT,
            },
            data: {
              availability: ProductAvailability.IN_STOCK,
            },
          });
        } else {
          // Explicit administrative availability override
          await tx.product.update({
            where: { id },
            data: { availability: data.availability },
          });
        }

        const finalProduct = await tx.product.findUnique({
          where: { id },
          include: {
            category: true,
            images: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        });

        if (!finalProduct) {
          throw new NotFoundError(`Product not found with ID: ${id}`);
        }

        return finalProduct;
      }

      // 4. Availability-only update
      if (data.availability !== undefined) {
        return tx.product.update({
          where: { id },
          data: { availability: data.availability },
          include: {
            category: true,
            images: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        });
      }

      return product;
    });
  }

  async addImage(
    productId: string,
    data: {
      url: string;
      altText?: string | null;
      displayOrder?: number;
      isPrimary?: boolean;
    }
  ): Promise<ProductImage> {
    if (data.isPrimary) {
      // Unset previous primary images for this product within a transaction
      return this.prismaClient.$transaction(async tx => {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });

        return tx.productImage.create({
          data: {
            productId,
            url: data.url,
            altText: data.altText,
            displayOrder: data.displayOrder ?? 0,
            isPrimary: true,
          },
        });
      });
    }

    return this.prismaClient.productImage.create({
      data: {
        productId,
        url: data.url,
        altText: data.altText,
        displayOrder: data.displayOrder ?? 0,
        isPrimary: false,
      },
    });
  }

  async findImageById(imageId: string): Promise<ProductImage | null> {
    return this.prismaClient.productImage.findUnique({
      where: { id: imageId },
    });
  }

  async removeImage(imageId: string): Promise<ProductImage> {
    return this.prismaClient.productImage.delete({
      where: { id: imageId },
    });
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<ProductImage> {
    return this.prismaClient.$transaction(async tx => {
      await tx.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });

      return tx.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });
  }
}

export const productRepository = new ProductRepository();
