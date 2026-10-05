import { apiGet } from './api-client';
import type { ApiSuccessResponse, OrderDetailsDto, OrderHistoryResponseDto } from '@/types';

/**
 * Fetches a single order by ID for the authenticated customer.
 */
export async function fetchOrderById(orderId: string): Promise<OrderDetailsDto> {
  const response = await apiGet<ApiSuccessResponse<OrderDetailsDto>>(
    `orders/${encodeURIComponent(orderId)}`
  );
  return response.data;
}

/**
 * Fetches paginated order history for the authenticated customer.
 */
export async function fetchOrderHistory(page = 1, pageSize = 10): Promise<OrderHistoryResponseDto> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  const response = await apiGet<ApiSuccessResponse<OrderHistoryResponseDto>>(
    `orders?${params.toString()}`
  );
  return response.data;
}
