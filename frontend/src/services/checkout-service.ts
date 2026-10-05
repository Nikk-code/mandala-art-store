import { apiPost } from './api-client';
import type {
  ApiSuccessResponse,
  CreateOrderRequest,
  OrderResponseDto,
  PaymentInitializationDto,
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

export async function initializeCheckoutPayment(
  orderId: string
): Promise<PaymentInitializationDto> {
  const response = await apiPost<ApiSuccessResponse<PaymentInitializationDto>>(
    `checkout/orders/${encodeURIComponent(orderId)}/payment`,
    {}
  );

  return response.data;
}
