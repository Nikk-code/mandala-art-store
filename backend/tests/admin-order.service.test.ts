import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { OrderService } from '../src/services/order.service';
import type { OrderRepository, AdminOrderRecord } from '../src/repositories/order.repository';
import { NotFoundError, ConflictError, ValidationError } from '../src/errors';
import {
  resolveEffectivePaymentStatus,
  buildPaymentStatusPrismaFilter,
} from '../src/utils/payment-status';
import {
  validateAdminOrderListQuery,
  validateUpdateOrderStatusInput,
} from '../src/utils/order-admin-validation';

describe('Admin Order Management — Unit & Service Tests', () => {
  const sampleOrderId = '11111111-1111-4111-8111-111111111111';
  const sampleUserId = '22222222-2222-4222-8222-222222222222';

  const createSampleAdminOrderRecord = (
    overrides?: Partial<AdminOrderRecord>
  ): AdminOrderRecord => ({
    id: sampleOrderId,
    orderNumber: 'MAT-20261005-7F2A9C',
    userId: sampleUserId,
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
    shippingAddressLine1: 'Flat 101, Lotus Apts',
    shippingAddressLine2: 'MG Road',
    shippingCity: 'Bengaluru',
    shippingState: 'Karnataka',
    shippingPostalCode: '560001',
    shippingCountry: 'India',
    trackingNumber: null,
    courierName: null,
    customerNotes: 'Fragile mandala piece',
    createdAt: new Date('2026-10-05T10:00:00.000Z'),
    updatedAt: new Date('2026-10-05T10:05:00.000Z'),
    items: [
      {
        id: 'item-1',
        orderId: sampleOrderId,
        productId: 'prod-1',
        productName: 'Sacred Lotus Mandala',
        productSku: 'MND-LOTUS-01',
        unitPrice: 149900,
        quantity: 1,
        total: 149900,
        createdAt: new Date('2026-10-05T10:00:00.000Z'),
      },
    ],
    payments: [
      {
        id: 'pay-1',
        orderId: sampleOrderId,
        provider: 'razorpay',
        providerOrderId: 'order_rzp_123',
        providerPaymentId: 'pay_rzp_123',
        providerSignature: 'sig_123',
        amount: 149900,
        currency: 'INR',
        status: PaymentStatus.CAPTURED,
        failureReason: null,
        paidAt: new Date('2026-10-05T10:05:00.000Z'),
        createdAt: new Date('2026-10-05T10:00:00.000Z'),
        updatedAt: new Date('2026-10-05T10:05:00.000Z'),
      },
    ],
    user: {
      id: sampleUserId,
      email: 'priya@example.com',
      firstName: 'Priya',
      lastName: 'Sharma',
    },
    ...overrides,
  });

  let mockRepo: {
    findAdminOrders: ReturnType<typeof vi.fn>;
    findAdminOrderById: ReturnType<typeof vi.fn>;
    updateOrderStatusConditionally: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByOrderNumber: ReturnType<typeof vi.fn>;
    findByUserId: ReturnType<typeof vi.fn>;
    createOrderTransaction: ReturnType<typeof vi.fn>;
    updatePaymentProviderOrderId: ReturnType<typeof vi.fn>;
    findPaymentByProviderOrderId: ReturnType<typeof vi.fn>;
    confirmOrderAndCapturePayment: ReturnType<typeof vi.fn>;
    markPaymentFailed: ReturnType<typeof vi.fn>;
  };

  let service: OrderService;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepo = {
      findAdminOrders: vi.fn(),
      findAdminOrderById: vi.fn(),
      updateOrderStatusConditionally: vi.fn(),
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findByUserId: vi.fn(),
      createOrderTransaction: vi.fn(),
      updatePaymentProviderOrderId: vi.fn(),
      findPaymentByProviderOrderId: vi.fn(),
      confirmOrderAndCapturePayment: vi.fn(),
      markPaymentFailed: vi.fn(),
    };

    service = new OrderService(mockRepo as unknown as OrderRepository);
  });

  // ============================================================================
  // 1. PAYMENT STATUS RESOLUTION & PRISMA FILTER HELPERS
  // ============================================================================
  describe('Payment Status Resolution Logic & Filter Bijectivity', () => {
    const allPaymentStatuses = [
      PaymentStatus.CAPTURED,
      PaymentStatus.REFUNDED,
      PaymentStatus.AUTHORIZED,
      PaymentStatus.PENDING,
      PaymentStatus.FAILED,
    ];

    /**
     * Evaluates a Prisma PaymentListRelationFilter against an array of payments,
     * mirroring PostgreSQL evaluation of `some` (EXISTS) and `none` (NOT EXISTS).
     */
    function matchesPrismaPaymentFilter(
      payments: Array<{ status: PaymentStatus }>,
      filter: ReturnType<typeof buildPaymentStatusPrismaFilter>
    ): boolean {
      if (filter.some) {
        const someStatus = (filter.some as { status?: PaymentStatus }).status;
        if (someStatus && !payments.some(p => p.status === someStatus)) {
          return false;
        }
      }
      if (filter.none) {
        const noneConfig = filter.none as {
          status?: PaymentStatus | { in?: PaymentStatus[] };
        };
        if (typeof noneConfig.status === 'string') {
          if (payments.some(p => p.status === noneConfig.status)) {
            return false;
          }
        } else if (noneConfig.status && Array.isArray(noneConfig.status.in)) {
          if (payments.some(p => noneConfig.status!.in!.includes(p.status))) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * Asserts that:
     * 1. resolveEffectivePaymentStatus returns the expected status.
     * 2. The filter for that status matches the order's payments.
     * 3. The filters for ALL OTHER statuses reject the order's payments (strictly bijective).
     */
    function assertPaymentFilterBijectivity(
      payments: Array<{ status: PaymentStatus }>,
      expectedEffectiveStatus: PaymentStatus
    ): void {
      const effective = resolveEffectivePaymentStatus(payments);
      expect(effective).toBe(expectedEffectiveStatus);

      for (const status of allPaymentStatuses) {
        const filter = buildPaymentStatusPrismaFilter(status);
        const isMatch = matchesPrismaPaymentFilter(payments, filter);
        if (status === expectedEffectiveStatus) {
          expect(
            isMatch,
            `Expected filter for ${status} to match payments: ${payments.map(p => p.status).join(', ')}`
          ).toBe(true);
        } else {
          expect(
            isMatch,
            `Expected filter for ${status} NOT to match payments: ${payments.map(p => p.status).join(', ')}`
          ).toBe(false);
        }
      }
    }

    describe('Single-attempt orders (one payment record in each supported status)', () => {
      it('is strictly bijective for single CAPTURED attempt', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.CAPTURED }],
          PaymentStatus.CAPTURED
        );
      });

      it('is strictly bijective for single REFUNDED attempt', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.REFUNDED }],
          PaymentStatus.REFUNDED
        );
      });

      it('is strictly bijective for single AUTHORIZED attempt', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.AUTHORIZED }],
          PaymentStatus.AUTHORIZED
        );
      });

      it('is strictly bijective for single PENDING attempt', () => {
        assertPaymentFilterBijectivity([{ status: PaymentStatus.PENDING }], PaymentStatus.PENDING);
      });

      it('is strictly bijective for single FAILED attempt', () => {
        assertPaymentFilterBijectivity([{ status: PaymentStatus.FAILED }], PaymentStatus.FAILED);
      });
    });

    describe('Multi-attempt orders (regression tests for mixed statuses)', () => {
      it('is strictly bijective for REFUNDED + AUTHORIZED (displays REFUNDED, matches only REFUNDED filter)', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.REFUNDED }, { status: PaymentStatus.AUTHORIZED }],
          PaymentStatus.REFUNDED
        );
      });

      it('is strictly bijective for REFUNDED + PENDING (displays REFUNDED, matches only REFUNDED filter)', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.REFUNDED }, { status: PaymentStatus.PENDING }],
          PaymentStatus.REFUNDED
        );
      });

      it('is strictly bijective for REFUNDED + FAILED (displays REFUNDED, matches only REFUNDED filter)', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.REFUNDED }, { status: PaymentStatus.FAILED }],
          PaymentStatus.REFUNDED
        );
      });

      it('is strictly bijective for CAPTURED + REFUNDED (displays CAPTURED, matches only CAPTURED filter)', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.CAPTURED }, { status: PaymentStatus.REFUNDED }],
          PaymentStatus.CAPTURED
        );
      });

      it('is strictly bijective for PENDING + FAILED (displays PENDING, matches only PENDING filter)', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.PENDING }, { status: PaymentStatus.FAILED }],
          PaymentStatus.PENDING
        );
      });

      it('is strictly bijective for multiple FAILED attempts', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.FAILED }, { status: PaymentStatus.FAILED }],
          PaymentStatus.FAILED
        );
      });

      it('is strictly bijective for FAILED + CAPTURED (displays CAPTURED, matches only CAPTURED filter)', () => {
        assertPaymentFilterBijectivity(
          [{ status: PaymentStatus.FAILED }, { status: PaymentStatus.CAPTURED }],
          PaymentStatus.CAPTURED
        );
      });
    });

    describe('Zero-payment order behavior', () => {
      it('resolves PENDING as defensive fallback when payments array is empty or null', () => {
        expect(resolveEffectivePaymentStatus([])).toBe(PaymentStatus.PENDING);
        expect(resolveEffectivePaymentStatus(null)).toBe(PaymentStatus.PENDING);
        expect(resolveEffectivePaymentStatus(undefined)).toBe(PaymentStatus.PENDING);
      });

      it('confirms 0-payment orders do not match relation filters (abnormal unsupported state)', () => {
        // In supported application flows, OrderService.createOrderTransaction guarantees
        // an initial PENDING Payment record is created atomically with the Order.
        // Orders with zero payments cannot exist in normal operation; any relation filter
        // requiring `some` payment correctly yields no match.
        for (const status of allPaymentStatuses) {
          const filter = buildPaymentStatusPrismaFilter(status);
          expect(matchesPrismaPaymentFilter([], filter)).toBe(false);
        }
      });
    });

    describe('Prisma relation filter structure checks', () => {
      it('generates CAPTURED filter with some: CAPTURED', () => {
        expect(buildPaymentStatusPrismaFilter(PaymentStatus.CAPTURED)).toEqual({
          some: { status: PaymentStatus.CAPTURED },
        });
      });

      it('generates REFUNDED filter excluding CAPTURED', () => {
        expect(buildPaymentStatusPrismaFilter(PaymentStatus.REFUNDED)).toEqual({
          some: { status: PaymentStatus.REFUNDED },
          none: { status: PaymentStatus.CAPTURED },
        });
      });

      it('generates AUTHORIZED filter excluding CAPTURED and REFUNDED', () => {
        expect(buildPaymentStatusPrismaFilter(PaymentStatus.AUTHORIZED)).toEqual({
          some: { status: PaymentStatus.AUTHORIZED },
          none: { status: { in: [PaymentStatus.CAPTURED, PaymentStatus.REFUNDED] } },
        });
      });

      it('generates PENDING filter excluding CAPTURED, REFUNDED, and AUTHORIZED', () => {
        expect(buildPaymentStatusPrismaFilter(PaymentStatus.PENDING)).toEqual({
          some: { status: PaymentStatus.PENDING },
          none: {
            status: {
              in: [PaymentStatus.CAPTURED, PaymentStatus.REFUNDED, PaymentStatus.AUTHORIZED],
            },
          },
        });
      });

      it('generates FAILED filter excluding CAPTURED, REFUNDED, AUTHORIZED, and PENDING', () => {
        expect(buildPaymentStatusPrismaFilter(PaymentStatus.FAILED)).toEqual({
          some: { status: PaymentStatus.FAILED },
          none: {
            status: {
              in: [
                PaymentStatus.CAPTURED,
                PaymentStatus.REFUNDED,
                PaymentStatus.AUTHORIZED,
                PaymentStatus.PENDING,
              ],
            },
          },
        });
      });
    });
  });

  // ============================================================================
  // 2. VALIDATION UTILITIES
  // ============================================================================
  describe('Admin Order Validation Utilities', () => {
    describe('validateAdminOrderListQuery', () => {
      it('applies sane defaults for empty query', () => {
        const result = validateAdminOrderListQuery({});
        expect(result).toEqual({
          page: 1,
          pageSize: 20,
          search: undefined,
          status: undefined,
          paymentStatus: undefined,
          from: undefined,
          to: undefined,
          sort: 'newest',
        });
      });

      it('parses valid query parameters correctly', () => {
        const result = validateAdminOrderListQuery({
          page: '2',
          pageSize: '10',
          search: '  Priya  ',
          status: 'CONFIRMED',
          paymentStatus: 'CAPTURED',
          from: '2026-10-01T00:00:00.000Z',
          to: '2026-10-10T00:00:00.000Z',
          sort: 'total_desc',
        });

        expect(result.page).toBe(2);
        expect(result.pageSize).toBe(10);
        expect(result.search).toBe('Priya');
        expect(result.status).toBe(OrderStatus.CONFIRMED);
        expect(result.paymentStatus).toBe(PaymentStatus.CAPTURED);
        expect(result.sort).toBe('total_desc');
      });

      it('rejects invalid page or pageSize', () => {
        expect(() => validateAdminOrderListQuery({ page: '0' })).toThrow(ValidationError);
        expect(() => validateAdminOrderListQuery({ page: '-1' })).toThrow(ValidationError);
        expect(() => validateAdminOrderListQuery({ pageSize: '51' })).toThrow(ValidationError);
      });

      it('rejects invalid order status string', () => {
        expect(() => validateAdminOrderListQuery({ status: 'INVALID_STATUS' })).toThrow(
          ValidationError
        );
      });

      it('rejects invalid payment status string', () => {
        expect(() => validateAdminOrderListQuery({ paymentStatus: 'NOT_A_STATUS' })).toThrow(
          ValidationError
        );
      });

      it('rejects invalid date format or from > to', () => {
        expect(() => validateAdminOrderListQuery({ from: 'not-a-date' })).toThrow(ValidationError);
        expect(() =>
          validateAdminOrderListQuery({
            from: '2026-10-15T00:00:00.000Z',
            to: '2026-10-01T00:00:00.000Z',
          })
        ).toThrow(ValidationError);
      });
    });

    describe('validateUpdateOrderStatusInput', () => {
      it('validates PROCESSING transition', () => {
        const result = validateUpdateOrderStatusInput({ status: 'PROCESSING' });
        expect(result.status).toBe(OrderStatus.PROCESSING);
      });

      it('validates SHIPPED transition when courier and tracking are provided', () => {
        const result = validateUpdateOrderStatusInput({
          status: 'SHIPPED',
          trackingNumber: 'TRK-98765',
          courierName: 'Delhivery',
        });
        expect(result.status).toBe(OrderStatus.SHIPPED);
        expect(result.trackingNumber).toBe('TRK-98765');
        expect(result.courierName).toBe('Delhivery');
      });

      it('strictly requires trackingNumber and courierName when transitioning to SHIPPED', () => {
        expect(() => validateUpdateOrderStatusInput({ status: 'SHIPPED' })).toThrow(
          ValidationError
        );
        expect(() =>
          validateUpdateOrderStatusInput({ status: 'SHIPPED', trackingNumber: 'TRK-1' })
        ).toThrow(ValidationError);
        expect(() =>
          validateUpdateOrderStatusInput({ status: 'SHIPPED', courierName: 'Delhivery' })
        ).toThrow(ValidationError);
      });

      it('strictly forbids manual transition to CONFIRMED', () => {
        expect(() => validateUpdateOrderStatusInput({ status: 'CONFIRMED' })).toThrow(
          'Manual transition to CONFIRMED is prohibited.'
        );
      });

      it('strictly forbids transition to PENDING_PAYMENT, PAYMENT_FAILED, or CANCELLED', () => {
        expect(() => validateUpdateOrderStatusInput({ status: 'PENDING_PAYMENT' })).toThrow(
          ValidationError
        );
        expect(() => validateUpdateOrderStatusInput({ status: 'PAYMENT_FAILED' })).toThrow(
          ValidationError
        );
        expect(() => validateUpdateOrderStatusInput({ status: 'CANCELLED' })).toThrow(
          ValidationError
        );
      });
    });
  });

  // ============================================================================
  // 3. SERVICE: getAdminOrders
  // ============================================================================
  describe('OrderService.getAdminOrders', () => {
    it('returns paginated orders with correct metadata and guest badge detection', async () => {
      const order1 = createSampleAdminOrderRecord();
      const guestOrder = createSampleAdminOrderRecord({
        id: 'guest-order-id',
        userId: null,
        user: null,
        orderNumber: 'MAT-GUEST-001',
      });

      mockRepo.findAdminOrders.mockResolvedValue({
        orders: [order1, guestOrder],
        total: 2,
      });

      const response = await service.getAdminOrders({ page: 1, pageSize: 20 });

      expect(response.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 2,
        totalPages: 1,
      });

      expect(response.items).toHaveLength(2);
      expect(response.items[0].isGuest).toBe(false);
      expect(response.items[0].userId).toBe(sampleUserId);
      expect(response.items[0].paymentStatus).toBe(PaymentStatus.CAPTURED);

      expect(response.items[1].isGuest).toBe(true);
      expect(response.items[1].userId).toBeNull();
    });
  });

  // ============================================================================
  // 4. SERVICE: getAdminOrderById
  // ============================================================================
  describe('OrderService.getAdminOrderById', () => {
    it('retrieves complete order snapshot including guest customers without throwing ownership errors', async () => {
      const guestOrder = createSampleAdminOrderRecord({
        userId: null,
        user: null,
      });
      mockRepo.findAdminOrderById.mockResolvedValue(guestOrder);

      const details = await service.getAdminOrderById(sampleOrderId);

      expect(details.id).toBe(sampleOrderId);
      expect(details.customer.isGuest).toBe(true);
      expect(details.customer.registeredName).toBeNull();
      expect(details.customer.email).toBe('priya@example.com');
      expect(details.shippingAddress.city).toBe('Bengaluru');
      expect(details.items[0].productSku).toBe('MND-LOTUS-01');
      expect(details.payments[0].status).toBe(PaymentStatus.CAPTURED);
    });

    it('throws NotFoundError for nonexistent order ID', async () => {
      mockRepo.findAdminOrderById.mockResolvedValue(null);

      await expect(service.getAdminOrderById(sampleOrderId)).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError for malformed UUID parameter', async () => {
      await expect(service.getAdminOrderById('not-a-uuid')).rejects.toThrow(ValidationError);
    });
  });

  // ============================================================================
  // 5. SERVICE: updateOrderStatusByAdmin
  // ============================================================================
  describe('OrderService.updateOrderStatusByAdmin', () => {
    it('allows CONFIRMED -> PROCESSING when payment is captured', async () => {
      const confirmedOrder = createSampleAdminOrderRecord({
        status: OrderStatus.CONFIRMED,
        payments: [{ id: 'p1', status: PaymentStatus.CAPTURED } as any],
      });
      const processingOrder = createSampleAdminOrderRecord({
        status: OrderStatus.PROCESSING,
      });

      mockRepo.findAdminOrderById.mockResolvedValue(confirmedOrder);
      mockRepo.updateOrderStatusConditionally.mockResolvedValue(processingOrder);

      const result = await service.updateOrderStatusByAdmin(sampleOrderId, {
        status: 'PROCESSING',
      });

      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(mockRepo.updateOrderStatusConditionally).toHaveBeenCalledWith(
        sampleOrderId,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        { trackingNumber: undefined, courierName: undefined }
      );
    });

    it('allows PROCESSING -> SHIPPED with courier and tracking details', async () => {
      const processingOrder = createSampleAdminOrderRecord({
        status: OrderStatus.PROCESSING,
        payments: [{ id: 'p1', status: PaymentStatus.CAPTURED } as any],
      });
      const shippedOrder = createSampleAdminOrderRecord({
        status: OrderStatus.SHIPPED,
        courierName: 'Delhivery',
        trackingNumber: 'DEL-123456',
      });

      mockRepo.findAdminOrderById.mockResolvedValue(processingOrder);
      mockRepo.updateOrderStatusConditionally.mockResolvedValue(shippedOrder);

      const result = await service.updateOrderStatusByAdmin(sampleOrderId, {
        status: 'SHIPPED',
        courierName: 'Delhivery',
        trackingNumber: 'DEL-123456',
      });

      expect(result.status).toBe(OrderStatus.SHIPPED);
      expect(result.fulfillment.courierName).toBe('Delhivery');
      expect(result.fulfillment.trackingNumber).toBe('DEL-123456');
    });

    it('allows SHIPPED -> DELIVERED', async () => {
      const shippedOrder = createSampleAdminOrderRecord({
        status: OrderStatus.SHIPPED,
        payments: [{ id: 'p1', status: PaymentStatus.CAPTURED } as any],
      });
      const deliveredOrder = createSampleAdminOrderRecord({
        status: OrderStatus.DELIVERED,
      });

      mockRepo.findAdminOrderById.mockResolvedValue(shippedOrder);
      mockRepo.updateOrderStatusConditionally.mockResolvedValue(deliveredOrder);

      const result = await service.updateOrderStatusByAdmin(sampleOrderId, {
        status: 'DELIVERED',
      });

      expect(result.status).toBe(OrderStatus.DELIVERED);
    });

    it('rejects advancement if order does NOT possess a CAPTURED payment', async () => {
      const unpaidOrder = createSampleAdminOrderRecord({
        status: OrderStatus.PENDING_PAYMENT,
        payments: [{ id: 'p1', status: PaymentStatus.PENDING } as any],
      });
      mockRepo.findAdminOrderById.mockResolvedValue(unpaidOrder);

      await expect(
        service.updateOrderStatusByAdmin(sampleOrderId, { status: 'PROCESSING' })
      ).rejects.toThrow(ConflictError);
    });

    it('rejects illegal status jumps (e.g. CONFIRMED -> DELIVERED or SHIPPED -> PROCESSING)', async () => {
      const confirmedOrder = createSampleAdminOrderRecord({
        status: OrderStatus.CONFIRMED,
        payments: [{ id: 'p1', status: PaymentStatus.CAPTURED } as any],
      });
      mockRepo.findAdminOrderById.mockResolvedValue(confirmedOrder);

      // Attempt jump to DELIVERED
      await expect(
        service.updateOrderStatusByAdmin(sampleOrderId, { status: 'DELIVERED' })
      ).rejects.toThrow(ConflictError);
    });

    it('rejects stale concurrent requests when conditional update returns null', async () => {
      const confirmedOrder = createSampleAdminOrderRecord({
        status: OrderStatus.CONFIRMED,
        payments: [{ id: 'p1', status: PaymentStatus.CAPTURED } as any],
      });
      mockRepo.findAdminOrderById.mockResolvedValue(confirmedOrder);
      // Simulated race condition: another concurrent worker already updated status
      mockRepo.updateOrderStatusConditionally.mockResolvedValue(null);

      await expect(
        service.updateOrderStatusByAdmin(sampleOrderId, { status: 'PROCESSING' })
      ).rejects.toThrow(ConflictError);
    });
  });
});
