import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService } from '../src/services/order.service';
import { OrderRepository } from '../src/repositories/order.repository';
import { prisma } from '../src/db/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../src/errors';
import { ProductAvailability, OrderStatus, PaymentStatus } from '@prisma/client';
import type { CreateOrderRequest } from '../src/types';

describe('OrderService Domain Logic', () => {
  let mockOrderRepo: OrderRepository;
  let service: OrderService;

  const validProductId1 = '11111111-1111-4111-8111-111111111111';
  const validProductId2 = '22222222-2222-4222-8222-222222222222';

  const sampleCategory = {
    id: 'cat-111',
    name: 'Canvas Mandalas',
    slug: 'canvas-mandalas',
    description: 'Handmade canvas paintings',
    imageUrl: null,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleInStockProduct = {
    id: validProductId1,
    sku: 'MND-LOTUS-01',
    name: 'Sacred Lotus Mandala',
    slug: 'sacred-lotus-mandala',
    description: '12x12 inch acrylic on canvas',
    shortDescription: null,
    price: 149900, // ₹1,499.00
    compareAtPrice: 199900,
    categoryId: 'cat-111',
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 3,
    dimensions: '12x12 inches',
    material: 'Acrylic',
    weightGrams: 800,
    isHandmade: true,
    isFeatured: true,
    isActive: true,
    metaTitle: null,
    metaDescription: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: sampleCategory,
  };

  const sampleMadeToOrderProduct = {
    id: validProductId2,
    sku: 'MND-CUSTOM-02',
    name: 'Custom Spiritual Mandala',
    slug: 'custom-spiritual-mandala',
    description: 'Custom made to order artwork',
    shortDescription: null,
    price: 249900, // ₹2,499.00
    compareAtPrice: null,
    categoryId: 'cat-111',
    availability: ProductAvailability.MADE_TO_ORDER,
    stockQuantity: 0,
    dimensions: '16x16 inches',
    material: 'Oil on canvas',
    weightGrams: 1200,
    isHandmade: true,
    isFeatured: false,
    isActive: true,
    metaTitle: null,
    metaDescription: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: sampleCategory,
  };

  const sampleRequest: CreateOrderRequest = {
    customer: {
      fullName: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543210',
    },
    shippingAddress: {
      addressLine1: 'Flat 101, Lotus Apts, MG Road',
      addressLine2: 'Near Central Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    items: [{ productId: validProductId1, quantity: 1 }],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOrderRepo = new OrderRepository();
    service = new OrderService(mockOrderRepo);
  });

  it('creates guest order successfully with authoritative database pricing and pending payment', async () => {
    // Mock prisma.$transaction
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue(sampleInStockProduct),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(mockTx);
    });

    vi.spyOn(mockOrderRepo, 'createOrderTransaction').mockImplementation(async (_tx, data) => ({
      id: 'order-123',
      orderNumber: data.orderNumber,
      userId: null,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      status: OrderStatus.PENDING_PAYMENT,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount ?? 0,
      shippingFee: data.shippingFee ?? 0,
      taxAmount: data.taxAmount ?? 0,
      total: data.total,
      couponId: null,
      couponCode: null,
      shippingRecipientName: data.shippingRecipientName,
      shippingPhone: data.shippingPhone,
      shippingAddressLine1: data.shippingAddressLine1,
      shippingAddressLine2: data.shippingAddressLine2 ?? null,
      shippingCity: data.shippingCity,
      shippingState: data.shippingState,
      shippingPostalCode: data.shippingPostalCode,
      shippingCountry: data.shippingCountry ?? 'India',
      trackingNumber: null,
      courierName: null,
      customerNotes: null,
      createdAt: new Date('2026-10-05T12:00:00Z'),
      updatedAt: new Date('2026-10-05T12:00:00Z'),
      items: data.items.map((item, idx) => ({
        id: `item-${idx + 1}`,
        orderId: 'order-123',
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.total,
        createdAt: new Date('2026-10-05T12:00:00Z'),
      })),
      payments: [
        {
          id: 'pay-123',
          orderId: 'order-123',
          provider: 'razorpay',
          providerOrderId: null,
          providerPaymentId: null,
          providerSignature: null,
          amount: data.total,
          currency: 'INR',
          status: PaymentStatus.PENDING,
          failureReason: null,
          paidAt: null,
          createdAt: new Date('2026-10-05T12:00:00Z'),
          updatedAt: new Date('2026-10-05T12:00:00Z'),
        },
      ],
    }));

    const result = await service.createOrder(sampleRequest);

    expect(result.orderNumber).toMatch(/^MAT-\d{8}-[A-F0-9]{6}$/);
    expect(result.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(result.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(result.subtotal).toBe(149900);
    expect(result.total).toBe(149900);
    expect(result.discountAmount).toBe(0);
    expect(result.shippingFee).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.customerEmail).toBe('priya@example.com');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toBe('Sacred Lotus Mandala');
    expect(result.items[0].unitPrice).toBe(149900);
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].total).toBe(149900);
  });

  it('handles MADE_TO_ORDER products without physical stock decrement', async () => {
    const updateManyMock = vi.fn();
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue(sampleMadeToOrderProduct),
          updateMany: updateManyMock,
        },
      };
      return callback(mockTx);
    });

    vi.spyOn(mockOrderRepo, 'createOrderTransaction').mockImplementation(async (_tx, data) => ({
      id: 'order-mto-1',
      orderNumber: data.orderNumber,
      userId: null,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      status: OrderStatus.PENDING_PAYMENT,
      subtotal: data.subtotal,
      discountAmount: 0,
      shippingFee: 0,
      taxAmount: 0,
      total: data.total,
      couponId: null,
      couponCode: null,
      shippingRecipientName: data.shippingRecipientName,
      shippingPhone: data.shippingPhone,
      shippingAddressLine1: data.shippingAddressLine1,
      shippingAddressLine2: null,
      shippingCity: data.shippingCity,
      shippingState: data.shippingState,
      shippingPostalCode: data.shippingPostalCode,
      shippingCountry: 'India',
      trackingNumber: null,
      courierName: null,
      customerNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item-1',
          orderId: 'order-mto-1',
          productId: validProductId2,
          productName: sampleMadeToOrderProduct.name,
          productSku: sampleMadeToOrderProduct.sku,
          unitPrice: sampleMadeToOrderProduct.price,
          quantity: 2,
          total: sampleMadeToOrderProduct.price * 2,
          createdAt: new Date(),
        },
      ],
      payments: [
        {
          id: 'pay-1',
          orderId: 'order-mto-1',
          provider: 'razorpay',
          providerOrderId: null,
          providerPaymentId: null,
          providerSignature: null,
          amount: sampleMadeToOrderProduct.price * 2,
          currency: 'INR',
          status: PaymentStatus.PENDING,
          failureReason: null,
          paidAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }));

    const result = await service.createOrder({
      ...sampleRequest,
      items: [{ productId: validProductId2, quantity: 2 }],
    });

    expect(updateManyMock).not.toHaveBeenCalled();
    expect(result.subtotal).toBe(499800);
    expect(result.total).toBe(499800);
  });

  it('rejects checkout when product does not exist with NotFoundError (404)', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };
      return callback(mockTx);
    });

    await expect(service.createOrder(sampleRequest)).rejects.toThrow(NotFoundError);
  });

  it('rejects checkout when product is inactive with BadRequestError', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            ...sampleInStockProduct,
            isActive: false,
          }),
        },
      };
      return callback(mockTx);
    });

    await expect(service.createOrder(sampleRequest)).rejects.toThrow(BadRequestError);
  });

  it('rejects checkout when category is inactive with BadRequestError', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            ...sampleInStockProduct,
            category: { ...sampleCategory, isActive: false },
          }),
        },
      };
      return callback(mockTx);
    });

    await expect(service.createOrder(sampleRequest)).rejects.toThrow(BadRequestError);
  });

  it('rejects checkout when product is SOLD_OUT with ConflictError (409)', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            ...sampleInStockProduct,
            availability: ProductAvailability.SOLD_OUT,
          }),
        },
      };
      return callback(mockTx);
    });

    await expect(service.createOrder(sampleRequest)).rejects.toThrow(ConflictError);
  });

  it('rejects checkout when IN_STOCK stockQuantity is less than requested quantity', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            ...sampleInStockProduct,
            stockQuantity: 1,
          }),
        },
      };
      return callback(mockTx);
    });

    await expect(
      service.createOrder({
        ...sampleRequest,
        items: [{ productId: validProductId1, quantity: 2 }],
      })
    ).rejects.toThrow(ConflictError);
  });

  it('rejects checkout when concurrent atomic update reservation fails (count 0)', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            ...sampleInStockProduct,
            stockQuantity: 1,
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };
      return callback(mockTx);
    });

    await expect(service.createOrder(sampleRequest)).rejects.toThrow(ConflictError);
  });

  it('handles idempotency key replay by returning the identical cached order response', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue(sampleInStockProduct),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(mockTx);
    });

    let repoCalls = 0;
    vi.spyOn(mockOrderRepo, 'createOrderTransaction').mockImplementation(async (_tx, data) => {
      repoCalls++;
      return {
        id: 'order-idempotent-1',
        orderNumber: data.orderNumber,
        userId: null,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        status: OrderStatus.PENDING_PAYMENT,
        subtotal: data.subtotal,
        discountAmount: 0,
        shippingFee: 0,
        taxAmount: 0,
        total: data.total,
        couponId: null,
        couponCode: null,
        shippingRecipientName: data.shippingRecipientName,
        shippingPhone: data.shippingPhone,
        shippingAddressLine1: data.shippingAddressLine1,
        shippingAddressLine2: null,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountry: 'India',
        trackingNumber: null,
        courierName: null,
        customerNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            orderId: 'order-idempotent-1',
            productId: validProductId1,
            productName: sampleInStockProduct.name,
            productSku: sampleInStockProduct.sku,
            unitPrice: sampleInStockProduct.price,
            quantity: 1,
            total: sampleInStockProduct.price,
            createdAt: new Date(),
          },
        ],
        payments: [
          {
            id: 'pay-1',
            orderId: 'order-idempotent-1',
            provider: 'razorpay',
            providerOrderId: null,
            providerPaymentId: null,
            providerSignature: null,
            amount: sampleInStockProduct.price,
            currency: 'INR',
            status: PaymentStatus.PENDING,
            failureReason: null,
            paidAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
    });

    const idempotencyKey = 'unique-checkout-submission-key-123';

    // First call
    const order1 = await service.createOrder(sampleRequest, idempotencyKey);
    // Duplicate call with same key
    const order2 = await service.createOrder(sampleRequest, idempotencyKey);

    expect(order1.orderNumber).toBe(order2.orderNumber);
    expect(order1.id).toBe(order2.id);
    expect(repoCalls).toBe(1); // Only one actual DB transaction executed
  });

  describe('getOrderById', () => {
    const validOrderId = '33333333-3333-4333-8333-333333333333';
    const customerId = '11111111-1111-4111-8111-111111111111';
    const otherCustomerId = '22222222-2222-4222-8222-222222222222';

    const mockDbOrder = {
      id: validOrderId,
      orderNumber: 'MAT-20261005-7F2A9C',
      userId: customerId,
      customerEmail: 'priya@example.com',
      customerPhone: '9876543210',
      status: OrderStatus.CONFIRMED,
      subtotal: 149900,
      discountAmount: 0,
      shippingFee: 0,
      taxAmount: 0,
      total: 149900,
      couponId: null,
      couponCode: null,
      shippingRecipientName: 'Priya Sharma',
      shippingPhone: '9876543210',
      shippingAddressLine1: 'Flat 101, Lotus Apts, MG Road',
      shippingAddressLine2: 'Near Central Park',
      shippingCity: 'Bengaluru',
      shippingState: 'Karnataka',
      shippingPostalCode: '560001',
      shippingCountry: 'India',
      trackingNumber: null,
      courierName: null,
      customerNotes: null,
      createdAt: new Date('2026-10-05T12:00:00Z'),
      updatedAt: new Date('2026-10-05T12:05:00Z'),
      items: [
        {
          id: 'item-1',
          orderId: validOrderId,
          productId: validProductId1,
          productName: 'Sacred Lotus Mandala',
          productSku: 'MND-LOTUS-01',
          unitPrice: 149900,
          quantity: 1,
          total: 149900,
          createdAt: new Date('2026-10-05T12:00:00Z'),
        },
      ],
      payments: [
        {
          id: 'pay-1',
          orderId: validOrderId,
          provider: 'razorpay',
          providerOrderId: 'order_rzp_123',
          providerPaymentId: 'pay_rzp_123',
          providerSignature: null,
          amount: 149900,
          currency: 'INR',
          status: PaymentStatus.CAPTURED,
          failureReason: null,
          paidAt: new Date('2026-10-05T12:05:00Z'),
          createdAt: new Date('2026-10-05T12:00:00Z'),
          updatedAt: new Date('2026-10-05T12:05:00Z'),
        },
      ],
    };

    it('returns formatted order details when order exists and belongs to user', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(mockDbOrder);

      const result = await service.getOrderById(validOrderId, customerId);

      expect(result.id).toBe(validOrderId);
      expect(result.orderNumber).toBe('MAT-20261005-7F2A9C');
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(result.paymentStatus).toBe(PaymentStatus.CAPTURED);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productName).toBe('Sacred Lotus Mandala');
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].status).toBe(PaymentStatus.CAPTURED);
    });

    it('throws NotFoundError when order does not exist', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(null);

      await expect(service.getOrderById(validOrderId, customerId)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError (security anti-enumeration) when order belongs to different user', async () => {
      vi.spyOn(mockOrderRepo, 'findById').mockResolvedValue(mockDbOrder);

      await expect(service.getOrderById(validOrderId, otherCustomerId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getOrderHistory', () => {
    const customerId = '11111111-1111-4111-8111-111111111111';

    it('returns paginated orders list sorted newest first', async () => {
      vi.spyOn(mockOrderRepo, 'findByUserId').mockResolvedValue({
        orders: [
          {
            id: 'order-1',
            orderNumber: 'MAT-20261005-7F2A9C',
            userId: customerId,
            customerEmail: 'priya@example.com',
            customerPhone: '9876543210',
            status: OrderStatus.CONFIRMED,
            subtotal: 149900,
            discountAmount: 0,
            shippingFee: 0,
            taxAmount: 0,
            total: 149900,
            couponId: null,
            couponCode: null,
            shippingRecipientName: 'Priya Sharma',
            shippingPhone: '9876543210',
            shippingAddressLine1: 'Flat 101, Lotus Apts, MG Road',
            shippingAddressLine2: null,
            shippingCity: 'Bengaluru',
            shippingState: 'Karnataka',
            shippingPostalCode: '560001',
            shippingCountry: 'India',
            trackingNumber: null,
            courierName: null,
            customerNotes: null,
            createdAt: new Date('2026-10-05T12:00:00Z'),
            updatedAt: new Date('2026-10-05T12:05:00Z'),
            items: [
              {
                id: 'item-1',
                orderId: 'order-1',
                productId: validProductId1,
                productName: 'Sacred Lotus Mandala',
                productSku: 'MND-LOTUS-01',
                unitPrice: 149900,
                quantity: 1,
                total: 149900,
                createdAt: new Date('2026-10-05T12:00:00Z'),
              },
            ],
            payments: [
              {
                id: 'pay-1',
                orderId: 'order-1',
                provider: 'razorpay',
                providerOrderId: 'order_rzp_123',
                providerPaymentId: 'pay_rzp_123',
                providerSignature: null,
                amount: 149900,
                currency: 'INR',
                status: PaymentStatus.CAPTURED,
                failureReason: null,
                paidAt: new Date('2026-10-05T12:05:00Z'),
                createdAt: new Date('2026-10-05T12:00:00Z'),
                updatedAt: new Date('2026-10-05T12:05:00Z'),
              },
            ],
          },
        ],
        total: 1,
      });

      const result = await service.getOrderHistory(customerId, 1, 10);

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].id).toBe('order-1');
      expect(result.orders[0].orderNumber).toBe('MAT-20261005-7F2A9C');
      expect(result.orders[0].status).toBe(OrderStatus.CONFIRMED);
      expect(result.orders[0].paymentStatus).toBe(PaymentStatus.CAPTURED);
      expect(result.orders[0].itemCount).toBe(1);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('returns empty list when user has no orders', async () => {
      vi.spyOn(mockOrderRepo, 'findByUserId').mockResolvedValue({
        orders: [],
        total: 0,
      });

      const result = await service.getOrderHistory(customerId, 1, 10);

      expect(result.orders).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});
