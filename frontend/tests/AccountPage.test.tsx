import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AccountPage } from '@/pages/AccountPage';
import * as AuthContextModule from '@/context/AuthContext';
import * as AddressServiceModule from '@/services/address-service';
import type { UserDto } from '@/types';

describe('AccountPage Component', () => {
  const mockUpdateProfile = vi.fn();
  const mockRefreshUser = vi.fn();
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();

  const sampleUser: UserDto = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'priya@example.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    phone: '9876543210',
    role: 'CUSTOMER',
    createdAt: '2026-10-05T12:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUpdateProfile.mockReset();
    vi.spyOn(AddressServiceModule, 'fetchAddresses').mockResolvedValue([]);

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: sampleUser,
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
      updateProfile: mockUpdateProfile,
    });
  });

  it('renders loading state while auth context is loading', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
      updateProfile: mockUpdateProfile,
    });

    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading your account profile/i)).toBeInTheDocument();
  });

  it('redirects anonymous visitor to login page', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
      updateProfile: mockUpdateProfile,
    });

    render(
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/login" element={<div>Login Page Target</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Target')).toBeInTheDocument();
  });

  it('renders patron overview with read-only email, names, role, and order history link', () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Patron Account')).toBeInTheDocument();
    expect(screen.getByText(/priya@example.com/i)).toBeInTheDocument();
    expect(screen.getByText('Patron Member')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Order History/i })).toHaveAttribute(
      'href',
      '/orders'
    );
    expect(screen.getByRole('link', { name: /View Saved Wishlist/i })).toHaveAttribute(
      'href',
      '/wishlist'
    );
    expect(screen.getByDisplayValue('Priya')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sharma')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument();
  });

  it('validates required fields when first or last name are empty', async () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    const firstNameInput = screen.getByLabelText(/First Name/i);
    fireEvent.change(firstNameInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
    });
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('validates phone number format when an invalid number is entered', async () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    const phoneInput = screen.getByLabelText(/Contact Phone/i);
    fireEvent.change(phoneInput, { target: { value: '12345' } });

    const submitBtn = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter a valid 10-digit Indian mobile number/i)
      ).toBeInTheDocument();
    });
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('submits valid profile updates and displays success message', async () => {
    mockUpdateProfile.mockResolvedValue({
      ...sampleUser,
      firstName: 'PriyaUpdated',
      lastName: 'SharmaUpdated',
      phone: '9876543211',
    });

    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    const firstNameInput = screen.getByLabelText(/First Name/i);
    fireEvent.change(firstNameInput, { target: { value: 'PriyaUpdated' } });

    const submitBtn = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'PriyaUpdated',
        lastName: 'Sharma',
        phone: '9876543210',
      });
      expect(screen.getByText(/Your profile has been updated successfully/i)).toBeInTheDocument();
    });
  });

  it('displays error banner when profile update fails', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Network error updating profile'));

    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    const firstNameInput = screen.getByLabelText(/First Name/i);
    fireEvent.change(firstNameInput, { target: { value: 'PriyaUpdated' } });

    const submitBtn = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Network error updating profile/i)).toBeInTheDocument();
    });
  });

  it('reverts form changes when clicking Discard Changes', async () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    const firstNameInput = screen.getByLabelText(/First Name/i);
    fireEvent.change(firstNameInput, { target: { value: 'PriyaEdited' } });

    expect(screen.getByDisplayValue('PriyaEdited')).toBeInTheDocument();

    const discardBtn = screen.getByRole('button', { name: /Discard Changes/i });
    fireEvent.click(discardBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Priya')).toBeInTheDocument();
    });
  });

  it('renders ChangePasswordSection within the authenticated account area', () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Change Password/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument();
  });
});
