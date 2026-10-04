import { prisma } from '../db/prisma';
import type { Prisma, Product, ProductImage } from '@prisma/client';

export type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
  };
}>;

export class ProductRepository {
  async findById(id: string): Promise<ProductWithDetails | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<ProductWithDetails | null> {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findBySku(sku: string): Promise<ProductWithDetails | null> {
    return prisma.product.findUnique({
      where: { sku },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findActiveProducts(filter?: {
    categoryId?: string;
    isFeatured?: boolean;
  }): Promise<ProductWithDetails[]> {
    return prisma.product.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.ProductCreateInput): Promise<ProductWithDetails> {
    return prisma.product.create({
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
    return prisma.product.update({
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
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
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
      return prisma.$transaction(async tx => {
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

    return prisma.productImage.create({
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
    return prisma.productImage.findUnique({
      where: { id: imageId },
    });
  }

  async removeImage(imageId: string): Promise<ProductImage> {
    return prisma.productImage.delete({
      where: { id: imageId },
    });
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<ProductImage> {
    return prisma.$transaction(async tx => {
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
