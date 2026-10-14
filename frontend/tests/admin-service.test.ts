import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAdminDashboard } from '@/services/admin-service';
import * as apiClient from '@/services/api-client';
import type { AdminDashboardResponseData } from '@/types';

describe('Admin Service (fetchAdminDashboard)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls GET /api/admin/dashboard and returns payload data', async () => {
    const mockData: AdminDashboardResponseData = {
      admin: {
        id: 'admin-uuid-1',
        email: 'admin@mandala.test',
        firstName: 'Meera',
        lastName: 'Deshmukh',
        role: 'ADMIN',
      },
      system: {
        environment: 'test',
        serverTime: '2026-10-14T10:00:00.000Z',
        version: '0.1.0',
      },
      modules: [
        {
          id: 'catalog',
          name: 'Art Catalog Management',
          description: 'Catalog management tools',
          status: 'PLANNED',
          path: '/admin/products',
        },
      ],
    };

    const apiGetSpy = vi.spyOn(apiClient, 'apiGet').mockResolvedValue({
      success: true,
      data: mockData,
    });

    const result = await fetchAdminDashboard();

    expect(apiGetSpy).toHaveBeenCalledWith('admin/dashboard');
    expect(result).toEqual(mockData);
    expect(result.admin.role).toBe('ADMIN');
  });

  it('propagates error when apiGet fails', async () => {
    vi.spyOn(apiClient, 'apiGet').mockRejectedValue(new Error('Forbidden: Admin access required'));

    await expect(fetchAdminDashboard()).rejects.toThrow('Forbidden: Admin access required');
  });
});
