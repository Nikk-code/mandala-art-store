import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ValidationError } from '../errors';
import type { AdminOrderListQuery, UpdateAdminOrderStatusInput } from '../types/admin';

const VALID_SORT_OPTIONS = new Set(['newest', 'oldest', 'total_desc', 'total_asc']);

/**
 * Validates and sanitizes query parameters for the admin order listing endpoint.
 */
export function validateAdminOrderListQuery(
  rawQuery: Record<string, unknown>
): AdminOrderListQuery {
  // Page Validation
  let page = 1;
  if (rawQuery.page !== undefined && rawQuery.page !== null && rawQuery.page !== '') {
    const parsedPage = Number(rawQuery.page);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new ValidationError(
        'Query parameter "page" must be an integer greater than or equal to 1.'
      );
    }
    page = parsedPage;
  }

  // PageSize Validation
  let pageSize = 20;
  if (rawQuery.pageSize !== undefined && rawQuery.pageSize !== null && rawQuery.pageSize !== '') {
    const parsedPageSize = Number(rawQuery.pageSize);
    if (!Number.isInteger(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 50) {
      throw new ValidationError('Query parameter "pageSize" must be an integer between 1 and 50.');
    }
    pageSize = parsedPageSize;
  }

  // Search Validation
  let search: string | undefined;
  if (typeof rawQuery.search === 'string') {
    const trimmed = rawQuery.search.trim();
    if (trimmed.length > 100) {
      throw new ValidationError('Search query must not exceed 100 characters.');
    }
    if (trimmed.length > 0) {
      search = trimmed;
    }
  }

  // Order Status Validation
  let status: OrderStatus | undefined;
  if (rawQuery.status !== undefined && rawQuery.status !== null && rawQuery.status !== '') {
    if (
      typeof rawQuery.status !== 'string' ||
      !Object.values(OrderStatus).includes(rawQuery.status as OrderStatus)
    ) {
      throw new ValidationError(
        `Invalid status filter. Allowed values: ${Object.values(OrderStatus).join(', ')}`
      );
    }
    status = rawQuery.status as OrderStatus;
  }

  // Payment Status Validation
  let paymentStatus: PaymentStatus | undefined;
  if (
    rawQuery.paymentStatus !== undefined &&
    rawQuery.paymentStatus !== null &&
    rawQuery.paymentStatus !== ''
  ) {
    if (
      typeof rawQuery.paymentStatus !== 'string' ||
      !Object.values(PaymentStatus).includes(rawQuery.paymentStatus as PaymentStatus)
    ) {
      throw new ValidationError(
        `Invalid paymentStatus filter. Allowed values: ${Object.values(PaymentStatus).join(', ')}`
      );
    }
    paymentStatus = rawQuery.paymentStatus as PaymentStatus;
  }

  // Date Range Validation (from, to)
  let from: string | undefined;
  if (rawQuery.from !== undefined && rawQuery.from !== null && rawQuery.from !== '') {
    if (typeof rawQuery.from !== 'string' || isNaN(Date.parse(rawQuery.from))) {
      throw new ValidationError('Query parameter "from" must be a valid ISO date string.');
    }
    from = new Date(rawQuery.from).toISOString();
  }

  let to: string | undefined;
  if (rawQuery.to !== undefined && rawQuery.to !== null && rawQuery.to !== '') {
    if (typeof rawQuery.to !== 'string' || isNaN(Date.parse(rawQuery.to))) {
      throw new ValidationError('Query parameter "to" must be a valid ISO date string.');
    }
    to = new Date(rawQuery.to).toISOString();
  }

  if (from && to && new Date(from) > new Date(to)) {
    throw new ValidationError('"from" date must be earlier than or equal to "to" date.');
  }

  // Sort Order Validation
  let sort: AdminOrderListQuery['sort'] = 'newest';
  if (rawQuery.sort !== undefined && rawQuery.sort !== null && rawQuery.sort !== '') {
    if (typeof rawQuery.sort !== 'string' || !VALID_SORT_OPTIONS.has(rawQuery.sort)) {
      throw new ValidationError(
        `Invalid sort option. Allowed values: ${Array.from(VALID_SORT_OPTIONS).join(', ')}`
      );
    }
    sort = rawQuery.sort as AdminOrderListQuery['sort'];
  }

  return {
    page,
    pageSize,
    search,
    status,
    paymentStatus,
    from,
    to,
    sort,
  };
}

/**
 * Validates administrative order status update requests.
 * Only allows forward fulfillment transitions (PROCESSING, SHIPPED, DELIVERED).
 * Strictly forbids manual CONFIRMED transitions or terminal state modifications.
 */
export function validateUpdateOrderStatusInput(body: unknown): UpdateAdminOrderStatusInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const payload = body as Record<string, unknown>;

  if (!payload.status || typeof payload.status !== 'string') {
    throw new ValidationError('Target status is required.');
  }

  const rawStatus = payload.status.trim().toUpperCase();

  // Explicit safety checks
  if (rawStatus === OrderStatus.CONFIRMED) {
    throw new ValidationError(
      'Manual transition to CONFIRMED is prohibited. Orders are confirmed only via verified payment.'
    );
  }

  if (rawStatus === OrderStatus.PENDING_PAYMENT || rawStatus === OrderStatus.PAYMENT_FAILED) {
    throw new ValidationError(
      'Cannot manually transition order to a pending or failed payment status.'
    );
  }

  if (rawStatus === OrderStatus.CANCELLED) {
    throw new ValidationError('Order cancellation is not supported in this fulfillment workflow.');
  }

  if (
    rawStatus !== OrderStatus.PROCESSING &&
    rawStatus !== OrderStatus.SHIPPED &&
    rawStatus !== OrderStatus.DELIVERED
  ) {
    throw new ValidationError(
      `Unsupported target status "${rawStatus}". Permitted fulfillment transitions: PROCESSING, SHIPPED, DELIVERED.`
    );
  }

  const targetStatus = rawStatus as OrderStatus;

  // Tracking and Courier validation
  let trackingNumber: string | undefined;
  if (payload.trackingNumber !== undefined && payload.trackingNumber !== null) {
    if (typeof payload.trackingNumber !== 'string') {
      throw new ValidationError('trackingNumber must be a string.');
    }
    const trimmed = payload.trackingNumber.trim();
    if (trimmed.length > 100) {
      throw new ValidationError('trackingNumber must not exceed 100 characters.');
    }
    if (trimmed.length > 0) {
      trackingNumber = trimmed;
    }
  }

  let courierName: string | undefined;
  if (payload.courierName !== undefined && payload.courierName !== null) {
    if (typeof payload.courierName !== 'string') {
      throw new ValidationError('courierName must be a string.');
    }
    const trimmed = payload.courierName.trim();
    if (trimmed.length > 100) {
      throw new ValidationError('courierName must not exceed 100 characters.');
    }
    if (trimmed.length > 0) {
      courierName = trimmed;
    }
  }

  // When transitioning to SHIPPED, courierName and trackingNumber are mandatory
  if (targetStatus === OrderStatus.SHIPPED) {
    if (!trackingNumber) {
      throw new ValidationError(
        'Tracking number is mandatory when transitioning order status to SHIPPED.'
      );
    }
    if (!courierName) {
      throw new ValidationError(
        'Courier name is mandatory when transitioning order status to SHIPPED.'
      );
    }
  }

  return {
    status: targetStatus,
    trackingNumber,
    courierName,
  };
}
