import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';

export interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps): ReactNode {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-art-charcoal flex flex-col font-sans">
      {/* Top Administrative Header */}
      <header className="bg-art-charcoal text-white shadow-md border-b border-stone-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Portal Badge */}
            <div className="flex items-center space-x-3">
              <Link
                to="/admin"
                className="flex items-center space-x-2 text-white hover:text-art-sand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre rounded"
              >
                <span className="font-serif text-lg font-bold tracking-tight">Mandala Studio</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-art-ochre text-art-charcoal">
                  Admin Portal
                </span>
              </Link>
            </div>

            {/* Right: Quick actions, admin identity & storefront link */}
            <div className="flex items-center space-x-3 sm:space-x-4 text-xs">
              <Link
                to="/"
                className="inline-flex items-center space-x-1 text-stone-300 hover:text-white px-2.5 py-1.5 rounded border border-stone-700 hover:border-stone-500 transition-colors"
                title="Navigate to customer storefront"
              >
                <svg
                  className="w-3.5 h-3.5 text-art-sand"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="hidden sm:inline">Storefront</span>
              </Link>

              {user ? (
                <div className="flex items-center space-x-2 pl-2 border-l border-stone-700">
                  <div className="flex flex-col text-right">
                    <span className="font-medium text-white truncate max-w-[120px] sm:max-w-[180px]">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">{user.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="ml-2 px-2.5 py-1.5 rounded text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                  >
                    Sign Out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">{children}</main>

      {/* Admin Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-4 text-center text-xs text-stone-500">
        <p>Mandala Art Store Administrative System • Role: Explicit ADMIN Required</p>
      </footer>
    </div>
  );
}
