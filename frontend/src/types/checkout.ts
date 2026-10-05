export interface CheckoutCustomer {
  fullName: string;
  email: string;
  phone: string;
}

export interface CheckoutShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutFormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CheckoutData {
  customer: CheckoutCustomer;
  shippingAddress: CheckoutShippingAddress;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  items: CreateOrderItemInput[];
}

export interface OrderItemSnapshotDto {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface OrderResponseDto {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  currency: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItemSnapshotDto[];
  createdAt: string;
  updatedAt?: string;
}

export interface OrderPaymentDto {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  failureReason: string | null;
}

export interface OrderDetailsDto extends OrderResponseDto {
  paidAt?: string | null;
  payments?: OrderPaymentDto[];
}

export interface OrderHistoryItemDto {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  itemCount: number;
  items?: OrderItemSnapshotDto[];
  createdAt: string;
}

export interface OrderHistoryResponseDto {
  orders: OrderHistoryItemDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentInitializationDto {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerificationResultDto {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  orderStatus: string;
}
