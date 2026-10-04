import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Header, Footer } from '@/components/layout';

export function RootLayout(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col bg-art-cream text-art-charcoal selection:bg-art-ochre selection:text-white">
      {/* Skip to Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-art-charcoal focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-art-ochre text-sm font-semibold"
      >
        Skip to main content
      </a>

      {/* Application Header */}
      <Header />

      {/* Main Content Landmark */}
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Application Footer */}
      <Footer />
    </div>
  );
}
