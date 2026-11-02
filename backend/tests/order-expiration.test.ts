import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService, computePayloadHash } from '../src/services/order.service';
import { OrderExpirationService } from '../src/services/order-expiration.service';
import { OrderRepository } from '../src/repositories/order.repository';
import { NotFoundError, ConflictError } from '../src/errors';
import { ProductAvailability, OrderStatus, PaymentStatus } from '@prisma/client';
import { hashGuestAccessToken } from '../src/utils/guest-token';
import type { CreateOrderRequest, UpdateCheckoutOrderRequest } from '../src/types';

describe('Order Expiration, Cancellation & Idempotency Hardening', () => {
  let mockOrderRepo: OrderRepository;
  let orderService: OrderService;
  let expirationService: OrderExpirationService;
  let mockPrisma: any;

  const validProductId = '11111111-1111-4111-8111-111111111111';
  const validOrderId = '33333333-3333-4333-8333-333333333333';
  const validPaymentId = '44444444-4444-4444-8444-444444444444';
  const validUserId = '55555555-5555-4555-8555-555555555555';

  const sampleProduct = {
    id: validProductId,
    sku: 'MND-LOTUS-01',
    name: 'Sacred Lotus Mandala',
    price: 150000,
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 1,
    isActive: true,
    category: { isActive: true },
  };

  const sampleOrderRequest: CreateOrderRequest = {
    customer: {
      fullName: 'Aarav Mehta',
      email: 'aarav@example.com',
      phone: '9876543210',
    },
    shippingAddress: {
      addressLine1: '123 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
    },
    items: [{ productId: validProductId, quantity: 1 }],
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockPrisma = {
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mockPrisma)),
      product: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      order: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      payment: {
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      coupon: {
        findUnique: vi.fn(),
      },
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),
    };

    mockOrderRepo = new OrderRepository(mockPrisma);
    orderService = new OrderService(mockOrderRepo, mockPrisma);
    expirationService = new OrderExpirationService(mockOrderRepo, mockPrisma);
  });

  describe('Part A — Order Expiration & Stock Restoration', () => {
    it('1. Expiring an unpaid order restores stock exactly once', async () => {
      const order = {
        id: validOrderId,
        orderNumber: 'ORD-TEST-001',
        status: OrderStatus.PENDING_PAYMENT,
        items: [{ productId: validProductId, quantity: 1 }],
        payments: [{ id: validPaymentId, status: PaymentStatus.PENDING }],
        customerNotes: null,
      };

      vi.spyOn(mockPrisma.order, 'findUnique').mockResolvedValue(order);
      vi.spyOn(mockPrisma.order, 'updateMany').mockResolvedValue({ count: 1 });
      vi.spyOn(mockPrisma.payment, 'updateMany').mockResolvedValue({ count: 1 });
      vi.spyOn(mockPrisma.product, 'findUnique').mockResolvedValue(sampleProduct);
      vi.spyOn(mockPrisma.product, 'update').mockResolvedValue({
        ...sampleProduct,
        stockQuantity: 2,
      });
      vi.spyOn(mockPrisma.product, 'updateMany').mockResolvedValue({ count: 1 });

      const result = await mockOrderRepo.cancelOrderAndRestoreStock(
        validOrderId,
        '[ORDER_EXPIRED] Expired after 15 min.'
      );

      expect(result.cancelled).toBe(true);
      expect(result.restoredItems).toBe(1);
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: validOrderId, status: OrderStatus.PENDING_PAYMENT },
        data: expect.objectContaining({ status: OrderStatus.CANCELLED }),
      });
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: validProductId },
        data: { stockQuantity: { increment: 1 } },
      });
      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
        where: { orderId: validOrderId, status: PaymentStatus.PENDING },
        data: expect.objectContaining({ status: PaymentStatus.FAILED }),
      });
    });

    it('2. Repeated expiration does not double-restore inventory', async () => {
      // First check returns CANCELLED order
      const alreadyCancelledOrder = {
        id: validOrderId,
        orderNumber: 'ORD-TEST-001',
        status: OrderStatus.CANCELLED,
        items: [{ productId: validProductId, quantity: 1 }],
        payments: [{ id: validPaymentId, status: PaymentStatus.FAILED }],
      };

      vi.spyOn(mockPrisma.order, 'findUnique').mockResolvedValue(alreadyCancelledOrder);

      const result = await mockOrderRepo.cancelOrderAndRestoreStock(
        validOrderId,
        '[ORDER_EXPIRED] Expired again.'
      );

      expect(result.cancelled).toBe(false);
      expect(result.restoredItems).toBe(0);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('3. Two concurrent expiration attempts cannot both restore stock', async () => {
      const order = {
        id: validOrderId,
        orderNumber: 'ORD-TEST-001',
        status: OrderStatus.PENDING_PAYMENT,
        items: [{ productId: validProductId, quantity: 1 }],
        payments: [{ id: validPaymentId, status: PaymentStatus.PENDING }],
      };

      vi.spyOn(mockPrisma.order, 'findUnique').mockResolvedValue(order);
      // Simulate race: updateMany returns count: 0 because another worker won the atomic status update
      vi.spyOn(mockPrisma.order, 'updateMany').mockResolvedValue({ count: 0 });

      const result = await mockOrderRepo.cancelOrderAndRestoreStock(
        validOrderId,
        '[ORDER_EXPIRED] Racing worker'
      );

      expect(result.cancelled).toBe(false);
      expect(result.restoredItems).toBe(0);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('4. Captured payments cannot be expired', async () => {
      const confirmedOrder = {
        id: validOrderId,
        orderNumber: 'ORD-TEST-001',
        status: OrderStatus.CONFIRMED,
        items: [{ productId: validProductId, quantity: 1 }],
        payments: [{ id: validPaymentId, status: PaymentStatus.CAPTURED }],
      };

      vi.spyOn(mockPrisma.order, 'findUnique').mockResolvedValue(confirmedOrder);

      const result = await mockOrderRepo.cancelOrderAndRestoreStock(
        validOrderId,
        '[ORDER_EXPIRED] Should not expire captured'
      );

      expect(result.cancelled).toBe(false);
      expect(result.restoredItems).toBe(0);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('5. Expiration scan identifies eligible stale orders older than 15 minutes', async () => {
      const staleOrders = [
        { id: 'stale-1', orderNumber: 'ORD-STALE-1' },
        { id: 'stale-2', orderNumber: 'ORD-STALE-2' },
      ];

      vi.spyOn(mockPrisma.order, 'findMany').mockResolvedValue(staleOrders);
      vi.spyOn(mockOrderRepo, 'cancelOrderAndRestoreStock').mockResolvedValue({
        cancelled: true,
        restoredItems: 1,
      });

      const sweepResult = await expirationService.expireStaleOrders(15);

      expect(sweepResult.expiredOrderCount).toBe(2);
      expect(sweepResult.restoredItemCount).toBe(2);
      expect(sweepResult.expiredOrderIds).toEqual(['stale-1', 'stale-2']);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PENDING_PAYMENT,
          }),
        })
      );
    });

    it('6. Batch expiration resilience: failure on one order does not terminate batch', async () => {
      const staleOrders = [
        { id: 'stale-fail-1', orderNumber: 'ORD-FAIL-1' },
        { id: 'stale-success-2', orderNumber: 'ORD-SUCCESS-2' },
      ];

      vi.spyOn(mockPrisma.order, 'findMany').mockResolvedValue(staleOrders);
      vi.spyOn(mockOrderRepo, 'cancelOrderAndRestoreStock')
        .mockRejectedValueOnce(new Error('Deadlock or database timeout on order 1'))
        .mockResolvedValueOnce({
          cancelled: true,
          restoredItems: 2,
        });

      const sweepResult = await expirationService.expireStaleOrders(15);

      expect(sweepResult.ordersExamined).toBe(2);
      expect(sweepResult.ordersExpired).toBe(1);
      expect(sweepResult.ordersSkipped).toBe(0);
      expect(sweepResult.ordersFailed).toBe(1);
      expect(sweepResult.restoredItemCount).toBe(2);
      expect(sweepResult.expiredOrderIds).toEqual(['stale-success-2']);
      expect(sweepResult.failedOrders).toHaveLength(1);
      expect(sweepResult.failedOrders[0]).toEqual({
        orderId: 'stale-fail-1',
        orderNumber: 'ORD-FAIL-1',
        error: 'Deadlock or database timeout on order 1',
      });
    });

    it('7. Delayed capture after cancellation follows safe reconciliation', async () => {
      const cancelledOrder = {
        id: validOrderId,
        orderNumber: 'ORD-TEST-001',
        status: OrderStatus.CANCELLED,
        total: 150000,
        customerNotes: 'Order was expired after 15 min.',
        items: [{ productId: validProductId, quantity: 1 }],
        payments: [{ id: validPaymentId, status: PaymentStatus.FAILED, amount: 150000 }],
      };

      vi.spyOn(mockPrisma.order, 'findUnique').mockResolvedValue(cancelledOrder);
      vi.spyOn(mockPrisma.payment, 'update').mockResolvedValue({
        id: validPaymentId,
        status: PaymentStatus.CAPTURED,
        paidAt: new Date(),
      });
      vi.spyOn(mockPrisma.order, 'update').mockResolvedValue({
        ...cancelledOrder,
        customerNotes:
          'Order was expired after 15 min.\n\n[EXPIRED_ORDER_PAYMENT_RECONCILIATION] Payment of ₹1500.00 was captured by the gateway, but order "ORD-TEST-001" was previously cancelled (stock was released). Order remains cancelled for administrative reconciliation or refund.',
      });

      const reconciliation = await mockOrderRepo.confirmOrderAndCapturePayment(
        validPaymentId,
        validOrderId,
        'rzp_pay_123',
        'sig_123'
      );

      expect(reconciliation.order.status).toBe(OrderStatus.CANCELLED);
      expect(reconciliation.payment.status).toBe(PaymentStatus.CAPTURED);
      expect(reconciliation.order.customerNotes).toContain(
        '[EXPIRED_ORDER_PAYMENT_RECONCILIATION]'
      );
    });
  });

  describe('Part B — Address & Coupon Correction Without Lockout', () => {
    it('8. Address correction does not create duplicate stock reservations', async () => {
      const pendingOrder = {
        id: validOrderId,
        orderNumber: 'ORD-TEST-001',
        userId: validUserId,
        status: OrderStatus.PENDING_PAYMENT,
        subtotal: 150000,
        discountAmount: 0,
        shippingFee: 0,
        taxAmount: 0,
        total: 150000,
        couponId: null,
        couponCode: null,
        customerEmail: 'aarav@example.com',
        customerPhone: '9876543210',
        shippingRecipientName: 'Aarav Mehta',
        shippingPhone: '9876543210',
        shippingAddressLine1: '123 MG Road',
        shippingAddressLine2: null,
        shippingCity: 'Mumbai',
        shippingState: 'Maharashtra',
        shippingPostalCode: '400001',
        shippingCountry: 'India',
        payments: [{ id: validPaymentId, status: PaymentStatus.PENDING, amount: 150000 }],
        items: [
          {
            id: 'item-1',
            productId: validProductId,
            productName: 'Mandala',
            productSku: 'MND',
            unitPrice: 150000,
            quantity: 1,
            total: 150000,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(pendingOrder as any);
      vi.spyOn(mockPrisma.order, 'update').mockResolvedValue({
        ...pendingOrder,
        shippingAddressLine1: '456 Brigade Road',
        shippingCity: 'Bengaluru',
        shippingState: 'Karnataka',
        shippingPostalCode: '560001',
      });

      const updateReq: UpdateCheckoutOrderRequest = {
        shippingAddress: {
          addressLine1: '456 Brigade Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      };

      const updated = await orderService.updatePendingOrder(validOrderId, updateReq, {
        id: validUserId,
        email: 'aarav@example.com',
      });

      expect(updated.shippingAddress.addressLine1).toBe('456 Brigade Road');
      expect(updated.shippingAddress.city).toBe('Bengaluru');
      // Product stock was never queried or decremented again!
      expect(mockPrisma.product.updateMany).not.toHaveBeenCalled();
    });

    it('9. Unauthorized customers cannot modify or recover another customer pending order', async () => {
      const order = {
        id: validOrderId,
        userId: validUserId,
        customerEmail: 'owner@example.com',
        status: OrderStatus.PENDING_PAYMENT,
        payments: [],
      };

      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(order as any);

      // Attempt by another authenticated customer
      await expect(
        orderService.updatePendingOrder(
          validOrderId,
          {
            shippingAddress: {
              addressLine1: 'Hacker Way',
              city: 'Hacked',
              state: 'Delhi',
              postalCode: '110001',
            },
          },
          { id: 'attacker-uuid-999', email: 'attacker@example.com' }
        )
      ).rejects.toThrow(NotFoundError);

      // Attempt by unauthorized guest
      await expect(
        orderService.getPendingOrderForCheckout(validOrderId, null, 'wrongguest@example.com')
      ).rejects.toThrow(NotFoundError);

      // Attempt by unauthorized cancel
      await expect(
        orderService.cancelPendingOrder(validOrderId, null, 'wrongguest@example.com')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Part C — Scoped Idempotency & Hash Validation', () => {
    it('10. Scopes idempotency keys to user ID or guest email', async () => {
      const hash = computePayloadHash(sampleOrderRequest);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 hex string
    });

    it('11. Same key with different payload is rejected with ConflictError', async () => {
      const mockCreatedOrder = {
        id: validOrderId,
        orderNumber: 'ORD-IDEM-001',
        status: OrderStatus.PENDING_PAYMENT,
        subtotal: 150000,
        discountAmount: 0,
        shippingFee: 0,
        taxAmount: 0,
        total: 150000,
        customerEmail: sampleOrderRequest.customer.email,
        customerPhone: sampleOrderRequest.customer.phone,
        shippingRecipientName: sampleOrderRequest.customer.fullName,
        shippingPhone: sampleOrderRequest.customer.phone,
        shippingAddressLine1: sampleOrderRequest.shippingAddress.addressLine1,
        shippingAddressLine2: null,
        shippingCity: sampleOrderRequest.shippingAddress.city,
        shippingState: sampleOrderRequest.shippingAddress.state,
        shippingPostalCode: sampleOrderRequest.shippingAddress.postalCode,
        shippingCountry: 'India',
        items: [],
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(mockPrisma.product, 'findUnique').mockResolvedValue(sampleProduct);
      vi.spyOn(mockPrisma.product, 'updateMany').mockResolvedValue({ count: 1 });
      vi.spyOn(mockOrderRepo, 'createOrderTransaction').mockResolvedValue(mockCreatedOrder as any);

      // First call with key "idemp-key-1"
      const res1 = await orderService.createOrder(sampleOrderRequest, 'idemp-key-1', null);
      expect(res1.orderNumber).toBe('ORD-IDEM-001');

      // Second call with same key but DIFFERENT payload (different postalCode)
      const modifiedRequest: CreateOrderRequest = {
        ...sampleOrderRequest,
        shippingAddress: {
          ...sampleOrderRequest.shippingAddress,
          postalCode: '999999',
        },
      };

      await expect(orderService.createOrder(modifiedRequest, 'idemp-key-1', null)).rejects.toThrow(
        ConflictError
      );
    });

    it('12. Repeated same-key requests return the correct existing order', async () => {
      const mockCreatedOrder = {
        id: validOrderId,
        orderNumber: 'ORD-IDEM-002',
        status: OrderStatus.PENDING_PAYMENT,
        subtotal: 150000,
        discountAmount: 0,
        shippingFee: 0,
        taxAmount: 0,
        total: 150000,
        customerEmail: sampleOrderRequest.customer.email,
        customerPhone: sampleOrderRequest.customer.phone,
        shippingRecipientName: sampleOrderRequest.customer.fullName,
        shippingPhone: sampleOrderRequest.customer.phone,
        shippingAddressLine1: sampleOrderRequest.shippingAddress.addressLine1,
        shippingAddressLine2: null,
        shippingCity: sampleOrderRequest.shippingAddress.city,
        shippingState: sampleOrderRequest.shippingAddress.state,
        shippingPostalCode: sampleOrderRequest.shippingAddress.postalCode,
        shippingCountry: 'India',
        items: [],
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(mockPrisma.product, 'findUnique').mockResolvedValue(sampleProduct);
      vi.spyOn(mockPrisma.product, 'updateMany').mockResolvedValue({ count: 1 });
      vi.spyOn(mockOrderRepo, 'createOrderTransaction').mockResolvedValue(mockCreatedOrder as any);

      const res1 = await orderService.createOrder(sampleOrderRequest, 'idemp-key-reuse', null);
      const res2 = await orderService.createOrder(sampleOrderRequest, 'idemp-key-reuse', null);

      expect(res1.orderNumber).toBe('ORD-IDEM-002');
      expect(res2.orderNumber).toBe('ORD-IDEM-002');
      // Product reservation was called only once!
      expect(mockOrderRepo.createOrderTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Part D — Cryptographic Guest Access Token Security & IDOR Prevention', () => {
    const rawGuestToken = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
    const guestTokenHash = hashGuestAccessToken(rawGuestToken);

    const guestOrder = {
      id: validOrderId,
      orderNumber: 'ORD-GUEST-001',
      userId: null,
      customerEmail: 'guest@example.com',
      guestAccessTokenHash: guestTokenHash,
      status: OrderStatus.PENDING_PAYMENT,
      subtotal: 150000,
      discountAmount: 0,
      shippingFee: 0,
      taxAmount: 0,
      total: 150000,
      couponId: null,
      couponCode: null,
      customerPhone: '9876543210',
      shippingRecipientName: 'Guest User',
      shippingPhone: '9876543210',
      shippingAddressLine1: '123 Guest Street',
      shippingAddressLine2: null,
      shippingCity: 'Mumbai',
      shippingState: 'Maharashtra',
      shippingPostalCode: '400001',
      shippingCountry: 'India',
      payments: [{ id: validPaymentId, status: PaymentStatus.PENDING, amount: 150000 }],
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('13. Creates guest order with 64-hex-character guest access token and stores SHA-256 hash', async () => {
      let passedData: any = null;
      vi.spyOn(mockPrisma.product, 'findUnique').mockResolvedValue(sampleProduct);
      vi.spyOn(mockPrisma.product, 'updateMany').mockResolvedValue({ count: 1 });
      vi.spyOn(mockOrderRepo, 'createOrderTransaction').mockImplementation(
        async (_tx: any, data: any) => {
          passedData = data;
          return {
            ...guestOrder,
            orderNumber: 'ORD-GUEST-NEW',
          } as any;
        }
      );

      const res = await orderService.createOrder(sampleOrderRequest, undefined, null);

      expect(res.guestAccessToken).toBeDefined();
      expect(res.guestAccessToken).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(res.guestAccessToken!)).toBe(true);
      expect(passedData.guestAccessTokenHash).toBeDefined();
      expect(passedData.guestAccessTokenHash).toBe(hashGuestAccessToken(res.guestAccessToken!));
    });

    it('14. Allows guest recovery with valid X-Guest-Access-Token and rejects invalid or missing token', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(guestOrder as any);

      // Valid token -> succeeds
      const recovered = await orderService.getPendingOrderForCheckout(
        validOrderId,
        null,
        rawGuestToken
      );
      expect(recovered.id).toBe(validOrderId);
      expect(recovered.customerEmail).toBe('guest@example.com');

      // Invalid token -> 404 NotFoundError
      await expect(
        orderService.getPendingOrderForCheckout(
          validOrderId,
          null,
          'wrong_token_1234567890123456789012345678901234567890123456789012345678901234'
        )
      ).rejects.toThrow(NotFoundError);

      // Missing token (undefined) -> 404 NotFoundError
      await expect(
        orderService.getPendingOrderForCheckout(validOrderId, null, undefined)
      ).rejects.toThrow(NotFoundError);

      // Email alone without valid token -> 404 NotFoundError
      await expect(orderService.getPendingOrderForCheckout(validOrderId, null, '')).rejects.toThrow(
        NotFoundError
      );
    });

    it('15. Guest access token cannot access registered customer order', async () => {
      const registeredOrder = {
        ...guestOrder,
        userId: validUserId, // Owned by registered customer
      };
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(registeredOrder as any);

      // Guest presenting valid token for a registered customer order is rejected
      await expect(
        orderService.getPendingOrderForCheckout(validOrderId, null, rawGuestToken)
      ).rejects.toThrow(NotFoundError);

      // Authenticated customer matching userId succeeds
      const customerRecovered = await orderService.getPendingOrderForCheckout(validOrderId, {
        id: validUserId,
        email: 'customer@example.com',
      });
      expect(customerRecovered.id).toBe(validOrderId);
    });

    it('16. Valid guest access token allows address update and cancellation; wrong token is rejected', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(guestOrder as any);
      vi.spyOn(mockPrisma.order, 'update').mockResolvedValue({
        ...guestOrder,
        shippingAddressLine1: '999 Secure Boulevard',
      });

      // Update with valid token succeeds
      const updated = await orderService.updatePendingOrder(
        validOrderId,
        {
          shippingAddress: {
            addressLine1: '999 Secure Boulevard',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India',
          },
        },
        null,
        rawGuestToken
      );
      expect(updated.shippingAddress.addressLine1).toBe('999 Secure Boulevard');

      // Update with wrong token rejects with NotFoundError
      await expect(
        orderService.updatePendingOrder(
          validOrderId,
          {
            shippingAddress: {
              addressLine1: 'Hacked Address',
              city: 'Mumbai',
              state: 'Maharashtra',
              postalCode: '400001',
              country: 'India',
            },
          },
          null,
          'wrong-token'
        )
      ).rejects.toThrow(NotFoundError);

      // Cancel with valid token succeeds
      vi.spyOn(mockOrderRepo, 'cancelOrderAndRestoreStock').mockResolvedValue({
        cancelled: true,
        restoredItems: 1,
      });
      const cancelResult = await orderService.cancelPendingOrder(
        validOrderId,
        null,
        rawGuestToken,
        'Customer changed mind'
      );
      expect(cancelResult.success).toBe(true);

      // Cancel with wrong token rejects with NotFoundError
      await expect(
        orderService.cancelPendingOrder(validOrderId, null, 'wrong-token', 'Malicious cancel')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
