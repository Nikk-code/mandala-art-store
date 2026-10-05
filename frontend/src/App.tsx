import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import {
  HomePage,
  ProductsPage,
  ProductDetailPage,
  CartPage,
  CheckoutPage,
  OrderConfirmationPage,
  OrderHistoryPage,
} from '@/pages';
import { CartProvider } from '@/context';

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
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:slug" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrderHistoryPage />} />
            <Route path="orders/:orderId" element={<OrderConfirmationPage />} />
            <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
