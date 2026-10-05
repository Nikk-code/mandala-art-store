import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOrderById, fetchOrderHistory } from '@/services/order-service';
import * as apiClient from '@/services/api-client';

describe('Frontend Order Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls backend order details endpoint via fetchOrderById', async () => {
    const mockOrder = {
      id: '33333333-3333-4333-8333-333333333333',
      orderNumber: 'MAT-20261005-7F2A9C',
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
      subtotal: 149900,
      discountAmount: 0,
      shippingFee: 0,
      taxAmount: 0,
      total: 149900,
      currency: 'INR',
      customerEmail: 'priya@example.com',
      customerPhone: '9876543210',
      shippingAddress: {
        recipientName: 'Priya Sharma',
        phone: '9876543210',
        addressLine1: 'Flat 101, Lotus Apts',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      items: [],
      payments: [],
      createdAt: '2026-10-05T12:00:00Z',
      updatedAt: '2026-10-05T12:05:00Z',
    };

    const apiGetSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: mockOrder,
    });

    const result = await fetchOrderById('33333333-3333-4333-8333-333333333333');

    expect(result).toEqual(mockOrder);
    expect(apiGetSpy).toHaveBeenCalledWith('orders/33333333-3333-4333-8333-333333333333');
  });

  it('calls backend order history endpoint with query parameters via fetchOrderHistory', async () => {
    const mockHistory = {
      orders: [],
      pagination: {
        page: 2,
        pageSize: 10,
        total: 15,
        totalPages: 2,
      },
    };

    const apiGetSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: mockHistory,
    });

    const result = await fetchOrderHistory(2, 10);

    expect(result).toEqual(mockHistory);
    expect(apiGetSpy).toHaveBeenCalledWith('orders?page=2&pageSize=10');
  });

  it('uses default pagination parameters when none are supplied to fetchOrderHistory', async () => {
    const mockHistory = {
      orders: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },
    };

    const apiGetSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: mockHistory,
    });

    const result = await fetchOrderHistory();

    expect(result).toEqual(mockHistory);
    expect(apiGetSpy).toHaveBeenCalledWith('orders?page=1&pageSize=10');
  });
});
