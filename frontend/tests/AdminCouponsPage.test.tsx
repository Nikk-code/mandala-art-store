import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminCouponsPage } from '@/pages/admin/AdminCouponsPage';
import * as couponService from '@/services/coupon-service';
import type { CouponDto } from '@/types';

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

describe('AdminCouponsPage UI & Administration Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockCoupon1: CouponDto = {
    id: 'c1111111-1111-4111-8111-111111111111',
    code: 'FESTIVE25',
    discountType: 'PERCENTAGE',
    discountValue: 25,
    minOrderAmount: 100000,
    maxDiscountAmount: 50000,
    usageLimit: 100,
    timesUsed: 12,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ordersCount: 12,
  };

  const mockCoupon2: CouponDto = {
    id: 'c2222222-2222-4222-8222-222222222222',
    code: 'WELCOME500',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50000, // ₹500
    minOrderAmount: 200000,
    maxDiscountAmount: null,
    usageLimit: 50,
    timesUsed: 50, // exhausted
    validFrom: '2026-02-01T00:00:00.000Z',
    validUntil: '2026-11-30T23:59:59.000Z',
    isActive: false,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    ordersCount: 50,
  };

  it('renders coupon list with codes, types, usage, and status toggles', async () => {
    vi.spyOn(couponService, 'fetchAdminCoupons').mockResolvedValue({
      coupons: [mockCoupon1, mockCoupon2],
      pagination: { page: 1, pageSize: 15, totalItems: 2, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <AdminCouponsPage />
      </MemoryRouter>
    );

    // Header check
    expect(
      screen.getByRole('heading', { level: 1, name: /Promotions & Coupons/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('FESTIVE25')).toBeInTheDocument();
      expect(screen.getByText('WELCOME500')).toBeInTheDocument();
    });

    // Check discount representations
    expect(screen.getByText(/25% Off/i)).toBeInTheDocument();
    expect(screen.getByText(/₹500 Off/i)).toBeInTheDocument();

    // Check usage limits
    expect(screen.getByText('100 used')).toBeInTheDocument();
    expect(screen.getByText('50 used')).toBeInTheDocument();
  });

  it('allows opening the Create Coupon modal and submitting a new coupon', async () => {
    vi.spyOn(couponService, 'fetchAdminCoupons').mockResolvedValue({
      coupons: [],
      pagination: { page: 1, pageSize: 15, totalItems: 0, totalPages: 1 },
    });

    const createSpy = vi.spyOn(couponService, 'createAdminCoupon').mockResolvedValue({
      ...mockCoupon1,
      code: 'NEWYEAR10',
    });

    render(
      <MemoryRouter>
        <AdminCouponsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /\+ Create Coupon/i })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /\+ Create Coupon/i })[0]);

    // Verify modal appears
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Create New Promotional Coupon/i })
    ).toBeInTheDocument();

    // Fill form
    const codeInput = screen.getByLabelText(/Coupon Code/i);
    const valueInput = screen.getByLabelText(/Discount Percentage/i);

    fireEvent.change(codeInput, { target: { value: 'NEWYEAR10' } });
    fireEvent.change(valueInput, { target: { value: '10' } });

    // Submit form
    const form = modal.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalled();
    });
  });

  it('toggles coupon active status when clicking the toggle button', async () => {
    vi.spyOn(couponService, 'fetchAdminCoupons').mockResolvedValue({
      coupons: [mockCoupon1],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });

    const toggleSpy = vi.spyOn(couponService, 'toggleAdminCouponStatus').mockResolvedValue({
      ...mockCoupon1,
      isActive: false,
    });

    render(
      <MemoryRouter>
        <AdminCouponsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FESTIVE25')).toBeInTheDocument();
    });

    // Toggle button has title "Click to Deactivate"
    const toggleButton = screen.getByTitle(/Click to Deactivate/i);
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith(mockCoupon1.id, false);
    });
  });

  it('safely handles coupon deletion confirmation and safeguards', async () => {
    vi.spyOn(couponService, 'fetchAdminCoupons').mockResolvedValue({
      coupons: [{ ...mockCoupon1, ordersCount: 0 }],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });

    const deleteSpy = vi.spyOn(couponService, 'deleteAdminCoupon').mockResolvedValue(true);

    render(
      <MemoryRouter>
        <AdminCouponsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FESTIVE25')).toBeInTheDocument();
    });

    // Click delete button
    const deleteBtn = screen.getByTitle('Delete coupon');
    fireEvent.click(deleteBtn);

    // Delete modal opens
    const deleteModal = screen.getByRole('dialog');
    expect(deleteModal).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Delete Coupon/i })).toBeInTheDocument();

    // Confirm delete inside delete modal
    const confirmBtn = within(deleteModal).getByRole('button', { name: /^Delete Coupon$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(mockCoupon1.id);
    });
  });
});
