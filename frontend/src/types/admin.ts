import type { ProductAvailability, ProductImageDto, PaginationMeta } from './catalog';

export interface AdminProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN';
}

export interface AdminSystemInfoDto {
  environment: string;
  serverTime: string;
  version: string;
}

export interface AdminModuleDto {
  id: string;
  name: string;
  description: string;
  status: 'AVAILABLE' | 'PLANNED';
  path?: string;
}

export interface AdminDashboardResponseData {
  admin: AdminProfileDto;
  system: AdminSystemInfoDto;
  modules: AdminModuleDto[];
}

export interface AdminCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductDto {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number; // in paise
  compareAtPrice: number | null; // in paise
  categoryId: string;
  availability: ProductAvailability;
  stockQuantity: number;
  dimensions: string | null;
  material: string | null;
  weightGrams: number | null;
  isHandmade: boolean;
  isFeatured: boolean;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: ProductImageDto[];
  reviews?: Array<{ rating: number }>;
}

export interface AdminInventoryItemDto extends AdminProductDto {
  isLowStock: boolean;
}

export interface AdminProductListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  availability?: ProductAvailability;
  isActive?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'stock_asc' | 'stock_desc';
}

export interface AdminInventoryQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  availability?: ProductAvailability;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'stock_asc' | 'stock_desc';
}

export interface CreateProductInput {
  name: string;
  sku: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number; // in paise
  compareAtPrice?: number | null; // in paise
  categoryId: string;
  availability?: ProductAvailability;
  stockQuantity?: number;
  dimensions?: string;
  material?: string;
  weightGrams?: number | null;
  isHandmade?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  images?: Array<{
    url: string;
    altText?: string;
    displayOrder?: number;
    isPrimary?: boolean;
  }>;
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

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
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

export interface AdjustStockInput {
  stockQuantity?: number;
  adjustment?: number;
  availability?: ProductAvailability;
  expectedStock?: number;
  force?: boolean;
}

export interface PaginatedAdminProductsResponse {
  items: AdminProductDto[];
  pagination: PaginationMeta;
}

export interface PaginatedAdminInventoryResponse {
  items: AdminInventoryItemDto[];
  pagination: PaginationMeta;
}
