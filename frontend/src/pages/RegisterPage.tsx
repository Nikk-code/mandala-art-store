import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Section, Button, Input } from '@/components/ui';
import { useAuth } from '@/context';

export function RegisterPage(): ReactNode {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isAuthenticated } = useAuth();

  const redirectPath = searchParams.get('redirect') || '/orders';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Create Account | Mandala Art Store';
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const validate = (): boolean => {
    const nextErrors: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      nextErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters long.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (phone.trim()) {
      const cleanPhone = phone.trim().replace(/[\s\-()+]/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        nextErrors.phone = 'Please enter a valid 10-digit Indian mobile number.';
      }
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.';
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      nextErrors.password = 'Password must contain at least one letter and one number.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() ? phone.trim().replace(/[\s\-()+]/g, '') : undefined,
        password,
      });
      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to create account. Please check your details and try again.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20">
      <Section background="cream" spacing="lg">
        <Container size="sm">
          <div className="rounded-2xl border border-art-stone bg-white p-8 sm:p-10 shadow-sm space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-art-ochre">
                Artisan Patron Membership
              </span>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-art-charcoal">
                Create Customer Account
              </h1>
              <p className="text-sm text-stone-600">
                Join our patron collective to track artwork orders and access verified provenance.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-1"
              >
                <p className="font-bold">Registration Error</p>
                <p>{formError}</p>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="register-name"
                label="Full Name"
                type="text"
                name="name"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
                required
                disabled={isSubmitting}
                placeholder="Aarav Sharma"
                autoComplete="name"
              />

              <Input
                id="register-email"
                label="Email Address"
                type="email"
                name="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                required
                disabled={isSubmitting}
                placeholder="aarav@example.com"
                autoComplete="email"
              />

              <Input
                id="register-phone"
                label="Mobile Phone (Optional)"
                type="tel"
                name="phone"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                }}
                error={errors.phone}
                disabled={isSubmitting}
                placeholder="9876543210"
                autoComplete="tel"
              />

              <Input
                id="register-password"
                label="Password (min. 8 characters with letter & number)"
                type="password"
                name="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                required
                disabled={isSubmitting}
                placeholder="••••••••"
                autoComplete="new-password"
              />

              <Input
                id="register-confirm-password"
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                error={errors.confirmPassword}
                required
                disabled={isSubmitting}
                placeholder="••••••••"
                autoComplete="new-password"
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Register as Patron'}
                </Button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-art-stone/60 text-xs text-stone-600">
              <p>
                Already have an account?{' '}
                <Link
                  to={`/login${redirectPath !== '/orders' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-bold text-art-terracotta hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-art-terracotta rounded"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}

export default RegisterPage;
