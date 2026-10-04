import { apiGet } from './api-client';
import type {
  ApiSuccessResponse,
  CategoryDto,
  ProductListItemDto,
  ProductDetailDto,
  PaginatedData,
} from '@/types';

export interface ProductQueryOptions {
  page?: number;
  pageSize?: number;
  category?: string;
  availability?: string;
  featured?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

export async function fetchCategories(): Promise<CategoryDto[]> {
  const response = await apiGet<ApiSuccessResponse<CategoryDto[]>>('categories');
  return response.data;
}

export async function fetchProducts(
  options?: ProductQueryOptions
): Promise<PaginatedData<ProductListItemDto>> {
  const params = new URLSearchParams();

  if (options?.page !== undefined) {
    params.set('page', String(options.page));
  }
  if (options?.pageSize !== undefined) {
    params.set('pageSize', String(options.pageSize));
  }
  if (options?.category) {
    params.set('category', options.category);
  }
  if (options?.availability) {
    params.set('availability', options.availability);
  }
  if (options?.featured !== undefined) {
    params.set('featured', String(options.featured));
  }
  if (options?.sort) {
    params.set('sort', options.sort);
  }

  const query = params.toString();
  const endpoint = query ? `products?${query}` : 'products';

  const response = await apiGet<ApiSuccessResponse<PaginatedData<ProductListItemDto>>>(endpoint);
  return response.data;
}

export async function fetchFeaturedProducts(pageSize: number = 8): Promise<ProductListItemDto[]> {
  const result = await fetchProducts({ featured: true, pageSize });
  return result.items;
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetailDto> {
  const response = await apiGet<ApiSuccessResponse<ProductDetailDto>>(
    `products/${encodeURIComponent(slug)}`
  );
  return response.data;
}
