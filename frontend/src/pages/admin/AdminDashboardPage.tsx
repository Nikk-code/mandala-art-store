import { useState, useEffect, useCallback, type ReactNode } from 'react';
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
      <div className="rounded-2xl bg-white border border-stone-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-art-ochre text-art-charcoal">
                Verified {data.admin.role}
              </span>
              <span className="text-xs text-stone-500 font-mono">
                ID: {data.admin.id.slice(0, 8)}...
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-art-charcoal">
              Welcome back, {data.admin.firstName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Store operations and administrative management portal for Mandala Art Studio.
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs text-stone-600 sm:text-right">
            <p className="font-semibold text-art-charcoal">
              {data.admin.firstName} {data.admin.lastName}
            </p>
            <p className="text-stone-500 font-mono text-[11px]">{data.admin.email}</p>
          </div>
        </div>
      </div>

      {/* System Infrastructure Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Environment
          </p>
          <div className="mt-1 flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold font-mono text-art-charcoal capitalize">
              {data.system.environment}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            System Version
          </p>
          <div className="mt-1 flex items-center space-x-2">
            <span className="text-sm font-bold font-mono text-art-charcoal">
              v{data.system.version}
            </span>
            <span className="text-[10px] text-stone-400">Step 21 Foundation</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Server Timestamp
          </p>
          <div className="mt-1">
            <span className="text-xs font-mono text-stone-700">
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
          <h2 className="text-lg font-serif font-bold text-art-charcoal">
            Store Operations & Planned Modules
          </h2>
          <p className="text-xs text-stone-600">
            Administrative management tools are structured into modular domains. Modules activate as
            respective milestones are implemented.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.modules.map(module => (
            <div
              key={module.id}
              className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm hover:border-art-ochre/60 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-art-charcoal">{module.name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
                    Planned
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">{module.description}</p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span className="font-mono text-[10px]">{module.path || 'Pending'}</span>
                <span className="italic text-[10px]">Upcoming Milestone</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
