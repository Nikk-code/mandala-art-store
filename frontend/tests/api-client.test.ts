import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiGet, fetchHealth, ApiError } from '@/services/api-client';

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
});
