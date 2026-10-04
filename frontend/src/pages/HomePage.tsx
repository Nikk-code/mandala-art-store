import type { ReactNode } from 'react';
import { useHealthCheck } from '@/hooks/useHealthCheck';

export function HomePage(): ReactNode {
  const { data: health, isLoading, error, refetch } = useHealthCheck();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-art-stone bg-white p-6 shadow-sm sm:p-10">
        <div className="flex items-center justify-between border-b border-art-stone pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-art-charcoal sm:text-3xl">
              Mandala Art Store
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Technical Foundation & Application Environment
            </p>
          </div>
          <span className="inline-flex items-center rounded-md bg-art-stone/60 px-3 py-1 text-xs font-semibold text-art-charcoal">
            v0.1.0
          </span>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-art-charcoal">Foundation Status</h2>
            <p className="mt-1 text-sm text-stone-600">
              The project runtime is initialized with strict TypeScript, Vite, React Router,
              Tailwind CSS, and a modular backend architecture.
            </p>
          </div>

          {/* System Health Card */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-stone-900">Backend API Health Connection</h3>
              <button
                type="button"
                onClick={refetch}
                disabled={isLoading}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-50"
              >
                {isLoading ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>

            <div className="mt-4">
              {isLoading && (
                <div className="flex items-center space-x-2 text-sm text-stone-500">
                  <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-art-ochre"></div>
                  <span>Pinging API endpoint (/api/health)...</span>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-semibold">API Disconnected or Standalone Frontend Mode</p>
                  <p className="mt-0.5">{error.message}</p>
                  <p className="mt-1 text-stone-500">
                    Run backend server on port 5000 (`npm run dev:backend`) to connect.
                  </p>
                </div>
              )}

              {health && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    <span className="font-semibold">
                      Backend Connected (Status: {health.status.toUpperCase()})
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-emerald-900">
                    <div>
                      Environment: <span className="font-mono">{health.environment}</span>
                    </div>
                    <div>
                      Uptime: <span className="font-mono">{Math.round(health.uptime)}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Architecture Pillars */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-stone-200 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Frontend
              </h4>
              <p className="mt-1 text-sm font-medium text-stone-900">React 18 + Vite</p>
              <p className="mt-1 text-xs text-stone-500">
                TypeScript strict mode, React Router, Vitest component testing.
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Styling
              </h4>
              <p className="mt-1 text-sm font-medium text-stone-900">Tailwind CSS</p>
              <p className="mt-1 text-xs text-stone-500">
                Custom art color palette, mobile-first responsive breakpoints.
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Backend
              </h4>
              <p className="mt-1 text-sm font-medium text-stone-900">Node.js + Express</p>
              <p className="mt-1 text-xs text-stone-500">
                REST API architecture, centralized error handling, Supertest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
