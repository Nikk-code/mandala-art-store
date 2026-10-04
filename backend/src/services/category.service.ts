import type { Category } from '@prisma/client';
import { categoryRepository, type CategoryRepository } from '../repositories/category.repository';
import { ConflictError, NotFoundError } from '../errors';
import { validateCategoryName, validateSlug, generateSlug } from '../utils/catalog-validation';

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

export class CategoryService {
  constructor(private readonly repo: CategoryRepository = categoryRepository) {}

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const name = validateCategoryName(input.name);
    const slug = input.slug ? validateSlug(input.slug, 120) : generateSlug(name);

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
      imageUrl: input.imageUrl ?? null,
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

    return this.repo.update(id, {
      ...(updatedName !== undefined ? { name: updatedName } : {}),
      ...(updatedSlug !== undefined ? { slug: updatedSlug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  }

  async deactivateCategory(id: string): Promise<Category> {
    await this.getCategoryById(id);
    return this.repo.deactivate(id);
  }
}

export const categoryService = new CategoryService();
