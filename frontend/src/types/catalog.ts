export type ProductAvailability = 'IN_STOCK' | 'MADE_TO_ORDER' | 'SOLD_OUT';

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

export interface ProductImageDto {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductListItemDto {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  price: number;
  compareAtPrice: number | null;
  availability: ProductAvailability | string;
  dimensions: string | null;
  material: string | null;
  weightGrams: number | null;
  isHandmade: boolean;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: ProductImageDto[];
  createdAt: string;
}

export interface ProductDetailDto extends ProductListItemDto {
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
