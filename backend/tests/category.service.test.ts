import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoryService } from '../src/services/category.service';
import type { CategoryRepository } from '../src/repositories/category.repository';
import { ConflictError, NotFoundError, ValidationError } from '../src/errors';
import type { Category } from '@prisma/client';

describe('CategoryService Domain Logic', () => {
  let mockCategoryRepo: CategoryRepository;
  let service: CategoryService;

  const sampleCategory: Category = {
    id: 'cat-123',
    name: 'Mandala Art',
    slug: 'mandala-art',
    description: 'Handmade mandala artworks',
    imageUrl: 'https://example.com/mandala.jpg',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    mockCategoryRepo = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByName: vi.fn(),
      findActiveCategories: vi.fn(),
      findAllCategories: vi.fn(),
      countActiveProductsByCategoryId: vi.fn().mockResolvedValue(0),
      countAllProductsByCategoryId: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      deactivate: vi.fn(),
      activate: vi.fn(),
      delete: vi.fn(),
    } as unknown as CategoryRepository;

    service = new CategoryService(mockCategoryRepo);
  });

  describe('createCategory', () => {
    it('creates a category with generated slug when slug is not explicitly provided', async () => {
      vi.spyOn(mockCategoryRepo, 'findByName').mockResolvedValue(null);
      vi.spyOn(mockCategoryRepo, 'findBySlug').mockResolvedValue(null);
      vi.spyOn(mockCategoryRepo, 'create').mockResolvedValue(sampleCategory);

      const result = await service.createCategory({
        name: 'Mandala Art',
        description: 'Handmade mandala artworks',
      });

      expect(mockCategoryRepo.findByName).toHaveBeenCalledWith('Mandala Art');
      expect(mockCategoryRepo.findBySlug).toHaveBeenCalledWith('mandala-art');
      expect(mockCategoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mandala Art',
          slug: 'mandala-art',
          isActive: true,
        })
      );
      expect(result).toEqual(sampleCategory);
    });

    it('rejects duplicate category name with ConflictError', async () => {
      vi.spyOn(mockCategoryRepo, 'findByName').mockResolvedValue(sampleCategory);

      await expect(
        service.createCategory({
          name: 'Mandala Art',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('rejects duplicate category slug with ConflictError', async () => {
      vi.spyOn(mockCategoryRepo, 'findByName').mockResolvedValue(null);
      vi.spyOn(mockCategoryRepo, 'findBySlug').mockResolvedValue(sampleCategory);

      await expect(
        service.createCategory({
          name: 'Mandala Art',
          slug: 'mandala-art',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('rejects invalid category names with ValidationError', async () => {
      await expect(
        service.createCategory({
          name: '',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCategoryById', () => {
    it('returns category when found', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);

      const result = await service.getCategoryById('cat-123');
      expect(result).toEqual(sampleCategory);
    });

    it('throws NotFoundError when category is not found', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(null);

      await expect(service.getCategoryById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCategoryBySlug', () => {
    it('returns active category by slug', async () => {
      vi.spyOn(mockCategoryRepo, 'findBySlug').mockResolvedValue(sampleCategory);

      const result = await service.getCategoryBySlug('mandala-art');
      expect(result).toEqual(sampleCategory);
    });

    it('throws NotFoundError if category is inactive', async () => {
      vi.spyOn(mockCategoryRepo, 'findBySlug').mockResolvedValue({
        ...sampleCategory,
        isActive: false,
      });

      await expect(service.getCategoryBySlug('mandala-art')).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError if category does not exist', async () => {
      vi.spyOn(mockCategoryRepo, 'findBySlug').mockResolvedValue(null);

      await expect(service.getCategoryBySlug('unknown-art')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listActiveCategories', () => {
    it('delegates to repository to list active categories', async () => {
      vi.spyOn(mockCategoryRepo, 'findActiveCategories').mockResolvedValue([sampleCategory]);

      const result = await service.listActiveCategories();
      expect(result).toEqual([sampleCategory]);
      expect(mockCategoryRepo.findActiveCategories).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateCategory', () => {
    it('updates category successfully when valid', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockCategoryRepo, 'findByName').mockResolvedValue(null);
      vi.spyOn(mockCategoryRepo, 'findBySlug').mockResolvedValue(null);
      vi.spyOn(mockCategoryRepo, 'update').mockResolvedValue({
        ...sampleCategory,
        name: 'Sacred Mandala Art',
      });

      const result = await service.updateCategory('cat-123', {
        name: 'Sacred Mandala Art',
      });

      expect(result.name).toBe('Sacred Mandala Art');
    });

    it('throws ConflictError if updating to an already existing category name', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockCategoryRepo, 'findByName').mockResolvedValue({
        ...sampleCategory,
        id: 'cat-456',
        name: 'Lippan Art',
      });

      await expect(
        service.updateCategory('cat-123', {
          name: 'Lippan Art',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deactivateCategory & toggleCategoryActive', () => {
    it('deactivates category when no active products depend on it', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockCategoryRepo, 'countActiveProductsByCategoryId').mockResolvedValue(0);
      vi.spyOn(mockCategoryRepo, 'deactivate').mockResolvedValue({
        ...sampleCategory,
        isActive: false,
      });

      const result = await service.deactivateCategory('cat-123');
      expect(result.isActive).toBe(false);
      expect(mockCategoryRepo.deactivate).toHaveBeenCalledWith('cat-123');
    });

    it('rejects deactivation when active products depend on the category', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockCategoryRepo, 'countActiveProductsByCategoryId').mockResolvedValue(3);

      await expect(service.deactivateCategory('cat-123')).rejects.toThrow(ConflictError);
      expect(mockCategoryRepo.deactivate).not.toHaveBeenCalled();
    });

    it('activates category when toggle is set to true', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue({
        ...sampleCategory,
        isActive: false,
      });
      vi.spyOn(mockCategoryRepo, 'activate').mockResolvedValue({
        ...sampleCategory,
        isActive: true,
      });

      const result = await service.toggleCategoryActive('cat-123', true);
      expect(result.isActive).toBe(true);
      expect(mockCategoryRepo.activate).toHaveBeenCalledWith('cat-123');
    });
  });

  describe('deleteCategory', () => {
    it('deletes category when no products depend on it', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockCategoryRepo, 'countAllProductsByCategoryId').mockResolvedValue(0);
      vi.spyOn(mockCategoryRepo, 'delete').mockResolvedValue(sampleCategory);

      const result = await service.deleteCategory('cat-123');
      expect(result).toEqual(sampleCategory);
      expect(mockCategoryRepo.delete).toHaveBeenCalledWith('cat-123');
    });

    it('rejects deletion with ConflictError when products are associated with category', async () => {
      vi.spyOn(mockCategoryRepo, 'findById').mockResolvedValue(sampleCategory);
      vi.spyOn(mockCategoryRepo, 'countAllProductsByCategoryId').mockResolvedValue(2);

      await expect(service.deleteCategory('cat-123')).rejects.toThrow(ConflictError);
      expect(mockCategoryRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('listAllCategories', () => {
    it('returns categories with mapped productCount', async () => {
      vi.spyOn(mockCategoryRepo, 'findAllCategories').mockResolvedValue([
        {
          ...sampleCategory,
          _count: { products: 5 },
        },
      ]);

      const result = await service.listAllCategories();
      expect(result).toHaveLength(1);
      expect(result[0].productCount).toBe(5);
    });
  });
});
