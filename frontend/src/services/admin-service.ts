import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api-client';
import type {
  AdminDashboardResponseData,
  AdminCategoryDto,
  AdminProductDto,
  AdminInventoryItemDto,
  AdminProductListQuery,
  AdminInventoryQuery,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  AdjustStockInput,
  PaginatedAdminProductsResponse,
  PaginatedAdminInventoryResponse,
  ProductImageDto,
  AdminOrderListItemDto,
  AdminOrderDetailsDto,
  AdminOrderListQuery,
  UpdateAdminOrderStatusInput,
  PaginatedAdminOrdersResponse,
} from '@/types';

/**
 * Fetches administrator dashboard metadata and authenticated admin identity.
 * Protected by requireAuth and requireAdmin on the backend.
 */
export async function fetchAdminDashboard(): Promise<AdminDashboardResponseData> {
  const response = await apiGet<{ success: boolean; data: AdminDashboardResponseData }>(
    'admin/dashboard'
  );
  return response.data;
}

// ============================================================================
// PRODUCT MANAGEMENT
// ============================================================================

export async function fetchAdminProducts(
  query: AdminProductListQuery = {}
): Promise<PaginatedAdminProductsResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.pageSize) params.set('pageSize', query.pageSize.toString());
  if (query.search) params.set('search', query.search);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.availability) params.set('availability', query.availability);
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  if (query.sort) params.set('sort', query.sort);

  const queryString = params.toString();
  const path = queryString ? `admin/products?${queryString}` : 'admin/products';

  const response = await apiGet<{
    success: boolean;
    data: AdminProductDto[];
    pagination: PaginatedAdminProductsResponse['pagination'];
  }>(path);

  return {
    items: response.data,
    pagination: response.pagination,
  };
}

export async function fetchAdminProductById(id: string): Promise<AdminProductDto> {
  const response = await apiGet<{ success: boolean; data: AdminProductDto }>(
    `admin/products/${encodeURIComponent(id)}`
  );
  return response.data;
}

export async function createAdminProduct(input: CreateProductInput): Promise<AdminProductDto> {
  const response = await apiPost<{ success: boolean; data: AdminProductDto }>(
    'admin/products',
    input
  );
  return response.data;
}

export async function updateAdminProduct(
  id: string,
  input: UpdateProductInput
): Promise<AdminProductDto> {
  const response = await apiPut<{ success: boolean; data: AdminProductDto }>(
    `admin/products/${encodeURIComponent(id)}`,
    input
  );
  return response.data;
}

export async function toggleAdminProductStatus(
  id: string,
  isActive: boolean
): Promise<AdminProductDto> {
  const response = await apiPatch<{ success: boolean; data: AdminProductDto }>(
    `admin/products/${encodeURIComponent(id)}/status`,
    { isActive }
  );
  return response.data;
}

export async function addAdminProductImage(
  productId: string,
  data: { url: string; altText?: string; displayOrder?: number; isPrimary?: boolean }
): Promise<ProductImageDto> {
  const response = await apiPost<{ success: boolean; data: ProductImageDto }>(
    `admin/products/${encodeURIComponent(productId)}/images`,
    data
  );
  return response.data;
}

export async function removeAdminProductImage(productId: string, imageId: string): Promise<void> {
  await apiDelete<{ success: boolean }>(
    `admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`
  );
}

export async function setPrimaryAdminProductImage(
  productId: string,
  imageId: string
): Promise<void> {
  await apiPost<{ success: boolean }>(
    `admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}/primary`
  );
}

// ============================================================================
// CATEGORY MANAGEMENT
// ============================================================================

export async function fetchAdminCategories(): Promise<AdminCategoryDto[]> {
  const response = await apiGet<{ success: boolean; data: AdminCategoryDto[] }>('admin/categories');
  return response.data;
}

export async function fetchAdminCategoryById(id: string): Promise<AdminCategoryDto> {
  const response = await apiGet<{ success: boolean; data: AdminCategoryDto }>(
    `admin/categories/${encodeURIComponent(id)}`
  );
  return response.data;
}

export async function createAdminCategory(input: CreateCategoryInput): Promise<AdminCategoryDto> {
  const response = await apiPost<{ success: boolean; data: AdminCategoryDto }>(
    'admin/categories',
    input
  );
  return response.data;
}

export async function updateAdminCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<AdminCategoryDto> {
  const response = await apiPut<{ success: boolean; data: AdminCategoryDto }>(
    `admin/categories/${encodeURIComponent(id)}`,
    input
  );
  return response.data;
}

export async function toggleAdminCategoryStatus(
  id: string,
  isActive: boolean
): Promise<AdminCategoryDto> {
  const response = await apiPatch<{ success: boolean; data: AdminCategoryDto }>(
    `admin/categories/${encodeURIComponent(id)}/status`,
    { isActive }
  );
  return response.data;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await apiDelete<{ success: boolean }>(`admin/categories/${encodeURIComponent(id)}`);
}

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

export async function fetchAdminInventory(
  query: AdminInventoryQuery = {}
): Promise<PaginatedAdminInventoryResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.pageSize) params.set('pageSize', query.pageSize.toString());
  if (query.search) params.set('search', query.search);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.availability) params.set('availability', query.availability);
  if (query.sort) params.set('sort', query.sort);

  const queryString = params.toString();
  const path = queryString ? `admin/inventory?${queryString}` : 'admin/inventory';

  const response = await apiGet<{
    success: boolean;
    data: AdminInventoryItemDto[];
    pagination: PaginatedAdminInventoryResponse['pagination'];
  }>(path);

  return {
    items: response.data,
    pagination: response.pagination,
  };
}

export async function adjustAdminInventory(
  productId: string,
  input: AdjustStockInput
): Promise<AdminProductDto> {
  const response = await apiPatch<{ success: boolean; data: AdminProductDto }>(
    `admin/inventory/${encodeURIComponent(productId)}`,
    input
  );
  return response.data;
}

// ============================================================================
// ORDER MANAGEMENT & FULFILLMENT
// ============================================================================

export async function fetchAdminOrders(
  query: AdminOrderListQuery = {}
): Promise<PaginatedAdminOrdersResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.pageSize) params.set('pageSize', query.pageSize.toString());
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.paymentStatus) params.set('paymentStatus', query.paymentStatus);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.sort) params.set('sort', query.sort);

  const queryString = params.toString();
  const path = queryString ? `admin/orders?${queryString}` : 'admin/orders';

  const response = await apiGet<{
    success: boolean;
    data: AdminOrderListItemDto[];
    pagination: PaginatedAdminOrdersResponse['pagination'];
  }>(path);

  return {
    items: response.data,
    pagination: response.pagination,
  };
}

export async function fetchAdminOrderById(id: string): Promise<AdminOrderDetailsDto> {
  const response = await apiGet<{ success: boolean; data: AdminOrderDetailsDto }>(
    `admin/orders/${encodeURIComponent(id)}`
  );
  return response.data;
}

export async function updateAdminOrderStatus(
  id: string,
  input: UpdateAdminOrderStatusInput
): Promise<AdminOrderDetailsDto> {
  const response = await apiPatch<{ success: boolean; data: AdminOrderDetailsDto }>(
    `admin/orders/${encodeURIComponent(id)}/status`,
    input
  );
  return response.data;
}
