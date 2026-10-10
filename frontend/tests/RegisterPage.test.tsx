import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '@/pages/RegisterPage';
import * as AuthContextModule from '@/context/AuthContext';
import type { UserDto } from '@/types';

describe('RegisterPage Component', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();
  const mockRefreshUser = vi.fn();

  const sampleUser: UserDto = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'aarav@example.com',
    firstName: 'Aarav',
    lastName: 'Sharma',
    phone: '9876543210',
    role: 'CUSTOMER',
    createdAt: '2026-10-05T12:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRegister.mockReset();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
    });
  });

  it('renders registration form with all required inputs and action button', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mobile Phone/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Password \(min\. 8 characters with letter & number\)/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register as Patron/i })).toBeInTheDocument();
  });

  it('validates required fields when submitting empty form', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Register as Patron/i }));

    await waitFor(() => {
      expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Please confirm your password/i)).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates password mismatch and password strength', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Aarav Sharma' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'aarav@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/Password \(min\. 8 characters with letter & number\)/i),
      {
        target: { value: 'short' },
      }
    );
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'different' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Register as Patron/i }));

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits valid registration payload and calls register', async () => {
    mockRegister.mockResolvedValue(sampleUser);

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Aarav Sharma' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'aarav@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Mobile Phone/i), {
      target: { value: '9876543210' },
    });
    fireEvent.change(
      screen.getByLabelText(/Password \(min\. 8 characters with letter & number\)/i),
      {
        target: { value: 'Password123' },
      }
    );
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Register as Patron/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Aarav Sharma',
        email: 'aarav@example.com',
        phone: '9876543210',
        password: 'Password123',
      });
    });
  });

  it('renders error alert when registration returns 409 conflict', async () => {
    mockRegister.mockRejectedValue(new Error('An account with this email address already exists.'));

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Aarav Sharma' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'aarav@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/Password \(min\. 8 characters with letter & number\)/i),
      {
        target: { value: 'Password123' },
      }
    );
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Register as Patron/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'An account with this email address already exists.'
      );
    });
  });
});
