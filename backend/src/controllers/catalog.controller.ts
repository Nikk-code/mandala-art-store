import type { Request, Response, NextFunction } from 'express';
import { categoryService, productService } from '../services';
import { ValidationError } from '../errors';
import type {
  ApiSuccessResponse,
  PublicCategoryDto,
  PublicProductListItemDto,
  PublicProductDetailDto,
  PaginatedData,
} from '../types';
import type { ProductAvailability } from '@prisma/client';

export async function getCategories(
  _req: Request,
  res: Response<ApiSuccessResponse<PublicCategoryDto[]>>,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await categoryService.listActiveCategories();

    const data: PublicCategoryDto[] = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      displayOrder: cat.displayOrder,
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProducts(
  req: Request,
  res: Response<ApiSuccessResponse<PaginatedData<PublicProductListItemDto>>>,
  next: NextFunction
): Promise<void> {
  try {
    const { page, pageSize, category, availability, featured, sort } = req.query;

    let parsedPage: number | undefined;
    if (page !== undefined) {
      const num = Number(page);
      if (!Number.isInteger(num) || num < 1) {
        throw new ValidationError('Query parameter "page" must be a positive integer');
      }
      parsedPage = num;
    }

    let parsedPageSize: number | undefined;
    if (pageSize !== undefined) {
      const num = Number(pageSize);
      if (!Number.isInteger(num) || num < 1 || num > 100) {
        throw new ValidationError(
          'Query parameter "pageSize" must be an integer between 1 and 100'
        );
      }
      parsedPageSize = num;
    }

    let parsedFeatured: boolean | undefined;
    if (featured !== undefined) {
      if (featured === 'true') {
        parsedFeatured = true;
      } else if (featured === 'false') {
        parsedFeatured = false;
      } else {
        throw new ValidationError('Query parameter "featured" must be either "true" or "false"');
      }
    }

    const result = await productService.listActiveProductsPaginated({
      page: parsedPage,
      pageSize: parsedPageSize,
      category: typeof category === 'string' ? category : undefined,
      availability:
        typeof availability === 'string' ? (availability as ProductAvailability) : undefined,
      featured: parsedFeatured,
      sort: typeof sort === 'string' ? (sort as 'newest' | 'price_asc' | 'price_desc') : undefined,
    });

    const items: PublicProductListItemDto[] = result.items.map(prod => ({
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      slug: prod.slug,
      shortDescription: prod.shortDescription,
      description: prod.description,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice,
      availability: prod.availability,
      dimensions: prod.dimensions,
      material: prod.material,
      weightGrams: prod.weightGrams,
      isHandmade: prod.isHandmade,
      isFeatured: prod.isFeatured,
      category: {
        id: prod.category.id,
        name: prod.category.name,
        slug: prod.category.slug,
      },
      images: prod.images.map(img => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        displayOrder: img.displayOrder,
        isPrimary: img.isPrimary,
      })),
      createdAt: prod.createdAt.toISOString(),
    }));

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductBySlug(
  req: Request,
  res: Response<ApiSuccessResponse<PublicProductDetailDto>>,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;
    const prod = await productService.getProductBySlug(slug);

    const data: PublicProductDetailDto = {
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      slug: prod.slug,
      shortDescription: prod.shortDescription,
      description: prod.description,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice,
      availability: prod.availability,
      dimensions: prod.dimensions,
      material: prod.material,
      weightGrams: prod.weightGrams,
      isHandmade: prod.isHandmade,
      isFeatured: prod.isFeatured,
      metaTitle: prod.metaTitle,
      metaDescription: prod.metaDescription,
      category: {
        id: prod.category.id,
        name: prod.category.name,
        slug: prod.category.slug,
        description: prod.category.description,
      },
      images: prod.images.map(img => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        displayOrder: img.displayOrder,
        isPrimary: img.isPrimary,
      })),
      createdAt: prod.createdAt.toISOString(),
      updatedAt: prod.updatedAt.toISOString(),
    };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
