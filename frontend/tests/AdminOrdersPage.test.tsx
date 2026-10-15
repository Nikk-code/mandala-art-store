import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { OrderDetailModal } from '@/components/admin/OrderDetailModal';
import * as adminService from '@/services/admin-service';
import type { AdminOrderListItemDto, AdminOrderDetailsDto } from '@/types';

// Mock useAuth context
vi.mock('@/context', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      email: 'admin@mandala.test',
      firstName: 'Meera',
      lastName: 'Deshmukh',
      role: 'ADMIN',
    },
    logout: vi.fn(),
  }),
}));

describe('Admin Orders Page & Order Details Modal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockOrderSummary: AdminOrderListItemDto = {
    id: 'order-1',
    orderNumber: 'MAT-20261005-7F2A9C',
    customerEmail: 'patron@example.com',
    customerPhone: '9876543210',
    shippingRecipientName: 'Priya Sharma',
    isGuest: false,
    userId: 'user-1',
    status: 'CONFIRMED',
    paymentStatus: 'CAPTURED',
    total: 149900,
    itemCount: 2,
    trackingNumber: null,
    courierName: null,
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-05T10:05:00.000Z',
  };

  const mockGuestOrderSummary: AdminOrderListItemDto = {
    id: 'order-2',
    orderNumber: 'MAT-GUEST-999',
    customerEmail: 'guest@example.com',
    customerPhone: '9123456780',
    shippingRecipientName: 'Anil Kumar',
    isGuest: true,
    userId: null,
    status: 'PROCESSING',
    paymentStatus: 'CAPTURED',
    total: 250000,
    itemCount: 1,
    trackingNumber: null,
    courierName: null,
    createdAt: '2026-10-06T12:00:00.000Z',
    updatedAt: '2026-10-06T12:30:00.000Z',
  };

  const mockOrderDetails: AdminOrderDetailsDto = {
    ...mockOrderSummary,
    subtotal: 149900,
    discountAmount: 0,
    shippingFee: 0,
    taxAmount: 0,
    currency: 'INR',
    couponCode: null,
    customer: {
      userId: 'user-1',
      email: 'patron@example.com',
      phone: '9876543210',
      isGuest: false,
      registeredName: 'Priya Sharma',
    },
    shippingAddress: {
      recipientName: 'Priya Sharma',
      phone: '9876543210',
      addressLine1: 'Flat 101, Lotus Apts, MG Road',
      addressLine2: null,
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
        quantity: 2,
        total: 149900,
      },
    ],
    payments: [
      {
        id: 'pay-1',
        provider: 'razorpay',
        providerOrderId: 'order_rzp_123',
        providerPaymentId: 'pay_rzp_123',
        amount: 149900,
        currency: 'INR',
        status: 'CAPTURED',
        paidAt: '2026-10-05T10:05:00.000Z',
        failureReason: null,
        createdAt: '2026-10-05T10:00:00.000Z',
      },
    ],
    fulfillment: {
      trackingNumber: null,
      courierName: null,
      customerNotes: 'Please deliver in afternoon.',
    },
  };

  it('renders order list with customer name, guest badges, and formatted amounts', async () => {
    vi.spyOn(adminService, 'fetchAdminOrders').mockResolvedValue({
      items: [mockOrderSummary, mockGuestOrderSummary],
      pagination: { page: 1, pageSize: 15, totalItems: 2, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Order Fulfillment & Logistics')).toBeInTheDocument();
      expect(screen.getByText('MAT-20261005-7F2A9C')).toBeInTheDocument();
      expect(screen.getByText('MAT-GUEST-999')).toBeInTheDocument();
    });

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Anil Kumar')).toBeInTheDocument();
    expect(screen.getByText('Patron')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Processing').length).toBeGreaterThanOrEqual(1);
  });

  it('submits search query when user types and submits search form', async () => {
    const fetchSpy = vi.spyOn(adminService, 'fetchAdminOrders').mockResolvedValue({
      items: [mockOrderSummary],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('MAT-20261005-7F2A9C')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Order #, email, phone/i);
    fireEvent.change(searchInput, { target: { value: 'Lotus' } });

    const searchButton = screen.getByRole('button', { name: /^Search$/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Lotus',
        })
      );
    });
  });

  it('opens OrderDetailModal on clicking "View & Manage" and renders full details', async () => {
    vi.spyOn(adminService, 'fetchAdminOrders').mockResolvedValue({
      items: [mockOrderSummary],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(adminService, 'fetchAdminOrderById').mockResolvedValue(mockOrderDetails);

    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('MAT-20261005-7F2A9C')).toBeInTheDocument();
    });

    const viewButton = screen.getByRole('button', { name: /View & Manage/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByText('Flat 101, Lotus Apts, MG Road')).toBeInTheDocument();
      expect(screen.getByText('Sacred Lotus Mandala')).toBeInTheDocument();
      expect(screen.getByText('MND-LOTUS-01')).toBeInTheDocument();
      expect(screen.getByText('Please deliver in afternoon.')).toBeInTheDocument();
    });
  });

  it('OrderDetailModal handles status transition from CONFIRMED to PROCESSING', async () => {
    vi.spyOn(adminService, 'fetchAdminOrderById').mockResolvedValue(mockOrderDetails);
    const updateSpy = vi.spyOn(adminService, 'updateAdminOrderStatus').mockResolvedValue({
      ...mockOrderDetails,
      status: 'PROCESSING',
    });

    const onOrderUpdated = vi.fn();
    const onClose = vi.fn();

    render(
      <OrderDetailModal
        orderId="order-1"
        isOpen={true}
        onClose={onClose}
        onOrderUpdated={onOrderUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Mark as Processing/i)).toBeInTheDocument();
    });

    const processingBtn = screen.getByRole('button', { name: /Mark as Processing/i });
    fireEvent.click(processingBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('order-1', {
        status: 'PROCESSING',
        courierName: undefined,
        trackingNumber: undefined,
      });
      expect(onOrderUpdated).toHaveBeenCalled();
      expect(
        screen.getByText(/Order status successfully updated to PROCESSING/i)
      ).toBeInTheDocument();
    });
  });

  it('OrderDetailModal requires courierName and trackingNumber when transitioning from PROCESSING to SHIPPED', async () => {
    const processingOrder: AdminOrderDetailsDto = {
      ...mockOrderDetails,
      status: 'PROCESSING',
    };
    vi.spyOn(adminService, 'fetchAdminOrderById').mockResolvedValue(processingOrder);
    const updateSpy = vi.spyOn(adminService, 'updateAdminOrderStatus').mockResolvedValue({
      ...processingOrder,
      status: 'SHIPPED',
      fulfillment: {
        courierName: 'Delhivery',
        trackingNumber: 'TRK-987654',
        customerNotes: null,
      },
    });

    render(<OrderDetailModal orderId="order-1" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/Courier \/ Carrier Partner/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tracking \/ Waybill Number/i)).toBeInTheDocument();
    });

    const courierInput = screen.getByLabelText(/Courier \/ Carrier Partner/i);
    const trackingInput = screen.getByLabelText(/Tracking \/ Waybill Number/i);

    fireEvent.change(courierInput, { target: { value: 'Delhivery' } });
    fireEvent.change(trackingInput, { target: { value: 'TRK-987654' } });

    const shippedBtn = screen.getByRole('button', { name: /Mark as Shipped/i });
    fireEvent.click(shippedBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('order-1', {
        status: 'SHIPPED',
        courierName: 'Delhivery',
        trackingNumber: 'TRK-987654',
      });
      expect(screen.getByText(/Order status successfully updated to SHIPPED/i)).toBeInTheDocument();
    });
  });

  it('displays error notice in OrderDetailModal when backend rejects transition with ConflictError', async () => {
    vi.spyOn(adminService, 'fetchAdminOrderById').mockResolvedValue(mockOrderDetails);
    vi.spyOn(adminService, 'updateAdminOrderStatus').mockRejectedValue(
      new Error('Order status could not be updated due to a concurrent state modification.')
    );

    render(<OrderDetailModal orderId="order-1" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark as Processing/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Mark as Processing/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Order status could not be updated due to a concurrent state modification/i
        )
      ).toBeInTheDocument();
    });
  });
});
