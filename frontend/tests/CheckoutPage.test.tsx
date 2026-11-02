import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { CartProvider } from '@/context';
import * as AuthContextModule from '@/context/AuthContext';
import * as addressService from '@/services/address-service';
import * as checkoutService from '@/services/checkout-service';
import * as razorpayUtil from '@/utils/razorpay';
import type {
  CartItem,
  UserDto,
  AddressDto,
  OrderResponseDto,
  PaymentInitializationDto,
  PaymentVerificationResultDto,
} from '@/types';

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

  const mockOrderResponse: OrderResponseDto = {
    id: 'order-uuid-123',
    orderNumber: 'ORD-20261101-ABCD',
    status: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    guestAccessToken: 'guest_token_abc123',
    subtotal: 249900,
    taxAmount: 0,
    shippingFee: 0,
    discountAmount: 0,
    total: 249900,
    currency: 'INR',
    customerEmail: 'radhika@example.com',
    customerPhone: '9876543210',
    shippingAddress: {
      recipientName: 'Radhika Sharma',
      phone: '9876543210',
      addressLine1: '402, Lotus Heritage',
      addressLine2: null,
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380015',
      country: 'India',
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Cosmic Mandala Canvas',
        productSku: 'MAN-001',
        quantity: 2,
        unitPrice: 249900,
        total: 249900,
      },
    ],
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  };

  const mockPaymentInfo: PaymentInitializationDto = {
    orderId: 'order-uuid-123',
    orderNumber: 'ORD-20261101-ABCD',
    razorpayOrderId: 'rzp_order_123',
    razorpayKeyId: 'rzp_test_mock_key',
    amount: 249900,
    currency: 'INR',
  };

  const mockVerificationResult: PaymentVerificationResultDto = {
    orderId: 'order-uuid-123',
    orderNumber: 'ORD-20261101-ABCD',
    orderStatus: 'PROCESSING',
    paymentStatus: 'CAPTURED',
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
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

    // Payment gateway card
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Secure Razorpay Payment Gateway',
      })
    ).toBeInTheDocument();

    // Click edit button to return to form
    const editBtn = screen.getByRole('button', { name: '← Edit Contact & Shipping Details' });
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { level: 1, name: 'Artwork Checkout' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/)).toHaveValue('Radhika Sharma');
  });

  it('prefills shipping address when customer has saved addresses', async () => {
    const mockUser: UserDto = {
      id: 'user-1',
      email: 'aarav@example.com',
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '9876543210',
      role: 'CUSTOMER',
      createdAt: '2026-10-01T10:00:00.000Z',
    };

    const mockSavedAddress: AddressDto = {
      id: 'addr-1',
      userId: 'user-1',
      recipientName: 'Aarav Sharma',
      phone: '9876543210',
      addressLine1: '123 Heritage Lane',
      addressLine2: 'Apt 4B',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302001',
      country: 'India',
      isDefault: true,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateProfile: vi.fn(),
    });

    vi.spyOn(addressService, 'fetchAddresses').mockResolvedValue([mockSavedAddress]);

    renderCheckoutPage([mockCartItems[0]]);

    await waitFor(() => {
      expect(screen.getByText('Saved Delivery Addresses')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Street Address/)).toHaveValue('123 Heritage Lane');
    expect(screen.getByLabelText(/City \/ Town/)).toHaveValue('Jaipur');
    expect(screen.getByLabelText(/PIN \/ Postal Code/)).toHaveValue('302001');
  });

  const fillAndProceedToReview = async () => {
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Radhika Sharma' } });
    fireEvent.change(screen.getByLabelText(/Email Address/), {
      target: { value: 'radhika@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText(/Street Address/), {
      target: { value: '402, Lotus Heritage, MG Road' },
    });
    fireEvent.change(screen.getByLabelText(/City \/ Town/), { target: { value: 'Ahmedabad' } });
    fireEvent.change(screen.getByLabelText(/State/), { target: { value: 'Gujarat' } });
    fireEvent.change(screen.getByLabelText(/PIN \/ Postal Code/), { target: { value: '380015' } });

    const submitBtn = screen.getByRole('button', { name: 'Continue to Payment' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Review Order & Shipping' })
      ).toBeInTheDocument();
    });
  };

  it('displays error notification when payment gateway SDK fails to load', async () => {
    vi.spyOn(checkoutService, 'createCheckoutOrder').mockResolvedValue(mockOrderResponse);
    vi.spyOn(checkoutService, 'initializeCheckoutPayment').mockResolvedValue(mockPaymentInfo);
    vi.spyOn(razorpayUtil, 'loadRazorpayScript').mockResolvedValue(false);

    renderCheckoutPage([mockCartItems[0]]);
    await fillAndProceedToReview();

    const proceedBtn = screen.getByRole('button', { name: 'Pay via Razorpay' });
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Unable to load payment gateway SDK. Please check your internet connection or disable content blockers and try again.'
        )
      ).toBeInTheDocument();
    });
  });

  it('reuses active order and passes idempotency key when retrying after modal dismissal', async () => {
    const createOrderSpy = vi
      .spyOn(checkoutService, 'createCheckoutOrder')
      .mockResolvedValue(mockOrderResponse);
    const initPaymentSpy = vi
      .spyOn(checkoutService, 'initializeCheckoutPayment')
      .mockResolvedValue(mockPaymentInfo);
    vi.spyOn(razorpayUtil, 'loadRazorpayScript').mockResolvedValue(true);

    let modalOptions: { modal?: { ondismiss?: () => void } } | null = null;
    class MockRazorpay {
      constructor(options: { modal?: { ondismiss?: () => void } }) {
        modalOptions = options;
      }
      open() {
        if (modalOptions?.modal?.ondismiss) {
          modalOptions.modal.ondismiss();
        }
      }
    }
    vi.stubGlobal('Razorpay', MockRazorpay);

    renderCheckoutPage([mockCartItems[0]]);
    await fillAndProceedToReview();

    const proceedBtn = screen.getByRole('button', { name: 'Pay via Razorpay' });

    // First attempt: creates order with idempotency key
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledTimes(1);
      expect(initPaymentSpy).toHaveBeenCalledTimes(1);
    });

    const firstIdempotencyKey = createOrderSpy.mock.calls[0][1];
    expect(firstIdempotencyKey).toBeDefined();
    expect(firstIdempotencyKey?.length).toBeGreaterThan(0);

    // Second attempt after dismissal: reuses active order without creating another order
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledTimes(1);
      expect(initPaymentSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('renders View Order Details button for authenticated user upon successful payment', async () => {
    const mockUser: UserDto = {
      id: 'user-1',
      email: 'aarav@example.com',
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '9876543210',
      role: 'CUSTOMER',
      createdAt: '2026-10-01T10:00:00.000Z',
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateProfile: vi.fn(),
    });

    vi.spyOn(addressService, 'fetchAddresses').mockResolvedValue([]);
    vi.spyOn(checkoutService, 'createCheckoutOrder').mockResolvedValue(mockOrderResponse);
    vi.spyOn(checkoutService, 'initializeCheckoutPayment').mockResolvedValue(mockPaymentInfo);
    vi.spyOn(checkoutService, 'verifyCheckoutPayment').mockResolvedValue(mockVerificationResult);
    vi.spyOn(razorpayUtil, 'loadRazorpayScript').mockResolvedValue(true);

    let modalHandler:
      | ((response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => void)
      | null = null;
    class MockRazorpaySuccess {
      constructor(options: {
        handler?: (res: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => void;
      }) {
        if (options.handler) {
          modalHandler = options.handler;
        }
      }
      open() {
        if (modalHandler) {
          modalHandler({
            razorpay_order_id: 'rzp_order_123',
            razorpay_payment_id: 'rzp_pay_456',
            razorpay_signature: 'rzp_sig_789',
          });
        }
      }
    }
    vi.stubGlobal('Razorpay', MockRazorpaySuccess);

    renderCheckoutPage([mockCartItems[0]]);
    await fillAndProceedToReview();

    const proceedBtn = screen.getByRole('button', { name: 'Pay via Razorpay' });
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(screen.getByText('Thank You for Your Order!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Order Details' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Explore Handcrafted Collection' })
      ).toBeInTheDocument();
    });
  });

  it('updates existing pending order when address is edited after initial order creation without creating a duplicate reservation', async () => {
    const createOrderSpy = vi
      .spyOn(checkoutService, 'createCheckoutOrder')
      .mockResolvedValue(mockOrderResponse);
    const updateOrderSpy = vi.spyOn(checkoutService, 'updateCheckoutOrder').mockResolvedValue({
      ...mockOrderResponse,
      shippingAddress: {
        ...mockOrderResponse.shippingAddress,
        addressLine1: '999 Updated Lane',
      },
    });
    const initPaymentSpy = vi
      .spyOn(checkoutService, 'initializeCheckoutPayment')
      .mockResolvedValue(mockPaymentInfo);
    vi.spyOn(razorpayUtil, 'loadRazorpayScript').mockResolvedValue(true);

    class MockRazorpayDismiss {
      private options: any;
      constructor(options: any) {
        this.options = options;
      }
      open() {
        if (this.options?.modal?.ondismiss) {
          this.options.modal.ondismiss();
        }
      }
    }
    vi.stubGlobal('Razorpay', MockRazorpayDismiss);

    renderCheckoutPage([mockCartItems[0]]);
    await fillAndProceedToReview();

    // 1. Initial attempt -> calls createCheckoutOrder
    const payBtn = screen.getByRole('button', { name: 'Pay via Razorpay' });
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledTimes(1);
      expect(initPaymentSpy).toHaveBeenCalledTimes(1);
    });

    // 2. Customer edits address
    const editBtn = screen.getByRole('button', { name: /Edit Contact & Shipping Details/i });
    fireEvent.click(editBtn);

    const address1Input = screen.getByLabelText(/Street Address/);
    fireEvent.change(address1Input, { target: { value: '999 Updated Lane' } });

    // 3. Return to review mode
    const continueBtn = screen.getByRole('button', { name: 'Continue to Payment' });
    fireEvent.click(continueBtn);

    // 4. Submit payment again -> must call updateCheckoutOrder, NOT createCheckoutOrder!
    const payBtn2 = screen.getByRole('button', { name: 'Pay via Razorpay' });
    fireEvent.click(payBtn2);

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledTimes(1); // STILL 1, never duplicated!
      expect(updateOrderSpy).toHaveBeenCalledTimes(1);
      expect(updateOrderSpy).toHaveBeenCalledWith(
        mockOrderResponse.id,
        expect.objectContaining({
          shippingAddress: expect.objectContaining({
            addressLine1: '999 Updated Lane',
          }),
        }),
        'guest_token_abc123'
      );
      expect(initPaymentSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('recovers pending checkout from sessionStorage across page mount', async () => {
    const matchingOrderResponse = {
      ...mockOrderResponse,
      items: [
        {
          ...mockOrderResponse.items[0],
          quantity: 2, // matches mockCartItems[0].quantity
        },
      ],
    };

    sessionStorage.setItem('pending_checkout_order_id', matchingOrderResponse.id);
    sessionStorage.setItem('pending_checkout_guest_token', 'guest_token_abc123');

    const getOrderSpy = vi
      .spyOn(checkoutService, 'getCheckoutOrder')
      .mockResolvedValue(matchingOrderResponse);

    renderCheckoutPage([mockCartItems[0]]);

    await waitFor(() => {
      expect(getOrderSpy).toHaveBeenCalledWith(matchingOrderResponse.id, 'guest_token_abc123');
      // Recovers directly to review mode with verified customer card
      expect(screen.getByText('Customer & Delivery Destination Verified')).toBeInTheDocument();
      expect(screen.getByText('Radhika Sharma')).toBeInTheDocument();
    });
  });
});
