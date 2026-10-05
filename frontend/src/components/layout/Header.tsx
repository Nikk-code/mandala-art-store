import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { APP_NAME } from '@/constants';
import { IconButton } from '@/components/ui';

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
];

export function Header(): ReactNode {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Action icons / placeholders */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Search Icon Placeholder */}
          <IconButton
            aria-label="Search collection"
            title="Search collection (Coming soon)"
            icon={
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />

          {/* Wishlist Placeholder */}
          <IconButton
            aria-label="Saved items"
            title="Saved items (Coming soon)"
            icon={
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            }
          />

          {/* Cart Icon Placeholder */}
          <div className="relative">
            <IconButton
              aria-label="Shopping bag"
              title="Shopping bag (Coming soon)"
              icon={
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
              }
            />
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-art-ochre ring-2 ring-white"
            />
          </div>
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
        </nav>
      )}
    </header>
  );
}
