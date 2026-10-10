import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context';
import * as authService from '@/services/auth-service';
import type { UserDto } from '@/types';

function TestConsumer() {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();

  if (isLoading) {
    return <div data-testid="loading">Loading Auth...</div>;
  }

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Anonymous'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button
        onClick={() => login({ email: 'priya@example.com', password: 'Password123' })}
        data-testid="login-btn"
      >
        Login
      </button>
      <button
        onClick={() =>
          register({
            name: 'Priya Sharma',
            email: 'priya@example.com',
            password: 'Password123',
          })
        }
        data-testid="register-btn"
      >
        Register
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
}

describe('AuthProvider & useAuth Context', () => {
  const sampleUser: UserDto = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'priya@example.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'CUSTOMER',
    createdAt: '2026-10-05T12:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('restores customer session on mount when valid session exists', async () => {
    vi.spyOn(authService, 'fetchCurrentUser').mockResolvedValue(sampleUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('priya@example.com');
    });
  });

  it('remains anonymous on mount when no session exists (401 response)', async () => {
    vi.spyOn(authService, 'fetchCurrentUser').mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Anonymous');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
  });

  it('authenticates user and updates state upon successful login', async () => {
    vi.spyOn(authService, 'fetchCurrentUser').mockRejectedValue(new Error('Unauthorized'));
    vi.spyOn(authService, 'loginUser').mockResolvedValue(sampleUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Anonymous');
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('priya@example.com');
    });
  });

  it('authenticates user and updates state upon successful registration', async () => {
    vi.spyOn(authService, 'fetchCurrentUser').mockRejectedValue(new Error('Unauthorized'));
    vi.spyOn(authService, 'registerUser').mockResolvedValue(sampleUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Anonymous');
    });

    await act(async () => {
      screen.getByTestId('register-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('priya@example.com');
    });
  });

  it('clears user session upon logout', async () => {
    vi.spyOn(authService, 'fetchCurrentUser').mockResolvedValue(sampleUser);
    vi.spyOn(authService, 'logoutUser').mockResolvedValue();

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Anonymous');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
  });
});
