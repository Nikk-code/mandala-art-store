import { useState, type ReactNode, type FormEvent } from 'react';
import { Section, Input, Button } from '@/components/ui';
import { changeUserPassword } from '@/services/auth-service';
import { ApiError } from '@/services/api-client';

interface PasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function ChangePasswordSection(): ReactNode {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<PasswordFormErrors>({});
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const nextErrors: PasswordFormErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = 'Current password is required.';
    }

    if (!newPassword) {
      nextErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'New password must be at least 8 characters long.';
    } else if (newPassword.length > 128) {
      nextErrors.newPassword = 'New password must not exceed 128 characters.';
    } else if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      nextErrors.newPassword = 'New password must contain at least one letter and one number.';
    } else if (currentPassword && newPassword === currentPassword) {
      nextErrors.newPassword = 'New password cannot be the same as your current password.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password.';
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setStatusMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await changeUserPassword({
        currentPassword,
        newPassword,
      });

      setStatusMessage({
        type: 'success',
        text: response.message || 'Password changed successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setStatusMessage({
            type: 'error',
            text: err.message || 'Too many password change attempts. Please try again later.',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: err.message,
          });
          if (err.message.includes('Current password')) {
            setErrors(prev => ({ ...prev, currentPassword: err.message }));
          } else if (err.message.includes('same as your current password')) {
            setErrors(prev => ({ ...prev, newPassword: err.message }));
          }
        }
      } else {
        const fallback =
          err instanceof Error
            ? err.message
            : 'Unable to change password. Please check your network and try again.';
        setStatusMessage({
          type: 'error',
          text: fallback,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section className="rounded-2xl border border-art-stone bg-white p-6 sm:p-8 shadow-sm">
      <div className="mb-6 border-b border-art-stone/60 pb-4">
        <h2 className="font-serif text-xl font-bold text-art-charcoal">Change Password</h2>
        <p className="mt-1 text-xs text-stone-500">
          Ensure your patron account is guarded with a strong, distinct security key.
        </p>
      </div>

      {statusMessage && (
        <div
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          className={`mb-6 rounded-xl p-4 text-xs font-medium flex items-start gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <svg
              className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-rose-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          id="account-current-password"
          label="Current Password"
          type={showCurrentPassword ? 'text' : 'password'}
          required
          value={currentPassword}
          disabled={isSubmitting}
          autoComplete="current-password"
          placeholder="••••••••"
          onChange={e => {
            setCurrentPassword(e.target.value);
            if (errors.currentPassword) {
              setErrors(prev => ({ ...prev, currentPassword: undefined }));
            }
            if (statusMessage) setStatusMessage(null);
          }}
          error={errors.currentPassword}
          endAdornment={
            <button
              type="button"
              aria-label={showCurrentPassword ? 'Hide' : 'Show'}
              title={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              disabled={isSubmitting}
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="text-stone-400 hover:text-art-charcoal p-1 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre text-xs font-medium"
            >
              {showCurrentPassword ? 'Hide' : 'Show'}
            </button>
          }
        />

        <Input
          id="account-new-password"
          label="New Password"
          type={showNewPassword ? 'text' : 'password'}
          required
          value={newPassword}
          disabled={isSubmitting}
          autoComplete="new-password"
          placeholder="••••••••"
          helperText="Must be 8–128 characters with at least one letter and one number."
          onChange={e => {
            setNewPassword(e.target.value);
            if (errors.newPassword) {
              setErrors(prev => ({ ...prev, newPassword: undefined }));
            }
            if (statusMessage) setStatusMessage(null);
          }}
          error={errors.newPassword}
          endAdornment={
            <button
              type="button"
              aria-label={showNewPassword ? 'Hide' : 'Show'}
              title={showNewPassword ? 'Hide new password' : 'Show new password'}
              disabled={isSubmitting}
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="text-stone-400 hover:text-art-charcoal p-1 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre text-xs font-medium"
            >
              {showNewPassword ? 'Hide' : 'Show'}
            </button>
          }
        />

        <Input
          id="account-confirm-password"
          label="Confirm New Password"
          type={showConfirmPassword ? 'text' : 'password'}
          required
          value={confirmPassword}
          disabled={isSubmitting}
          autoComplete="new-password"
          placeholder="••••••••"
          onChange={e => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) {
              setErrors(prev => ({ ...prev, confirmPassword: undefined }));
            }
            if (statusMessage) setStatusMessage(null);
          }}
          error={errors.confirmPassword}
          endAdornment={
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Hide' : 'Show'}
              title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              disabled={isSubmitting}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-stone-400 hover:text-art-charcoal p-1 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre text-xs font-medium"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          }
        />

        <div className="pt-4 border-t border-art-stone/60 flex items-center justify-end gap-3">
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Updating Password...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </Section>
  );
}
