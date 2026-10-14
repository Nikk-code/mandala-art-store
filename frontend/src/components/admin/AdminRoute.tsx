import type { ReactNode } from 'react';
import { Navigate, useLocation, Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context';
import { LoadingState } from '@/components/ui';
import { AdminLayout } from './AdminLayout';

export interface AdminRouteProps {
  children?: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps): ReactNode {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Verifying administrator credentials..." />
      </div>
    );
  }

  // 2. Unauthenticated State -> Redirect to Login with return destination
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. Authenticated Non-Admin Customer -> Access Denied (403 Forbidden)
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-stone-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            HTTP 403 • Forbidden
          </div>

          <h1 className="text-xl font-bold tracking-tight text-art-charcoal font-serif">
            Administrator Access Required
          </h1>

          <p className="text-xs text-stone-600 leading-relaxed">
            Your account is authenticated as{' '}
            <strong className="text-art-charcoal">{user.email}</strong>, but administrative
            privileges are required to access this area.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-art-charcoal text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Return to Storefront
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login', { state: { from: '/admin' } });
              }}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
            >
              Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated Administrator -> Render Admin Layout and Page
  return <AdminLayout>{children ? children : <Outlet />}</AdminLayout>;
}
