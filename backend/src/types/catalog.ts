export interface PublicCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

export interface PublicProductImageDto {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

export interface PublicProductListItemDto {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  price: number;
  compareAtPrice: number | null;
  availability: string;
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
  images: PublicProductImageDto[];
  createdAt: string;
}

export interface PublicProductDetailDto extends PublicProductListItemDto {
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
