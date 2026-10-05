import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { CartProvider } from '@/context';
import type { CartItem } from '@/types';

describe('CheckoutPage UI & Checkout Flow', () => {
  const mockCartItems: CartItem[] = [
    {
      productId: 'prod-1',
      slug: 'cosmic-mandala-canvas',
      name: 'Cosmic Mandala Canvas',
      sku: 'MAN-001',
      price: 249900, // ₹2,499 in paise
      compareAtPrice: 299900,
      quantity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1.jpg',
      imageAlt: 'Cosmic Mandala Canvas',
      categoryName: 'Mandala Art',
      categorySlug: 'mandala-art',
      availability: 'IN_STOCK',
      dimensions: '12 x 12 in',
      isHandmade: true,
    },
    {
      productId: 'prod-2',
      slug: 'kutch-sun-mirror-relief',
      name: 'Kutch Sun Mirror Relief',
      sku: 'LIP-001',
      price: 389900, // ₹3,899 in paise
      compareAtPrice: 450000,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-2.jpg',
      imageAlt: 'Kutch Sun Mirror Relief',
      categoryName: 'Lippan Art',
      categorySlug: 'lippan-art',
      availability: 'MADE_TO_ORDER',
      dimensions: '16 x 16 in',
      isHandmade: true,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  const renderCheckoutPage = (items?: CartItem[]) => {
    return render(
      <CartProvider initialItems={items}>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/cart" element={<div>Cart Page</div>} />
            <Route path="/products" element={<div>Products Catalog</div>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );
  };

  it('renders empty cart state with CTA when cart has no items', () => {
    renderCheckoutPage([]);

    expect(screen.getByRole('heading', { level: 1, name: 'Artwork Checkout' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Your Cart is Empty' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore Our Art' })).toBeInTheDocument();
  });

  it('renders checkout form, inputs, and order summary when cart has items', () => {
    renderCheckoutPage(mockCartItems);

    expect(screen.getByRole('heading', { level: 1, name: 'Artwork Checkout' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Contact Information' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Shipping & Art Delivery Address' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Order Summary' })).toBeInTheDocument();

    // Check form fields
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Street Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/City \/ Town/)).toBeInTheDocument();
    expect(screen.getByLabelText(/State/)).toBeInTheDocument();
    expect(screen.getByLabelText(/PIN \/ Postal Code/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Country/)).toHaveValue('India');

    // Check items in summary
    expect(screen.getByText('Cosmic Mandala Canvas')).toBeInTheDocument();
    expect(screen.getByText('Kutch Sun Mirror Relief')).toBeInTheDocument();

    // Line totals: 2499 * 2 = 4998, 3899 * 1 = 3899 -> Subtotal: 8897
    expect(screen.getByText(/4,998/)).toBeInTheDocument();
    expect(screen.getAllByText(/3,899/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/8,897/).length).toBeGreaterThanOrEqual(1);

    // Made to Order badge is present
    expect(screen.getByText('Made to Order')).toBeInTheDocument();

    // Internal stock quantity is NOT exposed
    expect(screen.queryByText(/stockQuantity/i)).not.toBeInTheDocument();
  });

  it('validates required fields when clicking Continue to Payment with empty fields', async () => {
    renderCheckoutPage(mockCartItems);

    const submitBtn = screen.getByRole('button', { name: 'Continue to Payment' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    expect(screen.getByText('Email address is required')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    expect(screen.getByText('Street address is required')).toBeInTheDocument();
    expect(screen.getByText('City is required')).toBeInTheDocument();
    expect(screen.getByText('State is required')).toBeInTheDocument();
    expect(screen.getByText('PIN code is required')).toBeInTheDocument();
  });

  it('validates invalid email, phone, and PIN code formats', async () => {
    renderCheckoutPage(mockCartItems);

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Radhika Sharma' } });
    fireEvent.change(screen.getByLabelText(/Email Address/), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/Street Address/), {
      target: { value: '402, Lotus Heritage' },
    });
    fireEvent.change(screen.getByLabelText(/City \/ Town/), { target: { value: 'Ahmedabad' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Gujarat' } });
    fireEvent.change(screen.getByLabelText(/PIN \/ Postal Code/), { target: { value: '012345' } });

    const submitBtn = screen.getByRole('button', { name: 'Continue to Payment' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(
      screen.getByText('Please enter a valid 10-digit Indian phone number')
    ).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid 6-digit PIN code')).toBeInTheDocument();
  });

  it('clears field errors when user starts typing', async () => {
    renderCheckoutPage(mockCartItems);

    const submitBtn = screen.getByRole('button', { name: 'Continue to Payment' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Full name is required')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(nameInput, { target: { value: 'Radhika' } });

    expect(screen.queryByText('Full name is required')).not.toBeInTheDocument();
  });

  it('transitions to review mode on valid form submission and allows returning to edit', async () => {
    renderCheckoutPage(mockCartItems);

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Radhika Sharma' } });
    fireEvent.change(screen.getByLabelText(/Email Address/), {
      target: { value: 'radhika@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText(/Street Address/), {
      target: { value: '402, Lotus Heritage, MG Road' },
    });
    fireEvent.change(screen.getByLabelText(/Apartment, Suite, Landmark/), {
      target: { value: 'Near Shanti Stupa' },
    });
    fireEvent.change(screen.getByLabelText(/City \/ Town/), { target: { value: 'Ahmedabad' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Gujarat' } });
    fireEvent.change(screen.getByLabelText(/PIN \/ Postal Code/), { target: { value: '380015' } });

    const submitBtn = screen.getByRole('button', { name: 'Continue to Payment' });
    fireEvent.click(submitBtn);

    // Should transition to review mode
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Review Order & Shipping' })
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Customer & Delivery Destination Verified')).toBeInTheDocument();
    expect(screen.getByText('Ready for Payment')).toBeInTheDocument();
    expect(screen.getByText('Radhika Sharma')).toBeInTheDocument();
    expect(screen.getByText('radhika@example.com')).toBeInTheDocument();
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
    expect(screen.getByText('402, Lotus Heritage, MG Road')).toBeInTheDocument();
    expect(screen.getByText(/Ahmedabad, Gujarat — 380015/)).toBeInTheDocument();

    // Next step banner
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Payment Gateway Integration (Coming in Step 12)',
      })
    ).toBeInTheDocument();

    // Click edit button to return to form
    const editBtn = screen.getByRole('button', { name: '← Edit Contact & Shipping Details' });
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { level: 1, name: 'Artwork Checkout' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/)).toHaveValue('Radhika Sharma');
  });
});
