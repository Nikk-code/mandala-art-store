import type { Category } from '@prisma/client';
import { categoryRepository, type CategoryRepository } from '../repositories/category.repository';
import { ConflictError, NotFoundError } from '../errors';
import {
  validateCategoryName,
  validateSlug,
  generateSlug,
  validateOptionalImageUrl,
} from '../utils/catalog-validation';

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoryWithProductCount extends Category {
  productCount: number;
}

export class CategoryService {
  constructor(private readonly repo: CategoryRepository = categoryRepository) {}

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const name = validateCategoryName(input.name);
    const slug = input.slug ? validateSlug(input.slug, 120) : generateSlug(name);
    const imageUrl = validateOptionalImageUrl(input.imageUrl, 'Category image URL');

    // Uniqueness validation
    const existingByName = await this.repo.findByName(name);
    if (existingByName) {
      throw new ConflictError(`Category with name "${name}" already exists`);
    }

    const existingBySlug = await this.repo.findBySlug(slug);
    if (existingBySlug) {
      throw new ConflictError(`Category with slug "${slug}" already exists`);
    }

    return this.repo.create({
      name,
      slug,
      description: input.description ?? null,
      imageUrl,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
    });
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new NotFoundError(`Category not found with ID: ${id}`);
    }
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const validSlug = validateSlug(slug, 120);
    const category = await this.repo.findBySlug(validSlug);
    if (!category || !category.isActive) {
      throw new NotFoundError(`Category not found with slug: ${validSlug}`);
    }
    return category;
  }

  async listActiveCategories(): Promise<Category[]> {
    return this.repo.findActiveCategories();
  }

  async listAllCategories(): Promise<CategoryWithProductCount[]> {
    const categories = await this.repo.findAllCategories();
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      productCount: cat._count.products,
    }));
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const existing = await this.getCategoryById(id);

    let updatedName: string | undefined;
    if (input.name !== undefined) {
      updatedName = validateCategoryName(input.name);
      if (updatedName !== existing.name) {
        const existingByName = await this.repo.findByName(updatedName);
        if (existingByName && existingByName.id !== id) {
          throw new ConflictError(`Category with name "${updatedName}" already exists`);
        }
      }
    }

    let updatedSlug: string | undefined;
    if (input.slug !== undefined) {
      updatedSlug = validateSlug(input.slug, 120);
      if (updatedSlug !== existing.slug) {
        const existingBySlug = await this.repo.findBySlug(updatedSlug);
        if (existingBySlug && existingBySlug.id !== id) {
          throw new ConflictError(`Category with slug "${updatedSlug}" already exists`);
        }
      }
    }

    let updatedImageUrl: string | null | undefined;
    if (input.imageUrl !== undefined) {
      updatedImageUrl = validateOptionalImageUrl(input.imageUrl, 'Category image URL');
    }

    // Check safeguard if deactivating
    if (input.isActive === false && existing.isActive) {
      const activeProductCount = this.repo.countActiveProductsByCategoryId
        ? await this.repo.countActiveProductsByCategoryId(id)
        : 0;
      if (activeProductCount > 0) {
        throw new ConflictError(
          `Cannot deactivate category "${existing.name}" because ${activeProductCount} active product(s) belong to it. Deactivate or reassign those products first.`
        );
      }
    }

    return this.repo.update(id, {
      ...(updatedName !== undefined ? { name: updatedName } : {}),
      ...(updatedSlug !== undefined ? { slug: updatedSlug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: updatedImageUrl } : {}),
      ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  }

  async toggleCategoryActive(id: string, isActive: boolean): Promise<Category> {
    const existing = await this.getCategoryById(id);

    if (existing.isActive === isActive) {
      return existing;
    }

    if (!isActive) {
      const activeProductCount = this.repo.countActiveProductsByCategoryId
        ? await this.repo.countActiveProductsByCategoryId(id)
        : 0;
      if (activeProductCount > 0) {
        throw new ConflictError(
          `Cannot deactivate category "${existing.name}" because ${activeProductCount} active product(s) belong to it. Deactivate or reassign those products first.`
        );
      }
      return this.repo.deactivate(id);
    }

    return this.repo.activate(id);
  }

  async deactivateCategory(id: string): Promise<Category> {
    return this.toggleCategoryActive(id, false);
  }

  async deleteCategory(id: string): Promise<Category> {
    const existing = await this.getCategoryById(id);
    const totalProducts = this.repo.countAllProductsByCategoryId
      ? await this.repo.countAllProductsByCategoryId(id)
      : 0;
    if (totalProducts > 0) {
      throw new ConflictError(
        `Cannot delete category "${existing.name}" because ${totalProducts} product(s) are associated with it.`
      );
    }

    return this.repo.delete(id);
  }
}

export const categoryService = new CategoryService();
