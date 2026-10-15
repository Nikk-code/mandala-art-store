import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { CartProvider } from '@/context';
import * as couponService from '@/services/coupon-service';
import type { CartItem, ValidateCouponResultDto } from '@/types';

describe('Checkout Coupon UI & Interaction Flow', () => {
  const mockCartItems: CartItem[] = [
    {
      productId: 'prod-1',
      slug: 'sacred-lotus-mandala',
      name: 'Sacred Lotus Mandala',
      sku: 'MND-LOTUS-01',
      price: 200000, // ₹2,000.00
      compareAtPrice: null,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1.jpg',
      imageAlt: 'Sacred Lotus Mandala',
      categoryName: 'Mandala Art',
      categorySlug: 'mandala-art',
      availability: 'IN_STOCK',
      dimensions: '12 x 12 in',
      isHandmade: true,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderCheckoutWithCoupon = (items = mockCartItems) => {
    return render(
      <CartProvider initialItems={items}>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );
  };

  it('renders coupon input, placeholder, and Apply button in checkout summary', () => {
    renderCheckoutWithCoupon();

    expect(screen.getByPlaceholderText(/PROMO CODE/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument();
  });

  it('successfully applies a valid coupon and displays discount line item and updated total', async () => {
    const mockValidateResult: ValidateCouponResultDto = {
      valid: true,
      couponCode: 'FESTIVE25',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      discountAmount: 50000, // ₹500.00
      newTotal: 150000, // ₹1,500.00
      message: '25% discount applied!',
    };

    vi.spyOn(couponService, 'validateCoupon').mockResolvedValue(mockValidateResult);

    renderCheckoutWithCoupon();

    const input = screen.getByPlaceholderText(/PROMO CODE/i);
    const applyButton = screen.getByRole('button', { name: /Apply/i });

    fireEvent.change(input, { target: { value: 'festive25' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(couponService.validateCoupon).toHaveBeenCalledWith('FESTIVE25', 200000);
    });

    // Verify discount badge and message
    await waitFor(() => {
      expect(screen.getAllByText(/FESTIVE25/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/discount applied/i)).toBeInTheDocument();
      expect(screen.getByText('-₹500')).toBeInTheDocument();
    });

    // Verify Remove button is available
    expect(screen.getByRole('button', { name: /Remove coupon/i })).toBeInTheDocument();
  });

  it('displays validation error message when coupon is invalid or expired', async () => {
    vi.spyOn(couponService, 'validateCoupon').mockRejectedValue(new Error('Coupon has expired.'));

    renderCheckoutWithCoupon();

    const input = screen.getByPlaceholderText(/PROMO CODE/i);
    const applyButton = screen.getByRole('button', { name: /Apply/i });

    fireEvent.change(input, { target: { value: 'EXPIRED10' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText('Coupon has expired.')).toBeInTheDocument();
    });
  });

  it('allows removing an applied coupon and restores the full payable total', async () => {
    const mockValidateResult: ValidateCouponResultDto = {
      valid: true,
      couponCode: 'SAVE200',
      discountType: 'FIXED_AMOUNT',
      discountValue: 20000,
      discountAmount: 20000, // ₹200.00
      newTotal: 180000,
    };

    vi.spyOn(couponService, 'validateCoupon').mockResolvedValue(mockValidateResult);

    renderCheckoutWithCoupon();

    const input = screen.getByPlaceholderText(/PROMO CODE/i);
    const applyButton = screen.getByRole('button', { name: /Apply/i });

    fireEvent.change(input, { target: { value: 'SAVE200' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText('SAVE200')).toBeInTheDocument();
    });

    // Click remove
    const removeBtn = screen.getByRole('button', { name: /Remove coupon/i });
    fireEvent.click(removeBtn);

    // Verify discount is gone
    await waitFor(() => {
      expect(screen.queryByText('SAVE200')).not.toBeInTheDocument();
      expect(screen.queryByText('-₹200')).not.toBeInTheDocument();
    });
  });
});
