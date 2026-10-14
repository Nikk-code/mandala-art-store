import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Container, Section, Badge, Input, Button, LoadingState } from '@/components/ui';
import { SavedAddressesSection } from '@/components/account';
import { useAuth } from '@/context';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export function AccountPage(): ReactNode {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize form state with loaded user profile
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (isLoading) {
    return (
      <Container className="py-16">
        <LoadingState message="Loading your account profile..." />
      </Container>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login?redirect=/account" replace />;
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters.';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }

    if (phone.trim()) {
      const cleanPhone = phone.trim().replace(/[\s\-()+]/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid 10-digit Indian mobile number.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setStatusMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() ? phone.trim() : null,
      });

      setStatusMessage({
        type: 'success',
        text: 'Your profile has been updated successfully.',
      });
      setErrors({});
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to update profile. Please try again.';
      setStatusMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = (): void => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setErrors({});
      setStatusMessage(null);
    }
  };

  const hasChanges =
    user &&
    (firstName.trim() !== (user.firstName || '') ||
      lastName.trim() !== (user.lastName || '') ||
      phone.trim() !== (user.phone || ''));

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Member';

  const userInitials =
    `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'P';

  return (
    <Container className="py-10 max-w-4xl">
      {/* Page Title & Breadcrumbs */}
      <div className="mb-8">
        <nav className="mb-3 text-xs text-stone-500 font-medium" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link to="/" className="hover:text-art-charcoal transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-art-charcoal font-semibold" aria-current="page">
              My Account
            </li>
          </ol>
        </nav>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-art-charcoal sm:text-4xl">
          Patron Account
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Manage your personal details and view your art collection order history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Patron Overview Card */}
        <div className="md:col-span-1 space-y-6">
          <Section className="rounded-2xl border border-art-stone bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-art-cream text-art-ochre font-serif text-2xl font-bold border-2 border-art-ochre/30 shadow-inner mb-4"
                aria-hidden="true"
              >
                {userInitials}
              </div>
              <h2 className="font-serif text-lg font-bold text-art-charcoal">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5 truncate max-w-full">{user.email}</p>

              <div className="mt-3">
                <Badge variant="ochre">
                  {user.role === 'ADMIN' ? 'Store Administrator' : 'Patron Member'}
                </Badge>
              </div>

              <div className="w-full border-t border-art-stone/60 my-5" />

              <div className="w-full text-left space-y-3 text-xs text-stone-600">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Member Since</span>
                  <span className="font-medium text-art-charcoal">{formattedDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Account Status</span>
                  <span className="font-medium text-emerald-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* Admin Portal Quick Card (Admins Only) */}
          {user.role === 'ADMIN' && (
            <Section className="rounded-2xl border border-art-ochre/50 bg-amber-50/60 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-art-ochre text-art-charcoal">
                  Staff Access
                </span>
              </div>
              <h3 className="font-serif text-sm font-bold text-art-charcoal mb-2">
                Administrator Portal
              </h3>
              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                Access store operations, system infrastructure metadata, and upcoming administrative
                modules.
              </p>
              <Link
                to="/admin"
                className="inline-flex w-full items-center justify-center rounded-xl bg-art-charcoal px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
              >
                Open Admin Dashboard →
              </Link>
            </Section>
          )}

          {/* Quick Navigation Card */}
          <Section className="rounded-2xl border border-art-stone bg-art-cream/40 p-5">
            <h3 className="font-serif text-sm font-bold text-art-charcoal mb-3">Order History</h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Track pending and confirmed artwork dispatches, certificates of authenticity, and
              receipts.
            </p>
            <Link
              to="/orders"
              className="inline-flex w-full items-center justify-center rounded-xl bg-art-charcoal px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre"
            >
              View Order History →
            </Link>
          </Section>

          {/* Wishlist Quick Card */}
          <Section className="rounded-2xl border border-art-stone bg-art-cream/40 p-5">
            <h3 className="font-serif text-sm font-bold text-art-charcoal mb-3">Saved Artworks</h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Review handcrafted mandalas, canvas pieces, and traditional art saved to your personal
              wishlist.
            </p>
            <Link
              to="/wishlist"
              className="inline-flex w-full items-center justify-center rounded-xl bg-art-terracotta px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-art-terracotta/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-art-terracotta"
            >
              View Saved Wishlist →
            </Link>
          </Section>
        </div>

        {/* Right Column: Profile Edit Form & Saved Addresses */}
        <div className="md:col-span-2 space-y-8">
          <Section className="rounded-2xl border border-art-stone bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6 border-b border-art-stone/60 pb-4">
              <h2 className="font-serif text-xl font-bold text-art-charcoal">Profile Details</h2>
              <p className="mt-1 text-xs text-stone-500">
                Update your contact details for smooth checkout and artwork dispatch delivery.
              </p>
            </div>

            {/* Status Notifications */}
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
              {/* Email (Read-Only) */}
              <div>
                <label
                  htmlFor="account-email"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="account-email"
                    type="email"
                    value={user.email}
                    disabled
                    readOnly
                    className="w-full rounded-xl border border-art-stone/80 bg-stone-100/80 px-3.5 py-2.5 text-xs text-stone-500 cursor-not-allowed select-none"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] uppercase font-bold tracking-wider text-stone-400 bg-stone-200/70 px-2 py-0.5 rounded">
                    Read-Only
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-stone-400">
                  Primary identifier for purchase confirmations and cryptographic authentication.
                </p>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="account-first-name"
                  label="First Name"
                  type="text"
                  required
                  value={firstName}
                  disabled={isSubmitting}
                  onChange={e => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors(prev => ({ ...prev, firstName: undefined }));
                  }}
                  error={errors.firstName}
                  placeholder="e.g. Priya"
                />

                <Input
                  id="account-last-name"
                  label="Last Name"
                  type="text"
                  required
                  value={lastName}
                  disabled={isSubmitting}
                  onChange={e => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors(prev => ({ ...prev, lastName: undefined }));
                  }}
                  error={errors.lastName}
                  placeholder="e.g. Sharma"
                />
              </div>

              {/* Phone Field */}
              <div>
                <Input
                  id="account-phone"
                  label="Contact Phone"
                  type="tel"
                  value={phone}
                  disabled={isSubmitting}
                  onChange={e => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  error={errors.phone}
                  placeholder="10-digit Indian mobile number"
                  helperText="Used for courier delivery notifications and artwork transit coordination."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-art-stone/60 flex items-center justify-end gap-3">
                {hasChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleReset}
                  >
                    Discard Changes
                  </Button>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !hasChanges}
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </Section>

          <SavedAddressesSection />
        </div>
      </div>
    </Container>
  );
}
