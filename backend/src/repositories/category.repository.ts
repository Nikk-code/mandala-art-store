import { prisma } from '../db/prisma';
import type { Category, Prisma } from '@prisma/client';

export class CategoryRepository {
  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { slug },
    });
  }

  async findByName(name: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { name },
    });
  }

  async findActiveCategories(): Promise<Category[]> {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAllCategories(): Promise<Array<Category & { _count: { products: number } }>> {
    return prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async countActiveProductsByCategoryId(categoryId: string): Promise<number> {
    return prisma.product.count({
      where: {
        categoryId,
        isActive: true,
      },
    });
  }

  async countAllProductsByCategoryId(categoryId: string): Promise<number> {
    return prisma.product.count({
      where: {
        categoryId,
      },
    });
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({
      data,
    });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: string): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async delete(id: string): Promise<Category> {
    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryRepository = new CategoryRepository();
