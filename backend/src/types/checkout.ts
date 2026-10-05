export interface CreateOrderCustomerInput {
  fullName: string;
  email: string;
  phone: string;
}

export interface CreateOrderShippingAddressInput {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customer: CreateOrderCustomerInput;
  shippingAddress: CreateOrderShippingAddressInput;
  items: CreateOrderItemInput[];
}

export interface OrderItemSnapshotDto {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string;
  unitPrice: number; // in integer paise
  quantity: number;
  total: number; // in integer paise
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
}

export interface PaymentInitializationDto {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number; // in integer paise
  currency: string;
}
