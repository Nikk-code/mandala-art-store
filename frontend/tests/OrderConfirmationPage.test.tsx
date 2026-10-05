import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import * as orderService from '@/services/order-service';
import type { OrderDetailsDto } from '@/types';

describe('OrderConfirmationPage UI & Confirmation Flow', () => {
  const mockOrder: OrderDetailsDto = {
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
      addressLine1: 'Flat 101, Lotus Apts, MG Road',
      addressLine2: 'Near Central Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Sacred Lotus Mandala',
        productSku: 'MND-LOTUS-01',
        unitPrice: 149900,
        quantity: 1,
        total: 149900,
      },
    ],
    payments: [
      {
        id: 'pay-1',
        provider: 'razorpay',
        amount: 149900,
        currency: 'INR',
        status: 'CAPTURED',
        paidAt: '2026-10-05T12:05:00.000Z',
        failureReason: null,
      },
    ],
    createdAt: '2026-10-05T12:00:00.000Z',
    updatedAt: '2026-10-05T12:05:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderOrderConfirmationPage = (orderId = '33333333-3333-4333-8333-333333333333') => {
    return render(
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/orders" element={<div>My Orders List</div>} />
          <Route path="/products" element={<div>Products Catalog</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading state initially', () => {
    vi.spyOn(orderService, 'fetchOrderById').mockImplementation(() => new Promise(() => {}));

    renderOrderConfirmationPage();

    expect(screen.getByText('Retrieving your verified order details...')).toBeInTheDocument();
  });

  it('renders confirmed order details from backend response', async () => {
    vi.spyOn(orderService, 'fetchOrderById').mockResolvedValue(mockOrder);

    renderOrderConfirmationPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /Order Reference #/i })
      ).toBeInTheDocument();
    });

    expect(screen.getAllByText(/MAT-20261005-7F2A9C/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sacred Lotus Mandala')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('priya@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Flat 101, Lotus Apts/)).toBeInTheDocument();
    expect(screen.getByText(/Bengaluru, Karnataka — 560001/)).toBeInTheDocument();
    expect(screen.getByText(/CONFIRMED/)).toBeInTheDocument();
    expect(screen.getByText(/CAPTURED/)).toBeInTheDocument();
  });

  it('renders not-found state when order is not found or unauthorized', async () => {
    vi.spyOn(orderService, 'fetchOrderById').mockRejectedValue(
      new Error('Order with ID 33333333-3333-4333-8333-333333333333 was not found.')
    );

    renderOrderConfirmationPage();

    await waitFor(() => {
      expect(screen.getByText('Order Not Found')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Return to Order History' })).toBeInTheDocument();
  });

  it('renders generic error state on network or server error with retry button', async () => {
    vi.spyOn(orderService, 'fetchOrderById').mockRejectedValue(
      new Error('Network error connecting to backend service')
    );

    renderOrderConfirmationPage();

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Order')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });
});
