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

export interface RazorpayWebhookPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string | null;
  international?: boolean;
  method?: string;
  amount_refunded?: number;
  refund_status?: string | null;
  captured?: boolean;
  description?: string;
  card_id?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  email?: string;
  contact?: string;
  error_code?: string | null;
  error_description?: string | null;
  error_source?: string | null;
  error_step?: string | null;
  error_reason?: string | null;
  created_at?: number;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayWebhookPaymentEntity;
    };
    order?: {
      entity: unknown;
    };
  };
  created_at: number;
}
