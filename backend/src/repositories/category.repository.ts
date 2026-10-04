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
}

export const categoryRepository = new CategoryRepository();
