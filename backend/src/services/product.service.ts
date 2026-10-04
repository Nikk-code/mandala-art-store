import { ProductAvailability, type Product, type ProductImage } from '@prisma/client';
import {
  productRepository,
  type ProductRepository,
  type ProductWithDetails,
} from '../repositories/product.repository';
import { categoryRepository, type CategoryRepository } from '../repositories/category.repository';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import {
  validateProductName,
  validateSku,
  validateSlug,
  generateSlug,
  validatePriceInPaise,
  validateStockQuantity,
  validateAvailability,
} from '../utils/catalog-validation';

export interface CreateProductImageInput {
  url: string;
  altText?: string | null;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  slug?: string;
  description: string;
  shortDescription?: string | null;
  price: number; // in paise
  compareAtPrice?: number | null; // in paise
  categoryId: string;
  availability?: ProductAvailability;
  stockQuantity?: number;
  dimensions?: string | null;
  material?: string | null;
  weightGrams?: number | null;
  isHandmade?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  images?: CreateProductImageInput[];
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  slug?: string;
  description?: string;
  shortDescription?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  categoryId?: string;
  availability?: ProductAvailability;
  stockQuantity?: number;
  dimensions?: string | null;
  material?: string | null;
  weightGrams?: number | null;
  isHandmade?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface ListProductsQuery {
  page?: number;
  pageSize?: number;
  category?: string; // category slug
  availability?: ProductAvailability;
  featured?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

export interface PaginatedProductsResult {
  items: ProductWithDetails[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export class ProductService {
  constructor(
    private readonly repo: ProductRepository = productRepository,
    private readonly categoryRepo: CategoryRepository = categoryRepository
  ) {}

  async createProduct(input: CreateProductInput): Promise<ProductWithDetails> {
    const name = validateProductName(input.name);
    const sku = validateSku(input.sku);
    const slug = input.slug ? validateSlug(input.slug) : generateSlug(name);
    const price = validatePriceInPaise(input.price, 'Price');

    let compareAtPrice: number | null = null;
    if (input.compareAtPrice !== undefined && input.compareAtPrice !== null) {
      compareAtPrice = validatePriceInPaise(input.compareAtPrice, 'Compare-at price');
    }

    const stockQuantity = validateStockQuantity(input.stockQuantity ?? 0);
    const availability = input.availability
      ? validateAvailability(input.availability)
      : stockQuantity > 0
        ? ProductAvailability.IN_STOCK
        : ProductAvailability.SOLD_OUT;

    // Validate availability consistency against stock rules (.ai/BUSINESS-RULES.md Section 1)
    if (availability === ProductAvailability.SOLD_OUT && stockQuantity > 0) {
      throw new ValidationError('A SOLD_OUT product cannot have stock quantity greater than 0');
    }
    if (availability === ProductAvailability.IN_STOCK && stockQuantity === 0) {
      throw new ValidationError('An IN_STOCK product must have a stock quantity greater than 0');
    }

    if (!input.description || typeof input.description !== 'string' || !input.description.trim()) {
      throw new ValidationError('Product description is required');
    }

    // Verify category exists and is active
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) {
      throw new NotFoundError(`Category with ID "${input.categoryId}" not found`);
    }
    if (!category.isActive) {
      throw new ValidationError(`Cannot assign product to inactive category: "${category.name}"`);
    }

    // Check SKU uniqueness
    const existingBySku = await this.repo.findBySku(sku);
    if (existingBySku) {
      throw new ConflictError(`Product with SKU "${sku}" already exists`);
    }

    // Check Slug uniqueness
    const existingBySlug = await this.repo.findBySlug(slug);
    if (existingBySlug) {
      throw new ConflictError(`Product with slug "${slug}" already exists`);
    }

    // Prepare images creation
    const imageCreateData = input.images?.map((img, index) => {
      if (!img.url || typeof img.url !== 'string') {
        throw new ValidationError('Product image URL is required');
      }
      return {
        url: img.url.trim(),
        altText: img.altText ?? null,
        displayOrder: img.displayOrder ?? index,
        isPrimary: img.isPrimary ?? index === 0,
      };
    });

    return this.repo.create({
      sku,
      name,
      slug,
      description: input.description.trim(),
      shortDescription: input.shortDescription ?? null,
      price,
      compareAtPrice,
      category: { connect: { id: input.categoryId } },
      availability,
      stockQuantity,
      dimensions: input.dimensions ?? null,
      material: input.material ?? null,
      weightGrams: input.weightGrams ?? null,
      isHandmade: input.isHandmade ?? true,
      isFeatured: input.isFeatured ?? false,
      isActive: input.isActive ?? true,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      ...(imageCreateData && imageCreateData.length > 0
        ? {
            images: {
              create: imageCreateData,
            },
          }
        : {}),
    });
  }

  async getProductById(id: string): Promise<ProductWithDetails> {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }
    return product;
  }

  async getProductBySlug(
    slug: string,
    options?: { includeInactive?: boolean }
  ): Promise<ProductWithDetails> {
    const validSlug = validateSlug(slug);
    const product = await this.repo.findBySlug(validSlug);
    if (!product || (!options?.includeInactive && !product.isActive)) {
      throw new NotFoundError(`Product not found with slug: ${validSlug}`);
    }
    return product;
  }

  async getProductBySku(sku: string): Promise<ProductWithDetails> {
    const validSku = validateSku(sku);
    const product = await this.repo.findBySku(validSku);
    if (!product) {
      throw new NotFoundError(`Product not found with SKU: ${validSku}`);
    }
    return product;
  }

  async listActiveProducts(filter?: {
    categoryId?: string;
    isFeatured?: boolean;
  }): Promise<ProductWithDetails[]> {
    if (filter?.categoryId) {
      const category = await this.categoryRepo.findById(filter.categoryId);
      if (!category || !category.isActive) {
        throw new NotFoundError(`Active category not found with ID: ${filter.categoryId}`);
      }
    }

    return this.repo.findActiveProducts(filter);
  }

  async listActiveProductsPaginated(query: ListProductsQuery): Promise<PaginatedProductsResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    if (!Number.isInteger(page) || page < 1) {
      throw new ValidationError('Page must be a positive integer greater than or equal to 1');
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new ValidationError('Page size must be a positive integer between 1 and 100');
    }

    let categoryId: string | undefined;
    if (query.category) {
      const validCategorySlug = validateSlug(query.category, 120);
      const category = await this.categoryRepo.findBySlug(validCategorySlug);
      if (!category || !category.isActive) {
        throw new NotFoundError(`Active category not found with slug: ${validCategorySlug}`);
      }
      categoryId = category.id;
    }

    let availability: ProductAvailability | undefined;
    if (query.availability) {
      availability = validateAvailability(query.availability);
    }

    if (query.sort !== undefined && !['newest', 'price_asc', 'price_desc'].includes(query.sort)) {
      throw new ValidationError(
        'Invalid sort option. Must be one of: newest, price_asc, price_desc'
      );
    }

    const { items, totalItems } = await this.repo.findActiveProductsPaginated({
      filter: {
        categoryId,
        availability,
        isFeatured: query.featured,
      },
      pagination: {
        skip: (page - 1) * pageSize,
        take: pageSize,
      },
      sort: query.sort,
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<ProductWithDetails> {
    const existing = await this.getProductById(id);

    let updatedName: string | undefined;
    if (input.name !== undefined) {
      updatedName = validateProductName(input.name);
    }

    let updatedSku: string | undefined;
    if (input.sku !== undefined) {
      updatedSku = validateSku(input.sku);
      if (updatedSku !== existing.sku) {
        const existingBySku = await this.repo.findBySku(updatedSku);
        if (existingBySku && existingBySku.id !== id) {
          throw new ConflictError(`Product with SKU "${updatedSku}" already exists`);
        }
      }
    }

    let updatedSlug: string | undefined;
    if (input.slug !== undefined) {
      updatedSlug = validateSlug(input.slug);
      if (updatedSlug !== existing.slug) {
        const existingBySlug = await this.repo.findBySlug(updatedSlug);
        if (existingBySlug && existingBySlug.id !== id) {
          throw new ConflictError(`Product with slug "${updatedSlug}" already exists`);
        }
      }
    }

    let updatedPrice: number | undefined;
    if (input.price !== undefined) {
      updatedPrice = validatePriceInPaise(input.price, 'Price');
    }

    let updatedCompareAtPrice: number | null | undefined;
    if (input.compareAtPrice !== undefined) {
      updatedCompareAtPrice =
        input.compareAtPrice === null
          ? null
          : validatePriceInPaise(input.compareAtPrice, 'Compare-at price');
    }

    let updatedStockQuantity: number | undefined;
    if (input.stockQuantity !== undefined) {
      updatedStockQuantity = validateStockQuantity(input.stockQuantity);
    }

    let updatedAvailability: ProductAvailability | undefined;
    if (input.availability !== undefined) {
      updatedAvailability = validateAvailability(input.availability);
    }

    // Determine final availability and stock rules
    const finalStock =
      updatedStockQuantity !== undefined ? updatedStockQuantity : existing.stockQuantity;
    const finalAvailability =
      updatedAvailability !== undefined ? updatedAvailability : existing.availability;

    if (finalAvailability === ProductAvailability.SOLD_OUT && finalStock > 0) {
      throw new ValidationError('A SOLD_OUT product cannot have stock quantity greater than 0');
    }
    if (finalAvailability === ProductAvailability.IN_STOCK && finalStock === 0) {
      throw new ValidationError('An IN_STOCK product must have a stock quantity greater than 0');
    }

    if (input.categoryId !== undefined) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) {
        throw new NotFoundError(`Category with ID "${input.categoryId}" not found`);
      }
      if (!category.isActive) {
        throw new ValidationError(`Cannot assign product to inactive category: "${category.name}"`);
      }
    }

    return this.repo.update(id, {
      ...(updatedName !== undefined ? { name: updatedName } : {}),
      ...(updatedSku !== undefined ? { sku: updatedSku } : {}),
      ...(updatedSlug !== undefined ? { slug: updatedSlug } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
      ...(updatedPrice !== undefined ? { price: updatedPrice } : {}),
      ...(updatedCompareAtPrice !== undefined ? { compareAtPrice: updatedCompareAtPrice } : {}),
      ...(input.categoryId !== undefined
        ? { category: { connect: { id: input.categoryId } } }
        : {}),
      ...(updatedAvailability !== undefined ? { availability: updatedAvailability } : {}),
      ...(updatedStockQuantity !== undefined ? { stockQuantity: updatedStockQuantity } : {}),
      ...(input.dimensions !== undefined ? { dimensions: input.dimensions } : {}),
      ...(input.material !== undefined ? { material: input.material } : {}),
      ...(input.weightGrams !== undefined ? { weightGrams: input.weightGrams } : {}),
      ...(input.isHandmade !== undefined ? { isHandmade: input.isHandmade } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
      ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
    });
  }

  async deactivateProduct(id: string): Promise<Product> {
    await this.getProductById(id);
    return this.repo.deactivate(id);
  }

  // --- Product Image Management Logic ---

  async addImage(productId: string, input: CreateProductImageInput): Promise<ProductImage> {
    await this.getProductById(productId);

    if (!input.url || typeof input.url !== 'string' || !input.url.trim()) {
      throw new ValidationError('Image URL is required');
    }

    return this.repo.addImage(productId, {
      url: input.url.trim(),
      altText: input.altText ?? null,
      displayOrder: input.displayOrder ?? 0,
      isPrimary: input.isPrimary ?? false,
    });
  }

  async removeImage(productId: string, imageId: string): Promise<ProductImage> {
    await this.getProductById(productId);

    const image = await this.repo.findImageById(imageId);
    if (!image || image.productId !== productId) {
      throw new NotFoundError(`Image with ID "${imageId}" not found for product "${productId}"`);
    }

    const deleted = await this.repo.removeImage(imageId);

    // If removed image was primary, ensure another remaining image is promoted to primary
    if (image.isPrimary) {
      const remaining = await this.repo.findById(productId);
      if (remaining && remaining.images.length > 0) {
        await this.repo.setPrimaryImage(productId, remaining.images[0].id);
      }
    }

    return deleted;
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<ProductImage> {
    await this.getProductById(productId);

    const image = await this.repo.findImageById(imageId);
    if (!image || image.productId !== productId) {
      throw new NotFoundError(`Image with ID "${imageId}" not found for product "${productId}"`);
    }

    return this.repo.setPrimaryImage(productId, imageId);
  }
}

export const productService = new ProductService();
