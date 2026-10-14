import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import * as adminService from '@/services/admin-service';
import type { AdminDashboardResponseData } from '@/types';

describe('AdminDashboardPage', () => {
  const mockDashboardData: AdminDashboardResponseData = {
    admin: {
      id: 'admin-uuid-1',
      email: 'meera@mandala.test',
      firstName: 'Meera',
      lastName: 'Deshmukh',
      role: 'ADMIN',
    },
    system: {
      environment: 'development',
      serverTime: '2026-10-14T08:00:00.000Z',
      version: '0.1.0',
    },
    modules: [
      {
        id: 'catalog',
        name: 'Art Catalog Management',
        description: 'Create, edit, and organize sacred mandala artworks and Lippan art.',
        status: 'PLANNED',
        path: '/admin/products',
      },
      {
        id: 'orders',
        name: 'Order Fulfillment & Logistics',
        description: 'Inspect customer orders and update shipping statuses.',
        status: 'PLANNED',
        path: '/admin/orders',
      },
      {
        id: 'customers',
        name: 'Customer Accounts & Patronage',
        description: 'Review registered art patrons and purchase history.',
        status: 'PLANNED',
        path: '/admin/customers',
      },
      {
        id: 'reviews',
        name: 'Reviews & Feedback Moderation',
        description: 'Moderate artwork testimonials and verified buyer ratings.',
        status: 'PLANNED',
        path: '/admin/reviews',
      },
      {
        id: 'inventory',
        name: 'Inventory & Stock Allocation',
        description: 'Manage artwork stock quantities and reservation tracking.',
        status: 'PLANNED',
        path: '/admin/inventory',
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading spinner while retrieving administrative metadata', () => {
    vi.spyOn(adminService, 'fetchAdminDashboard').mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading administrative dashboard/i)).toBeInTheDocument();
  });

  it('renders admin identity and system metadata upon successful fetch', async () => {
    vi.spyOn(adminService, 'fetchAdminDashboard').mockResolvedValue(mockDashboardData);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Meera/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Verified ADMIN/i)).toBeInTheDocument();
    expect(screen.getByText(/meera@mandala.test/i)).toBeInTheDocument();
    expect(screen.getByText(/development/i)).toBeInTheDocument();
    expect(screen.getByText(/v0.1.0/i)).toBeInTheDocument();
  });

  it('renders all planned operational module cards with descriptions', async () => {
    vi.spyOn(adminService, 'fetchAdminDashboard').mockResolvedValue(mockDashboardData);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Art Catalog Management/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Order Fulfillment & Logistics/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer Accounts & Patronage/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviews & Feedback Moderation/i)).toBeInTheDocument();
    expect(screen.getByText(/Inventory & Stock Allocation/i)).toBeInTheDocument();

    const plannedBadges = screen.getAllByText(/Planned/i);
    expect(plannedBadges.length).toBeGreaterThanOrEqual(5);
  });

  it('renders error state and retries fetch when onRetry is clicked', async () => {
    const fetchSpy = vi
      .spyOn(adminService, 'fetchAdminDashboard')
      .mockRejectedValueOnce(new Error('Network error loading dashboard'))
      .mockResolvedValueOnce(mockDashboardData);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Administrative Dashboard Unavailable/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Network error loading dashboard/i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Meera/i)).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
