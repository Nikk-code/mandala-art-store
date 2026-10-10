import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { APP_NAME } from '@/constants';
import { IconButton } from '@/components/ui';
import { useCart, useAuth } from '@/context';

interface NavItem {
  name: string;
  href: string;
}

const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'All Artworks', href: '/products' },
  { name: 'Mandala Art', href: '/products?category=mandala-art' },
  { name: 'Lippan Kaam', href: '/products?category=lippan-art' },
  { name: 'Paintings', href: '/products?category=handmade-paintings' },
  { name: 'My Orders', href: '/orders' },
];

export function Header(): ReactNode {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-art-stone/80 bg-white/95 backdrop-blur-md transition-shadow duration-200 shadow-sm">
      {/* Top Banner / Announcement Bar */}
      <div className="bg-art-charcoal text-art-sand text-[11px] font-medium tracking-widest uppercase py-1.5 px-4 text-center">
        <span>Curated Sacred Geometry & Traditional Lippan Artistry • Handcrafted in India</span>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Mobile menu trigger */}
        <div className="flex items-center lg:hidden">
          <IconButton
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            icon={
              mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )
            }
          />
        </div>

        {/* Brand / Logo */}
        <div className="flex items-center">
          <Link
            to="/"
            className="group flex flex-col items-center sm:items-start text-center sm:text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre rounded-lg p-1"
          >
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-art-charcoal group-hover:text-art-ochre transition-colors duration-200">
              {APP_NAME}
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-art-ochre hidden sm:block">
              Sacred Geometry & Heritage Art
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-8" aria-label="Main Navigation">
          {NAVIGATION_ITEMS.map(item => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `text-sm font-medium tracking-wide transition-colors duration-150 py-1 border-b-2 ${
                  isActive && item.href === '/'
                    ? 'text-art-charcoal border-art-ochre'
                    : 'text-stone-600 border-transparent hover:text-art-charcoal hover:border-art-sand'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Action icons & Account Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Account Menu (Desktop) */}
          <div className="hidden sm:flex items-center text-xs">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-art-stone/60">
                <span className="font-medium text-art-charcoal truncate max-w-[120px]">
                  {user.firstName}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-stone-500 hover:text-art-terracotta transition-colors font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-art-stone/60">
                <Link
                  to="/login"
                  className="font-medium text-stone-600 hover:text-art-charcoal transition-colors py-1 px-2 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-art-ochre"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="font-bold text-art-terracotta hover:text-art-terracotta/90 transition-colors py-1 px-2 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-art-terracotta"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Cart Icon Link */}
          <Link
            to="/cart"
            className="relative inline-flex items-center justify-center rounded-lg p-2 text-art-charcoal hover:bg-art-cream hover:text-art-ochre transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-art-ochre min-h-[44px] min-w-[44px]"
            aria-label={`Shopping cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {itemCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-art-ochre px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
              >
                {itemCount}
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-stone-300 ring-2 ring-white"
              />
            )}
          </Link>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav
          className="lg:hidden border-t border-art-stone bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fadeIn"
          aria-label="Mobile Navigation"
        >
          {NAVIGATION_ITEMS.map(item => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-art-charcoal hover:bg-art-cream hover:text-art-ochre transition-colors"
            >
              {item.name}
            </Link>
          ))}

          {/* Mobile Auth actions */}
          <div className="pt-3 border-t border-art-stone/60 space-y-2">
            {isAuthenticated && user ? (
              <div className="px-3 py-2 space-y-2">
                <p className="text-xs text-stone-500">Signed in as {user.email}</p>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left font-semibold text-sm text-art-terracotta hover:underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-1 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-art-stone bg-white px-4 py-2.5 text-xs font-bold text-art-charcoal shadow-sm hover:bg-stone-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl bg-art-terracotta px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-art-terracotta/90"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
