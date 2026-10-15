import { PaymentStatus, type Prisma } from '@prisma/client';

/**
 * Authoritative business rule for resolving effective payment status across multiple payment attempts:
 * 1. If ANY payment record has status === CAPTURED, the order is successfully paid -> CAPTURED.
 * 2. If ANY payment record has status === REFUNDED (and none is captured), -> REFUNDED.
 * 3. If ANY payment record has status === AUTHORIZED (and none is captured/refunded), -> AUTHORIZED.
 * 4. If ANY payment record has status === PENDING (and none is captured/refunded/authorized), -> PENDING.
 * 5. If all payment records are FAILED (and none is captured/refunded/authorized/pending), -> FAILED.
 * 6. Zero-payment records: In supported ecommerce checkout flows (OrderService.createOrderTransaction),
 *    every order is atomically created with an initial PENDING payment record. An order with zero payment
 *    records cannot exist in normal operation; resolveEffectivePaymentStatus defaults to PENDING solely
 *    as a defensive fallback for abnormal or corrupted records without expanding the API contract.
 */
export function resolveEffectivePaymentStatus(
  payments?: Array<{ status: PaymentStatus }> | null
): PaymentStatus {
  if (!payments || payments.length === 0) {
    return PaymentStatus.PENDING;
  }
  if (payments.some(p => p.status === PaymentStatus.CAPTURED)) {
    return PaymentStatus.CAPTURED;
  }
  if (payments.some(p => p.status === PaymentStatus.REFUNDED)) {
    return PaymentStatus.REFUNDED;
  }
  if (payments.some(p => p.status === PaymentStatus.AUTHORIZED)) {
    return PaymentStatus.AUTHORIZED;
  }
  if (payments.some(p => p.status === PaymentStatus.PENDING)) {
    return PaymentStatus.PENDING;
  }
  if (payments.some(p => p.status === PaymentStatus.FAILED)) {
    return PaymentStatus.FAILED;
  }
  return PaymentStatus.PENDING;
}

/**
 * Builds a Prisma relation filter for Order.payments that is 100% bijective with resolveEffectivePaymentStatus:
 * - CAPTURED: An order matches if it has at least one CAPTURED payment.
 * - REFUNDED: Has a REFUNDED payment and no CAPTURED payment.
 * - AUTHORIZED: Has an AUTHORIZED payment and no CAPTURED or REFUNDED payment.
 * - PENDING: Has a PENDING payment and no CAPTURED, REFUNDED, or AUTHORIZED payment.
 * - FAILED: Has a FAILED payment and no CAPTURED, REFUNDED, AUTHORIZED, or PENDING payment.
 */
export function buildPaymentStatusPrismaFilter(
  status: PaymentStatus
): Prisma.PaymentListRelationFilter {
  switch (status) {
    case PaymentStatus.CAPTURED:
      return {
        some: { status: PaymentStatus.CAPTURED },
      };
    case PaymentStatus.REFUNDED:
      return {
        some: { status: PaymentStatus.REFUNDED },
        none: { status: PaymentStatus.CAPTURED },
      };
    case PaymentStatus.AUTHORIZED:
      return {
        some: { status: PaymentStatus.AUTHORIZED },
        none: { status: { in: [PaymentStatus.CAPTURED, PaymentStatus.REFUNDED] } },
      };
    case PaymentStatus.PENDING:
      return {
        some: { status: PaymentStatus.PENDING },
        none: {
          status: {
            in: [PaymentStatus.CAPTURED, PaymentStatus.REFUNDED, PaymentStatus.AUTHORIZED],
          },
        },
      };
    case PaymentStatus.FAILED:
      return {
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
      };
    default:
      return {};
  }
}
