import type { OrderStatus, PaymentStatus } from '@prisma/client';
import type { PaginationMeta } from './catalog';

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

export interface PromoteAdminResult {
  userId: string;
  email: string;
  role: 'ADMIN';
  alreadyAdmin: boolean;
}

// ============================================================================
// ADMIN ORDER MANAGEMENT TYPES
// ============================================================================

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
