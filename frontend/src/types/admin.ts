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

// ============================================================================
// ADMIN ORDER MANAGEMENT TYPES
// ============================================================================

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export interface AdminOrderListItemDto {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerPhone: string;
  shippingRecipientName: string;
  isGuest: boolean;
  userId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number; // in paise
  itemCount: number;
  trackingNumber: string | null;
  courierName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItemSnapshotDto {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string;
  unitPrice: number; // in paise
  quantity: number;
  total: number; // in paise
}

export interface AdminOrderPaymentDto {
  id: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: number; // in paise
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface AdminOrderCustomerDto {
  userId: string | null;
  email: string;
  phone: string;
  isGuest: boolean;
  registeredName?: string | null;
}

export interface AdminOrderShippingAddressDto {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AdminOrderFulfillmentDto {
  trackingNumber: string | null;
  courierName: string | null;
  customerNotes: string | null;
}

export interface AdminOrderDetailsDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number; // in paise
  discountAmount: number; // in paise
  shippingFee: number; // in paise
  taxAmount: number; // in paise
  total: number; // in paise
  currency: string;
  couponCode: string | null;
  customer: AdminOrderCustomerDto;
  shippingAddress: AdminOrderShippingAddressDto;
  items: AdminOrderItemSnapshotDto[];
  payments: AdminOrderPaymentDto[];
  fulfillment: AdminOrderFulfillmentDto;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  from?: string;
  to?: string;
  sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';
}

export interface UpdateAdminOrderStatusInput {
  status: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
}

export interface PaginatedAdminOrdersResponse {
  items: AdminOrderListItemDto[];
  pagination: PaginationMeta;
}
