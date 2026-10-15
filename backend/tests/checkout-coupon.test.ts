import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService } from '../src/services/order.service';
import { OrderRepository } from '../src/repositories/order.repository';
import { prisma } from '../src/db/prisma';
import { DiscountType, ProductAvailability, OrderStatus } from '@prisma/client';
import { ConflictError } from '../src/errors';
import type { CreateOrderRequest } from '../src/types';

describe('Checkout Coupon Lifecycle & Concurrency Integration', () => {
  let mockOrderRepo: OrderRepository;
  let service: OrderService;

  const validProductId = '11111111-1111-4111-8111-111111111111';
  const couponId = 'c1111111-1111-4111-8111-111111111111';

  const sampleProduct = {
    id: validProductId,
    sku: 'MND-LOTUS-01',
    name: 'Sacred Lotus Mandala',
    slug: 'sacred-lotus-mandala',
    description: '12x12 inch acrylic on canvas',
    shortDescription: null,
    price: 200000, // ₹2,000.00
    compareAtPrice: null,
    categoryId: 'cat-111',
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 5,
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
    category: {
      id: 'cat-111',
      name: 'Canvas Mandalas',
      slug: 'canvas-mandalas',
      description: null,
      imageUrl: null,
      displayOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const sampleCoupon = {
    id: couponId,
    code: 'FESTIVE25',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 25, // 25% off -> ₹500 off on ₹2,000
    minOrderAmount: 100000, // ₹1,000 min
    maxDiscountAmount: 100000,
    usageLimit: 2,
    timesUsed: 1, // 1 used already
    validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseOrderRequest: CreateOrderRequest = {
    customer: {
      fullName: 'Aarav Sharma',
      email: 'aarav@example.com',
      phone: '9876543210',
    },
    shippingAddress: {
      addressLine1: 'Flat 402, Lotus Residency',
      city: 'Udaipur',
      state: 'Rajasthan',
      postalCode: '313001',
      country: 'India',
    },
    items: [{ productId: validProductId, quantity: 1 }],
  };

  beforeEach(() => {
    mockOrderRepo = new OrderRepository(prisma);
    service = new OrderService(mockOrderRepo, prisma);
  });

  describe('Order Creation with Coupon', () => {
    it('applies authoritative server-side discount and creates order with coupon snapshot', async () => {
      // Mock interactive transaction
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi.fn().mockResolvedValue(sampleProduct),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          coupon: {
            findUnique: vi.fn().mockResolvedValue(sampleCoupon),
          },
          $queryRaw: vi.fn().mockImplementation((query: any) => {
            const sqlStr = String(query.strings || query);
            if (sqlStr.includes('FOR UPDATE')) {
              return [sampleCoupon];
            }
            if (sqlStr.includes('COUNT(*)')) {
              // 0 active pending reservations
              return [{ count: 0n }];
            }
            return [];
          }),
        };
        return callback(mockTx);
      });

      const createTxSpy = vi.spyOn(mockOrderRepo, 'createOrderTransaction').mockResolvedValue({
        id: 'order-123',
        orderNumber: 'ORD-20261015-0001',
        userId: null,
        customerEmail: 'aarav@example.com',
        customerPhone: '9876543210',
        status: 'PENDING_PAYMENT',
        subtotal: 200000,
        discountAmount: 50000, // 25% of ₹2,000 = ₹500
        shippingFee: 0,
        taxAmount: 0,
        total: 150000, // ₹1,500
        couponId: sampleCoupon.id,
        couponCode: sampleCoupon.code,
        shippingRecipientName: 'Aarav Sharma',
        shippingPhone: '9876543210',
        shippingAddressLine1: 'Flat 402, Lotus Residency',
        shippingAddressLine2: null,
        shippingCity: 'Udaipur',
        shippingState: 'Rajasthan',
        shippingPostalCode: '313001',
        shippingCountry: 'India',
        trackingNumber: null,
        courierName: null,
        customerNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            orderId: 'order-123',
            productId: validProductId,
            productName: sampleProduct.name,
            productSku: sampleProduct.sku,
            unitPrice: 200000,
            quantity: 1,
            total: 200000,
            createdAt: new Date(),
          },
        ],
        payments: [
          {
            id: 'pay-1',
            orderId: 'order-123',
            provider: 'razorpay',
            providerOrderId: null,
            providerPaymentId: null,
            providerSignature: null,
            amount: 150000,
            currency: 'INR',
            status: 'PENDING',
            failureReason: null,
            paidAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      } as any);

      const response = await service.createOrder({
        ...baseOrderRequest,
        couponCode: 'festive25', // lowercase to test normalization
      });

      expect(response.subtotal).toBe(200000);
      expect(response.discountAmount).toBe(50000);
      expect(response.total).toBe(150000);
      expect(response.couponCode).toBe('FESTIVE25');

      expect(createTxSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          subtotal: 200000,
          discountAmount: 50000,
          total: 150000,
          couponId: sampleCoupon.id,
          couponCode: 'FESTIVE25',
          payment: expect.objectContaining({
            amount: 150000,
          }),
        })
      );
    });

    it('rejects checkout when usage limit is reached (timesUsed + active reservations)', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findUnique: vi.fn().mockResolvedValue(sampleProduct),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          coupon: {
            findUnique: vi.fn().mockResolvedValue(sampleCoupon),
          },
          $queryRaw: vi.fn().mockImplementation((query: any) => {
            const sqlStr = String(query.strings || query);
            if (sqlStr.includes('FOR UPDATE')) {
              return [sampleCoupon]; // timesUsed is 1, usageLimit is 2
            }
            if (sqlStr.includes('COUNT(*)')) {
              // 1 active pending reservation already in flight -> total = 1 + 1 = 2 >= 2
              return [{ count: 1n }];
            }
            return [];
          }),
        };
        return callback(mockTx);
      });

      await expect(
        service.createOrder({
          ...baseOrderRequest,
          couponCode: 'FESTIVE25',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('Payment Capture & Late-Capture Overage in OrderRepository', () => {
    it('increments timesUsed atomically exactly once upon normal verified payment capture', async () => {
      const executeRawSpy = vi.fn().mockResolvedValue(1);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'order-123',
              couponId: sampleCoupon.id,
              total: 150000,
              payments: [{ id: 'pay-1', status: 'PENDING' }],
            }),
            update: vi.fn().mockResolvedValue({
              id: 'order-123',
              status: OrderStatus.CONFIRMED,
              items: [],
              payments: [{ id: 'pay-1', status: 'CAPTURED' }],
            }),
          },
          payment: {
            update: vi.fn().mockResolvedValue({
              id: 'pay-1',
              status: 'CAPTURED',
            }),
          },
          $queryRaw: vi.fn().mockImplementation((query: any) => {
            const sqlStr = String(query.strings || query);
            if (sqlStr.includes('FOR UPDATE')) {
              return [sampleCoupon]; // timesUsed: 1, usageLimit: 2
            }
            if (sqlStr.includes('COUNT(*)')) {
              return [{ other_active_count: 0n, self_active_count: 1n }];
            }
            return [];
          }),
          $executeRaw: executeRawSpy,
        };
        return callback(mockTx);
      });

      const repo = new OrderRepository(prisma);
      const result = await repo.confirmOrderAndCapturePayment(
        'pay-1',
        'order-123',
        'rzp_pay_999',
        'rzp_sig_999'
      );

      expect(result.order.status).toBe(OrderStatus.CONFIRMED);
      expect(executeRawSpy).toHaveBeenCalledOnce(); // times_used incremented
    });

    it('idempotently handles duplicate payment.captured calls without double-incrementing timesUsed', async () => {
      const executeRawSpy = vi.fn();

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'order-123',
              status: OrderStatus.CONFIRMED,
              couponId: sampleCoupon.id,
              payments: [{ id: 'pay-1', status: 'CAPTURED' }], // Already captured!
            }),
          },
          $executeRaw: executeRawSpy,
        };
        return callback(mockTx);
      });

      const repo = new OrderRepository(prisma);
      const result = await repo.confirmOrderAndCapturePayment('pay-1', 'order-123', 'rzp_pay_999');

      expect(result.payment.status).toBe('CAPTURED');
      expect(executeRawSpy).not.toHaveBeenCalled(); // No double increment
    });

    it('handles late capture overage: marks Payment as CAPTURED, Order as CANCELLED with reconciliation note, and does NOT increment timesUsed', async () => {
      const executeRawSpy = vi.fn();
      let capturedOrderData: any = null;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'order-123',
              status: OrderStatus.PENDING_PAYMENT,
              couponId: sampleCoupon.id,
              customerNotes: null,
              total: 150000,
              payments: [{ id: 'pay-1', status: 'PENDING' }],
            }),
            update: vi.fn().mockImplementation((args: any) => {
              capturedOrderData = args.data;
              return {
                id: 'order-123',
                status: args.data.status,
                items: [],
                payments: [{ id: 'pay-1', status: 'CAPTURED' }],
              };
            }),
          },
          payment: {
            update: vi.fn().mockResolvedValue({
              id: 'pay-1',
              status: 'CAPTURED',
            }),
          },
          $queryRaw: vi.fn().mockImplementation((query: any) => {
            const sqlStr = String(query.strings || query);
            if (sqlStr.includes('FOR UPDATE')) {
              return [
                {
                  ...sampleCoupon,
                  usageLimit: 1,
                  timesUsed: 1, // Already at limit! Another customer used the slot!
                },
              ];
            }
            if (sqlStr.includes('COUNT(*)')) {
              return [{ other_active_count: 0n, self_active_count: 0n }];
            }
            return [];
          }),
          $executeRaw: executeRawSpy,
        };
        return callback(mockTx);
      });

      const repo = new OrderRepository(prisma);
      const result = await repo.confirmOrderAndCapturePayment('pay-1', 'order-123', 'rzp_pay_late');

      expect(result.payment.status).toBe('CAPTURED'); // Payment is recorded as captured
      expect(result.order.status).toBe(OrderStatus.CANCELLED); // Order is marked CANCELLED
      expect(executeRawSpy).not.toHaveBeenCalled(); // times_used is NOT incremented beyond limit
      expect(capturedOrderData.customerNotes).toContain('[COUPON_OVERAGE_RECONCILIATION]');
    });
  });

  describe('Mandatory Regression Scenarios: Late-Capture Capacity Invariant', () => {
    // Scenario A: usageLimit = 2, timesUsed = 0, one active reservation remains, and two previously expired orders receive late captures.
    it('Scenario A: preserves capacity invariant when 2 expired orders receive late captures while 1 active reservation exists (limit: 2)', async () => {
      let timesUsed = 0;
      const usageLimit = 2;
      const otherActiveReservations = 1n; // 1 other active unexpired reservation

      // Simulate serialized processing through the repository
      const processCapture = async (orderId: string, payId: string) => {
        let capturedOrder: any = null;
        const executeRawSpy = vi.fn().mockImplementation(async () => {
          timesUsed += 1;
        });

        vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
          const mockTx = {
            order: {
              findUnique: vi.fn().mockResolvedValue({
                id: orderId,
                status: OrderStatus.PENDING_PAYMENT,
                couponId: sampleCoupon.id,
                total: 200000,
                customerNotes: null,
                payments: [{ id: payId, status: 'PENDING' }],
              }),
              update: vi.fn().mockImplementation((args: any) => {
                capturedOrder = {
                  id: orderId,
                  status: args.data.status,
                  customerNotes: args.data.customerNotes,
                  payments: [{ id: payId, status: 'CAPTURED' }],
                };
                return capturedOrder;
              }),
            },
            payment: {
              update: vi.fn().mockResolvedValue({ id: payId, status: 'CAPTURED' }),
            },
            $queryRaw: vi.fn().mockImplementation((query: any) => {
              const sqlStr = String(query.strings || query);
              if (sqlStr.includes('FOR UPDATE')) {
                return [{ ...sampleCoupon, usageLimit, timesUsed }];
              }
              if (sqlStr.includes('COUNT(*)')) {
                // Expired order: self_active is 0, other active reservations is 1
                return [{ other_active_count: otherActiveReservations, self_active_count: 0n }];
              }
              return [];
            }),
            $executeRaw: executeRawSpy,
          };
          return callback(mockTx);
        });

        const repo = new OrderRepository(prisma);
        return repo.confirmOrderAndCapturePayment(payId, orderId, `rzp_${payId}`);
      };

      // 1. Expired Order 1 receives late capture:
      // timesUsed (0) + 1 + otherActive (1) = 2 <= 2 -> CONFIRMED
      const res1 = await processCapture('exp-order-1', 'pay-1');
      expect(res1.order.status).toBe(OrderStatus.CONFIRMED);
      expect(timesUsed).toBe(1);

      // 2. Expired Order 2 receives late capture:
      // timesUsed (1) + 1 + otherActive (1) = 3 > 2 -> CANCELLED with reconciliation note
      const res2 = await processCapture('exp-order-2', 'pay-2');
      expect(res2.order.status).toBe(OrderStatus.CANCELLED);
      expect(res2.payment.status).toBe('CAPTURED');
      expect(timesUsed).toBe(1); // Never exceeded limit (timesUsed remains 1, occupied slots = 1 confirmed + 1 reservation = 2)
      expect(res2.order.customerNotes).toContain('[COUPON_OVERAGE_RECONCILIATION]');
    });

    // Scenario B: usageLimit = 1, timesUsed = 1, and a late capture arrives.
    it('Scenario B: truthful payment capture and reconciliation transition when usageLimit is exhausted (limit: 1, timesUsed: 1)', async () => {
      let persistedNotes: string | undefined;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'late-order-b',
              status: OrderStatus.PENDING_PAYMENT,
              couponId: sampleCoupon.id,
              total: 120000,
              customerNotes: 'Please ring the bell',
              payments: [{ id: 'pay-b', status: 'PENDING' }],
            }),
            update: vi.fn().mockImplementation((args: any) => {
              persistedNotes = args.data.customerNotes;
              return {
                id: 'late-order-b',
                status: args.data.status,
                customerNotes: args.data.customerNotes,
                payments: [{ id: 'pay-b', status: 'CAPTURED' }],
              };
            }),
          },
          payment: {
            update: vi.fn().mockResolvedValue({ id: 'pay-b', status: 'CAPTURED' }),
          },
          $queryRaw: vi.fn().mockImplementation((query: any) => {
            const sqlStr = String(query.strings || query);
            if (sqlStr.includes('FOR UPDATE')) {
              return [{ ...sampleCoupon, usageLimit: 1, timesUsed: 1 }];
            }
            if (sqlStr.includes('COUNT(*)')) {
              return [{ other_active_count: 0n, self_active_count: 0n }];
            }
            return [];
          }),
          $executeRaw: vi.fn(),
        };
        return callback(mockTx);
      });

      const repo = new OrderRepository(prisma);
      const result = await repo.confirmOrderAndCapturePayment('pay-b', 'late-order-b', 'rzp_pay_b');

      expect(result.payment.status).toBe('CAPTURED');
      expect(result.order.status).toBe(OrderStatus.CANCELLED);
      expect(persistedNotes).toContain('Please ring the bell');
      expect(persistedNotes).toContain('[COUPON_OVERAGE_RECONCILIATION]');
    });

    // Scenario C: A late capture arrives while another customer's reservation is active and there is exactly one remaining slot.
    it("Scenario C: consumes exactly the last remaining slot when another customer's reservation is active (limit: 2, timesUsed: 0, active: 1)", async () => {
      const executeRawSpy = vi.fn().mockResolvedValue(1);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'order-c',
              status: OrderStatus.PENDING_PAYMENT,
              couponId: sampleCoupon.id,
              total: 150000,
              customerNotes: null,
              payments: [{ id: 'pay-c', status: 'PENDING' }],
            }),
            update: vi.fn().mockResolvedValue({
              id: 'order-c',
              status: OrderStatus.CONFIRMED,
              payments: [{ id: 'pay-c', status: 'CAPTURED' }],
            }),
          },
          payment: {
            update: vi.fn().mockResolvedValue({ id: 'pay-c', status: 'CAPTURED' }),
          },
          $queryRaw: vi.fn().mockImplementation((query: any) => {
            const sqlStr = String(query.strings || query);
            if (sqlStr.includes('FOR UPDATE')) {
              return [{ ...sampleCoupon, usageLimit: 2, timesUsed: 0 }];
            }
            if (sqlStr.includes('COUNT(*)')) {
              // 1 other reservation is active, expired self
              return [{ other_active_count: 1n, self_active_count: 0n }];
            }
            return [];
          }),
          $executeRaw: executeRawSpy,
        };
        return callback(mockTx);
      });

      const repo = new OrderRepository(prisma);
      const result = await repo.confirmOrderAndCapturePayment('pay-c', 'order-c', 'rzp_pay_c');

      expect(result.order.status).toBe(OrderStatus.CONFIRMED);
      expect(executeRawSpy).toHaveBeenCalledOnce(); // Claimed the last remaining slot
    });

    // Scenario D: Concurrent late captures compete for the remaining capacity.
    it('Scenario D: serializes concurrent late captures so only capacity-permitted capture succeeds', async () => {
      let timesUsed = 0;
      const usageLimit = 1;

      // Model PostgreSQL exclusive row-lock queue: second transaction waits until first completes
      let rowLockMutex = Promise.resolve();

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const currentLock = rowLockMutex;
        let releaseLock: () => void = () => {};
        rowLockMutex = new Promise(resolve => {
          releaseLock = resolve;
        });

        await currentLock;
        try {
          const mockTx = {
            order: {
              findUnique: vi.fn().mockImplementation(async ({ where }: any) => ({
                id: where.id,
                status: OrderStatus.PENDING_PAYMENT,
                couponId: sampleCoupon.id,
                total: 100000,
                customerNotes: null,
                payments: [
                  {
                    id: where.id === 'order-race-1' ? 'pay-race-1' : 'pay-race-2',
                    status: 'PENDING',
                  },
                ],
              })),
              update: vi.fn().mockImplementation((args: any) => ({
                id: args.where.id,
                status: args.data.status,
                customerNotes: args.data.customerNotes,
                payments: [{ id: `pay-${args.where.id}`, status: 'CAPTURED' }],
              })),
            },
            payment: {
              update: vi.fn().mockImplementation(async ({ where }: any) => ({
                id: where.id,
                status: 'CAPTURED',
              })),
            },
            $queryRaw: vi.fn().mockImplementation((query: any) => {
              const sqlStr = String(query.strings || query);
              if (sqlStr.includes('FOR UPDATE')) {
                // Exclusive lock guarantees serialized read of updated timesUsed
                return [{ ...sampleCoupon, usageLimit, timesUsed }];
              }
              if (sqlStr.includes('COUNT(*)')) {
                return [{ other_active_count: 0n, self_active_count: 0n }];
              }
              return [];
            }),
            $executeRaw: vi.fn().mockImplementation(async () => {
              timesUsed += 1;
            }),
          };
          return await callback(mockTx);
        } finally {
          releaseLock();
        }
      });

      const repo = new OrderRepository(prisma);

      const [firstCapture, secondCapture] = await Promise.all([
        repo.confirmOrderAndCapturePayment('pay-race-1', 'order-race-1', 'rzp_race_1'),
        repo.confirmOrderAndCapturePayment('pay-race-2', 'order-race-2', 'rzp_race_2'),
      ]);

      const statuses = [firstCapture.order.status, secondCapture.order.status];
      expect(statuses).toContain(OrderStatus.CONFIRMED);
      expect(statuses).toContain(OrderStatus.CANCELLED);
      expect(timesUsed).toBe(1); // Never exceeded limit 1
    });

    // Scenario E: Duplicate capture webhook and verification requests do not increment usage twice or overwrite reconciliation state.
    it('Scenario E: idempotency prevents duplicate capture calls from re-incrementing usage or altering reconciliation state', async () => {
      const executeRawSpy = vi.fn();

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'order-reconciled',
              status: OrderStatus.CANCELLED,
              couponId: sampleCoupon.id,
              customerNotes: '[COUPON_OVERAGE_RECONCILIATION] Existing banner',
              payments: [{ id: 'pay-reconciled', status: 'CAPTURED' }], // Already captured!
            }),
          },
          $executeRaw: executeRawSpy,
        };
        return callback(mockTx);
      });

      const repo = new OrderRepository(prisma);
      const result = await repo.confirmOrderAndCapturePayment(
        'pay-reconciled',
        'order-reconciled',
        'rzp_dup_call'
      );

      expect(result.order.status).toBe(OrderStatus.CANCELLED);
      expect(result.payment.status).toBe('CAPTURED');
      expect(result.order.customerNotes).toBe('[COUPON_OVERAGE_RECONCILIATION] Existing banner');
      expect(executeRawSpy).not.toHaveBeenCalled(); // Exactly-once safety
    });

    // Scenario F: Normal capture of an active reservation transfers its slot from reservation count to confirmed usage without double-counting.
    it('Scenario F: normal capture of an active reservation transfers its reserved slot to confirmed usage without double-counting', async () => {
      const executeRawSpy = vi.fn().mockResolvedValue(1);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'order-active-f',
              status: OrderStatus.PENDING_PAYMENT,
              couponId: sampleCoupon.id,
              total: 200000,
              payments: [{ id: 'pay-f', status: 'PENDING' }],
            }),
            update: vi.fn().mockResolvedValue({
              id: 'order-active-f',
              status: OrderStatus.CONFIRMED,
              payments: [{ id: 'pay-f', status: 'CAPTURED' }],
            }),
          },
          payment: {
            update: vi.fn().mockResolvedValue({ id: 'pay-f', status: 'CAPTURED' }),
          },
          $queryRaw: vi.fn().mockImplementation((query: any) => {
            const sqlStr = String(query.strings || query);
            if (sqlStr.includes('FOR UPDATE')) {
              // usageLimit: 2, timesUsed: 0
              return [{ ...sampleCoupon, usageLimit: 2, timesUsed: 0 }];
            }
            if (sqlStr.includes('COUNT(*)')) {
              // Self order is active (self_active_count = 1), and 1 other reservation exists (other_active_count = 1)
              // Total occupied before capture = 0 + 1 + 1 = 2
              return [{ other_active_count: 1n, self_active_count: 1n }];
            }
            return [];
          }),
          $executeRaw: executeRawSpy,
        };
        return callback(mockTx);
      });

      const repo = new OrderRepository(prisma);
      const result = await repo.confirmOrderAndCapturePayment(
        'pay-f',
        'order-active-f',
        'rzp_pay_f'
      );

      expect(result.order.status).toBe(OrderStatus.CONFIRMED);
      // Captured order moves from self_active to timesUsed (+1) while otherActive remains 1:
      // occupied slots after = (0 + 1) + 1 = 2 <= 2.
      expect(executeRawSpy).toHaveBeenCalledOnce();
    });
  });
});
