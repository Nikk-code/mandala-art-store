import type { ReactNode } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '@/constants';

export function RootLayout(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col bg-art-cream text-art-charcoal">
      {/* Header */}
      <header className="border-b border-art-stone bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              to="/"
              className="text-xl font-bold tracking-tight text-art-charcoal hover:text-art-ochre transition-colors"
            >
              {APP_NAME}
            </Link>
            <p className="text-xs text-stone-500 hidden sm:block">{APP_TAGLINE}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
              Phase: Technical Foundation
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-art-stone bg-stone-50 py-6 text-center text-xs text-stone-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="mt-1">Handmade Mandala Art & Lippan Kaam Artisanal Platform</p>
        </div>
      </footer>
    </div>
  );
}
