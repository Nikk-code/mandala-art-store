import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminDashboard } from '@/services/admin-service';
import type { AdminDashboardResponseData } from '@/types';
import { LoadingState, ErrorState } from '@/components/ui';

export function AdminDashboardPage(): ReactNode {
  const [data, setData] = useState<AdminDashboardResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAdminDashboard();
      setData(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load administrator dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading administrative dashboard..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16">
        <ErrorState
          title="Administrative Dashboard Unavailable"
          message={error || 'Could not retrieve administrator system metadata.'}
          onRetry={loadDashboard}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome & Identity Banner */}
      <div className="rounded-2xl bg-white dark:bg-art-darkcard border border-stone-200/80 dark:border-art-darkborder p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-art-ochre text-art-charcoal">
                Verified {data.admin.role}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                ID: {data.admin.id.slice(0, 8)}...
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-art-charcoal dark:text-stone-100">
              Welcome back, {data.admin.firstName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
              Store operations and administrative management portal for Mandala Art Studio.
            </p>
          </div>

          <div className="bg-stone-50 dark:bg-art-darkstone rounded-xl p-3 border border-stone-200 dark:border-art-darkborder text-xs text-stone-600 dark:text-stone-300 sm:text-right">
            <p className="font-semibold text-art-charcoal dark:text-stone-100">
              {data.admin.firstName} {data.admin.lastName}
            </p>
            <p className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">
              {data.admin.email}
            </p>
          </div>
        </div>
      </div>

      {/* System Infrastructure Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-art-darkcard rounded-xl border border-stone-200/80 dark:border-art-darkborder p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Environment
          </p>
          <div className="mt-1 flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold font-mono text-art-charcoal dark:text-stone-100 capitalize">
              {data.system.environment}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-art-darkcard rounded-xl border border-stone-200/80 dark:border-art-darkborder p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            System Version
          </p>
          <div className="mt-1 flex items-center space-x-2">
            <span className="text-sm font-bold font-mono text-art-charcoal dark:text-stone-100">
              v{data.system.version}
            </span>
            <span className="text-[10px] text-stone-400">Step 21 Foundation</span>
          </div>
        </div>

        <div className="bg-white dark:bg-art-darkcard rounded-xl border border-stone-200/80 dark:border-art-darkborder p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Server Timestamp
          </p>
          <div className="mt-1">
            <span className="text-xs font-mono text-stone-700 dark:text-stone-300">
              {new Date(data.system.serverTime).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Planned Operational Modules Summary */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-art-charcoal dark:text-stone-100">
            Store Operations & Planned Modules
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Administrative management tools are structured into modular domains. Modules activate as
            respective milestones are implemented.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.modules.map(module => {
            const isAvailable = module.status === 'AVAILABLE';

            return (
              <div
                key={module.id}
                className="bg-white dark:bg-art-darkcard rounded-xl border border-stone-200/80 dark:border-art-darkborder p-5 shadow-sm hover:border-art-ochre/60 dark:hover:border-art-ochre/60 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm text-art-charcoal dark:text-stone-100">
                      {module.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-stone-100 text-stone-600 border border-stone-200 dark:bg-art-darkstone dark:text-stone-400 dark:border-art-darkborder'
                      }`}
                    >
                      {isAvailable ? 'Active' : 'Planned'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                    {module.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-art-darkborder flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                  <span className="font-mono text-[10px]">{module.path || 'Pending'}</span>
                  {isAvailable && module.path ? (
                    <Link
                      to={module.path}
                      className="font-semibold text-art-charcoal dark:text-stone-200 hover:text-amber-700 dark:hover:text-art-ochre transition-colors"
                    >
                      Open Module →
                    </Link>
                  ) : (
                    <span className="italic text-[10px]">Upcoming Milestone</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
