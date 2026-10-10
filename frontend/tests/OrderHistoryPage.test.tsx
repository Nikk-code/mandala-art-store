import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OrderHistoryPage } from '@/pages/OrderHistoryPage';
import * as orderService from '@/services/order-service';
import type { OrderHistoryResponseDto } from '@/types';

describe('OrderHistoryPage UI & Customer Order List', () => {
  const mockHistoryResponse: OrderHistoryResponseDto = {
    orders: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        orderNumber: 'MAT-20261005-7F2A9C',
        status: 'CONFIRMED',
        paymentStatus: 'CAPTURED',
        total: 149900,
        currency: 'INR',
        itemCount: 2,
        createdAt: '2026-10-05T12:00:00.000Z',
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        orderNumber: 'MAT-20261001-3A91BC',
        status: 'DELIVERED',
        paymentStatus: 'CAPTURED',
        total: 389900,
        currency: 'INR',
        itemCount: 1,
        createdAt: '2026-10-01T10:00:00.000Z',
      },
    ],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderOrderHistoryPage = () => {
    return render(
      <MemoryRouter initialEntries={['/orders']}>
        <Routes>
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:orderId" element={<div>Order Details Page</div>} />
          <Route path="/products" element={<div>Products Catalog</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading state initially', () => {
    vi.spyOn(orderService, 'fetchOrderHistory').mockImplementation(() => new Promise(() => {}));

    renderOrderHistoryPage();

    expect(screen.getByText('Loading your order history...')).toBeInTheDocument();
  });

  it('renders empty state when customer has no previous orders', async () => {
    vi.spyOn(orderService, 'fetchOrderHistory').mockResolvedValue({
      orders: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },
    });

    renderOrderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('No Orders Placed Yet')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Explore Collections' })).toBeInTheDocument();
  });

  it('renders customer orders with order numbers, status badges, totals, and view actions', async () => {
    vi.spyOn(orderService, 'fetchOrderHistory').mockResolvedValue(mockHistoryResponse);

    renderOrderHistoryPage();

    await waitFor(() => {
      expect(screen.getAllByText(/MAT-20261005-7F2A9C/).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText(/MAT-20261001-3A91BC/).length).toBeGreaterThanOrEqual(1);

    const viewOrderLinks = screen.getAllByRole('link', { name: /View Order Details/i });
    expect(viewOrderLinks).toHaveLength(2);
    expect(viewOrderLinks[0]).toHaveAttribute(
      'href',
      '/orders/33333333-3333-4333-8333-333333333333'
    );
    expect(viewOrderLinks[1]).toHaveAttribute(
      'href',
      '/orders/44444444-4444-4444-8444-444444444444'
    );
  });

  it('renders error state on API failure with retry action', async () => {
    vi.spyOn(orderService, 'fetchOrderHistory').mockRejectedValue(
      new Error('Failed to load orders')
    );

    renderOrderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Orders')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });
});
