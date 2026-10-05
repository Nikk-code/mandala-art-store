import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiGet, apiPost, fetchHealth, ApiError } from '@/services/api-client';

describe('Frontend API Client Foundation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches JSON successfully with apiGet', async () => {
    const mockData = { id: 'test-1', name: 'Mandala Art' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    const result = await apiGet<{ id: string; name: string }>('catalog/products');
    expect(result).toEqual(mockData);
  });

  it('throws ApiError with status and error message on HTTP error', async () => {
    const errorBody = {
      success: false,
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found in catalog',
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorBody),
      })
    );

    await expect(apiGet('catalog/products/invalid')).rejects.toThrow(
      'Product not found in catalog'
    );

    try {
      await apiGet('catalog/products/invalid');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.code).toBe('PRODUCT_NOT_FOUND');
    }
  });

  it('calls health endpoint with fetchHealth', async () => {
    const mockHealth = {
      status: 'ok',
      timestamp: '2026-10-04T00:00:00.000Z',
      uptime: 100,
      environment: 'test',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealth),
      })
    );

    const health = await fetchHealth();
    expect(health.status).toBe('ok');
    expect(health.environment).toBe('test');
  });

  it('sends POST requests with apiPost and returns typed data', async () => {
    const mockResponse = {
      success: true,
      data: {
        order: {
          id: 'order-1',
          orderNumber: 'MAT-20261005-A1B2C3',
          total: 149900,
        },
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    vi.stubGlobal('fetch', fetchMock);

    const payload = {
      customer: { fullName: 'Priya', email: 'priya@example.com', phone: '9876543210' },
      shippingAddress: {
        addressLine1: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
      items: [{ productId: 'prod-1', quantity: 1 }],
    };

    const result = await apiPost<typeof mockResponse>('checkout/orders', payload, {
      headers: { 'Idempotency-Key': 'key-123' },
    });

    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/checkout/orders'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': 'key-123',
        }),
        body: JSON.stringify(payload),
      })
    );
  });
});
