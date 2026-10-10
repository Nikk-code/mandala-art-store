import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Section, Button, Input } from '@/components/ui';
import { useAuth } from '@/context';

export function LoginPage(): ReactNode {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const redirectPath = searchParams.get('redirect') || '/orders';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Sign In | Mandala Art Store';
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const validate = (): boolean => {
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
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
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please check your credentials and try again.';
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
                Artisan Customer Portal
              </span>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-art-charcoal">
                Welcome Back
              </h1>
              <p className="text-sm text-stone-600">
                Sign in to view your bespoke artwork orders and track deliveries.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-1"
              >
                <p className="font-bold">Authentication Failed</p>
                <p>{formError}</p>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="login-email"
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
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Input
                id="login-password"
                label="Password"
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
                autoComplete="current-password"
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In to Account'}
                </Button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-art-stone/60 text-xs text-stone-600">
              <p>
                Don&apos;t have an account yet?{' '}
                <Link
                  to={`/register${redirectPath !== '/orders' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-bold text-art-terracotta hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-art-terracotta rounded"
                >
                  Create Customer Account
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}

export default LoginPage;
