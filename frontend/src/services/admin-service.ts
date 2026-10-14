import { apiGet } from './api-client';
import type { AdminDashboardResponseData } from '@/types';

/**
 * Fetches administrator dashboard metadata and authenticated admin identity.
 * Protected by requireAuth and requireAdmin on the backend.
 */
export async function fetchAdminDashboard(): Promise<AdminDashboardResponseData> {
  const response = await apiGet<{ success: boolean; data: AdminDashboardResponseData }>(
    'admin/dashboard'
  );
  return response.data;
}
