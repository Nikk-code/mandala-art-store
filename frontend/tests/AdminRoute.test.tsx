import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from '@/components/admin';
import * as AuthContextModule from '@/context/AuthContext';
import type { UserDto } from '@/types';

describe('AdminRoute Guard', () => {
  const adminUser: UserDto = {
    id: 'admin-uuid-1',
    email: 'admin@mandala.test',
    firstName: 'Meera',
    lastName: 'Deshmukh',
    role: 'ADMIN',
    createdAt: '2026-10-01T00:00:00.000Z',
  };

  const customerUser: UserDto = {
    id: 'customer-uuid-1',
    email: 'customer@mandala.test',
    firstName: 'Rohan',
    lastName: 'Verma',
    role: 'CUSTOMER',
    createdAt: '2026-10-05T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function renderWithRouter(initialEntry = '/admin') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div data-testid="admin-content">Secret Admin Dashboard</div>
              </AdminRoute>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/" element={<div data-testid="home-page">Storefront Home</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders loading state when authentication status is resolving', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...AuthContextModule.defaultAuthContextValue,
      isLoading: true,
    });

    renderWithRouter();

    expect(screen.getByText(/Verifying administrator credentials/i)).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated visitor to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...AuthContextModule.defaultAuthContextValue,
      isLoading: false,
      isAuthenticated: false,
      user: null,
    });

    renderWithRouter();

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('denies access with HTTP 403 Forbidden when authenticated as CUSTOMER', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...AuthContextModule.defaultAuthContextValue,
      isLoading: false,
      isAuthenticated: true,
      user: customerUser,
    });

    renderWithRouter();

    expect(screen.getByText(/Administrator Access Required/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTP 403 • Forbidden/i)).toBeInTheDocument();
    expect(screen.getByText(/customer@mandala.test/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Storefront/i })).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('grants access and renders admin layout and content for verified ADMIN', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...AuthContextModule.defaultAuthContextValue,
      isLoading: false,
      isAuthenticated: true,
      user: adminUser,
    });

    renderWithRouter();

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.getByText(/Mandala Studio/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Meera Deshmukh/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Storefront/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
  });
});
