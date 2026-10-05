import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeCheckoutPayment, verifyCheckoutPayment } from '@/services/checkout-service';
import { loadRazorpayScript } from '@/utils/razorpay';
import * as apiClient from '@/services/api-client';

describe('Frontend Checkout Payment Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls backend payment endpoint with orderId via initializeCheckoutPayment', async () => {
    const mockPaymentData = {
      orderId: '33333333-3333-4333-8333-333333333333',
      orderNumber: 'MAT-20261005-A1B2C3',
      razorpayOrderId: 'order_rzp_mock_123',
      razorpayKeyId: 'rzp_test_public_key',
      amount: 149900,
      currency: 'INR',
    };

    const apiPostSpy = vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
      success: true,
      data: mockPaymentData,
    });

    const result = await initializeCheckoutPayment('33333333-3333-4333-8333-333333333333');

    expect(result).toEqual(mockPaymentData);
    expect(apiPostSpy).toHaveBeenCalledWith(
      'checkout/orders/33333333-3333-4333-8333-333333333333/payment',
      {}
    );
  });

  it('calls backend verification endpoint with payload via verifyCheckoutPayment', async () => {
    const mockVerifyResponse = {
      orderId: '33333333-3333-4333-8333-333333333333',
      orderNumber: 'MAT-20261005-A1B2C3',
      paymentStatus: 'CAPTURED',
      orderStatus: 'CONFIRMED',
    };

    const verificationPayload = {
      razorpayOrderId: 'order_rzp_mock_123',
      razorpayPaymentId: 'pay_rzp_mock_456',
      razorpaySignature: 'sig_mock_789',
    };

    const apiPostSpy = vi.spyOn(apiClient, 'apiPost').mockResolvedValue({
      success: true,
      data: mockVerifyResponse,
    });

    const result = await verifyCheckoutPayment(
      '33333333-3333-4333-8333-333333333333',
      verificationPayload
    );

    expect(result).toEqual(mockVerifyResponse);
    expect(apiPostSpy).toHaveBeenCalledWith(
      'checkout/orders/33333333-3333-4333-8333-333333333333/payment/verify',
      verificationPayload
    );
  });

  it('detects existing window.Razorpay in loadRazorpayScript', async () => {
    vi.stubGlobal('Razorpay', class MockRazorpay {});

    const loaded = await loadRazorpayScript();
    expect(loaded).toBe(true);
  });
});
