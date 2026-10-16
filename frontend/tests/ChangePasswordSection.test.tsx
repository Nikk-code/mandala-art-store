import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePasswordSection } from '@/components/account/ChangePasswordSection';
import * as AuthServiceModule from '@/services/auth-service';
import { ApiError } from '@/services/api-client';

describe('ChangePasswordSection Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders section title, subtitle, all 3 password inputs, and update button', () => {
    render(<ChangePasswordSection />);

    expect(screen.getByRole('heading', { name: /Change Password/i, level: 2 })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Ensure your patron account is guarded with a strong, distinct security key/i
      )
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument();
  });

  it('ensures all three fields are accessible and correctly labelled', () => {
    render(<ChangePasswordSection />);

    const currentInput = screen.getByLabelText(/Current Password/i);
    const newInput = screen.getByLabelText(/^New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm New Password/i);

    expect(currentInput).toHaveAttribute('type', 'password');
    expect(newInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');

    expect(currentInput).toHaveAttribute('id', 'account-current-password');
    expect(newInput).toHaveAttribute('id', 'account-new-password');
    expect(confirmInput).toHaveAttribute('id', 'account-confirm-password');
  });

  it('toggles password visibility when clicking Show/Hide button', () => {
    render(<ChangePasswordSection />);

    const currentInput = screen.getByLabelText(/Current Password/i);
    const showCurrentBtn = screen.getAllByRole('button', { name: 'Show' })[0];

    expect(currentInput).toHaveAttribute('type', 'password');
    fireEvent.click(showCurrentBtn);

    expect(currentInput).toHaveAttribute('type', 'text');
    const hideCurrentBtn = screen.getAllByRole('button', { name: 'Hide' })[0];
    fireEvent.click(hideCurrentBtn);
    expect(currentInput).toHaveAttribute('type', 'password');
  });

  it('validates required fields when submitted empty', async () => {
    const serviceSpy = vi.spyOn(AuthServiceModule, 'changeUserPassword');
    render(<ChangePasswordSection />);

    const submitBtn = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Current password is required.')).toBeInTheDocument();
      expect(screen.getByText('New password is required.')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your new password.')).toBeInTheDocument();
    });

    expect(serviceSpy).not.toHaveBeenCalled();
  });

  it('validates new password format: minimum length, maximum length, letters, and numbers', async () => {
    const serviceSpy = vi.spyOn(AuthServiceModule, 'changeUserPassword');
    render(<ChangePasswordSection />);

    const currentInput = screen.getByLabelText(/Current Password/i);
    const newInput = screen.getByLabelText(/^New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm New Password/i);
    const submitBtn = screen.getByRole('button', { name: /Update Password/i });

    // 1. Shorter than 8 chars
    fireEvent.change(currentInput, { target: { value: 'ValidCurrent1' } });
    fireEvent.change(newInput, { target: { value: 'short1' } });
    fireEvent.change(confirmInput, { target: { value: 'short1' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('New password must be at least 8 characters long.')
      ).toBeInTheDocument();
    });
    expect(serviceSpy).not.toHaveBeenCalled();

    // 2. Longer than 128 chars
    const tooLong = 'A'.repeat(128) + '1';
    fireEvent.change(newInput, { target: { value: tooLong } });
    fireEvent.change(confirmInput, { target: { value: tooLong } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('New password must not exceed 128 characters.')).toBeInTheDocument();
    });
    expect(serviceSpy).not.toHaveBeenCalled();

    // 3. Missing numbers
    fireEvent.change(newInput, { target: { value: 'OnlyLettersPassword' } });
    fireEvent.change(confirmInput, { target: { value: 'OnlyLettersPassword' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('New password must contain at least one letter and one number.')
      ).toBeInTheDocument();
    });
    expect(serviceSpy).not.toHaveBeenCalled();

    // 4. Missing letters
    fireEvent.change(newInput, { target: { value: '1234567890' } });
    fireEvent.change(confirmInput, { target: { value: '1234567890' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('New password must contain at least one letter and one number.')
      ).toBeInTheDocument();
    });
    expect(serviceSpy).not.toHaveBeenCalled();
  });

  it('rejects confirmation mismatch without making an API request', async () => {
    const serviceSpy = vi.spyOn(AuthServiceModule, 'changeUserPassword');
    render(<ChangePasswordSection />);

    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: 'ValidCurrent1' },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: 'ValidNewPass1' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: 'MismatchedPass2' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    expect(serviceSpy).not.toHaveBeenCalled();
  });

  it('rejects identical current and new password client-side without making an API request', async () => {
    const serviceSpy = vi.spyOn(AuthServiceModule, 'changeUserPassword');
    render(<ChangePasswordSection />);

    const samePassword = 'IdenticalPassword123';
    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: samePassword },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: samePassword },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: samePassword },
    });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(
        screen.getByText('New password cannot be the same as your current password.')
      ).toBeInTheDocument();
    });

    expect(serviceSpy).not.toHaveBeenCalled();
  });

  it('calls changeUserPassword service with expected fields on valid submit', async () => {
    const serviceSpy = vi.spyOn(AuthServiceModule, 'changeUserPassword').mockResolvedValue({
      success: true,
      message: 'Password changed successfully.',
    });

    render(<ChangePasswordSection />);

    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: 'OldPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: 'NewPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: 'NewPassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(serviceSpy).toHaveBeenCalledWith({
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
      });
    });
  });

  it('clears password fields and displays success message upon confirmation', async () => {
    vi.spyOn(AuthServiceModule, 'changeUserPassword').mockResolvedValue({
      success: true,
      message: 'Password changed successfully.',
    });

    render(<ChangePasswordSection />);

    const currentInput = screen.getByLabelText(/Current Password/i);
    const newInput = screen.getByLabelText(/^New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm New Password/i);

    fireEvent.change(currentInput, { target: { value: 'OldPassword123' } });
    fireEvent.change(newInput, { target: { value: 'NewPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'NewPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Password changed successfully.');
      expect(currentInput).toHaveValue('');
      expect(newInput).toHaveValue('');
      expect(confirmInput).toHaveValue('');
    });
  });

  it('displays useful error message when current password is incorrect (400)', async () => {
    vi.spyOn(AuthServiceModule, 'changeUserPassword').mockRejectedValue(
      new ApiError('Current password is incorrect.', 400, 'BAD_REQUEST')
    );

    render(<ChangePasswordSection />);

    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: 'WrongPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: 'NewPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: 'NewPassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      expect(alerts[0]).toHaveTextContent('Current password is incorrect.');
    });
  });

  it('displays rate-limit notification when HTTP 429 is encountered', async () => {
    vi.spyOn(AuthServiceModule, 'changeUserPassword').mockRejectedValue(
      new ApiError(
        'Too many password change attempts. Please try again later.',
        429,
        'RATE_LIMITED'
      )
    );

    render(<ChangePasswordSection />);

    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: 'OldPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: 'NewPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: 'NewPassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Too many password change attempts. Please try again later.'
      );
    });
  });

  it('handles unexpected server/API errors gracefully without crashing', async () => {
    vi.spyOn(AuthServiceModule, 'changeUserPassword').mockRejectedValue(
      new Error('Network error: connection lost')
    );

    render(<ChangePasswordSection />);

    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: 'OldPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: 'NewPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: 'NewPassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error: connection lost');
    });
  });

  it('prevents duplicate submissions while request is in progress', async () => {
    let resolvePromise: (value: { success: boolean; message: string }) => void;
    const promise = new Promise<{ success: boolean; message: string }>(resolve => {
      resolvePromise = resolve;
    });

    const serviceSpy = vi.spyOn(AuthServiceModule, 'changeUserPassword').mockReturnValue(promise);

    render(<ChangePasswordSection />);

    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: 'OldPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: 'NewPassword123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: 'NewPassword123' },
    });

    const submitBtn = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(submitBtn);

    // Verify loading state
    expect(screen.getByRole('button', { name: /Updating Password/i })).toBeDisabled();

    // Click again while submitting
    fireEvent.click(submitBtn);
    expect(serviceSpy).toHaveBeenCalledTimes(1);

    // Complete the request
    resolvePromise!({ success: true, message: 'Password changed successfully.' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Password/i })).not.toBeDisabled();
    });
  });
});
