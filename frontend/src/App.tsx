import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage, ProductsPage } from '@/pages';

function NotFoundPage(): ReactNode {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-art-charcoal">404</h1>
      <p className="mt-2 text-sm text-stone-600">Page not found</p>
      <div className="mt-6">
        <Link
          to="/"
          className="rounded-lg bg-art-charcoal px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

export function App(): ReactNode {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
