import { apiPost, apiPatch, apiGet } from './api-client';
import type {
  ApiSuccessResponse,
  CreateOrderRequest,
  UpdateCheckoutOrderRequest,
  OrderResponseDto,
  PaymentInitializationDto,
  PaymentVerificationResultDto,
  VerifyPaymentRequest,
} from '@/types';

export async function createCheckoutOrder(
  request: CreateOrderRequest,
  idempotencyKey?: string
): Promise<OrderResponseDto> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const response = await apiPost<ApiSuccessResponse<{ order: OrderResponseDto }>>(
    'checkout/orders',
    request,
    { headers }
  );

  return response.data.order;
}

export async function updateCheckoutOrder(
  orderId: string,
  request: UpdateCheckoutOrderRequest,
  guestAccessToken?: string
): Promise<OrderResponseDto> {
  const headers: Record<string, string> = {};
  if (guestAccessToken) {
    headers['X-Guest-Access-Token'] = guestAccessToken;
  }
  const response = await apiPatch<ApiSuccessResponse<{ order: OrderResponseDto }>>(
    `checkout/orders/${encodeURIComponent(orderId)}`,
    request,
    { headers }
  );
  return response.data.order;
}

export async function cancelCheckoutOrder(
  orderId: string,
  guestAccessToken?: string,
  reason?: string
): Promise<{ message: string }> {
  const headers: Record<string, string> = {};
  if (guestAccessToken) {
    headers['X-Guest-Access-Token'] = guestAccessToken;
  }
  const response = await apiPost<ApiSuccessResponse<{ message: string }>>(
    `checkout/orders/${encodeURIComponent(orderId)}/cancel`,
    { reason },
    { headers }
  );
  return response.data;
}

export async function getCheckoutOrder(
  orderId: string,
  guestAccessToken?: string
): Promise<OrderResponseDto> {
  const headers: Record<string, string> = {};
  if (guestAccessToken) {
    headers['X-Guest-Access-Token'] = guestAccessToken;
  }
  const response = await apiGet<ApiSuccessResponse<{ order: OrderResponseDto }>>(
    `checkout/orders/${encodeURIComponent(orderId)}`,
    { headers }
  );
  return response.data.order;
}

export async function initializeCheckoutPayment(
  orderId: string
): Promise<PaymentInitializationDto> {
  const response = await apiPost<ApiSuccessResponse<PaymentInitializationDto>>(
    `checkout/orders/${encodeURIComponent(orderId)}/payment`,
    {}
  );

  return response.data;
}

export async function verifyCheckoutPayment(
  orderId: string,
  verificationData: VerifyPaymentRequest
): Promise<PaymentVerificationResultDto> {
  const response = await apiPost<ApiSuccessResponse<PaymentVerificationResultDto>>(
    `checkout/orders/${encodeURIComponent(orderId)}/payment/verify`,
    verificationData
  );

  return response.data;
}
