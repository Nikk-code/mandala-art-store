import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '@/constants';
import { Container } from '@/components/ui';

export function Footer(): ReactNode {
  return (
    <footer
      className="border-t border-art-stone bg-art-stone/30 text-art-charcoal"
      role="contentinfo"
    >
      <Container size="7xl" className="py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand story */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-serif text-2xl font-bold tracking-tight text-art-charcoal">
              {APP_NAME}
            </h3>
            <p className="text-sm font-medium text-art-ochre">{APP_TAGLINE}</p>
            <p className="text-sm text-stone-600 max-w-md leading-relaxed">
              Honoring centuries-old Indian sacred geometry and Kutch Lippan art traditions. Every
              creation is individually handcrafted with organic clay, sacred mirrors, and archival
              pigments to bring stillness and beauty to modern spaces.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-stone-500 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-art-ochre" aria-hidden="true" />
              <span>Authentic Handmade Certification • Ethical Artisan Fair-Trade</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-900">
              Artisanal Collections
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-600">
              <li>
                <span className="hover:text-art-charcoal cursor-default transition-colors">
                  Sacred Mandalas
                </span>
              </li>
              <li>
                <span className="hover:text-art-charcoal cursor-default transition-colors">
                  Lippan Kaam Mirrors
                </span>
              </li>
              <li>
                <span className="hover:text-art-charcoal cursor-default transition-colors">
                  Custom Spiritual Geometry
                </span>
              </li>
              <li>
                <span className="hover:text-art-charcoal cursor-default transition-colors">
                  Canvas Wall Statements
                </span>
              </li>
            </ul>
          </div>

          {/* Heritage & Values */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-900">
              Craft & Heritage
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-600">
              <li>
                <span className="hover:text-art-charcoal cursor-default transition-colors">
                  The Art of Lippan Kaam
                </span>
              </li>
              <li>
                <span className="hover:text-art-charcoal cursor-default transition-colors">
                  Archival Framing & Care
                </span>
              </li>
              <li>
                <span className="hover:text-art-charcoal cursor-default transition-colors">
                  Artisan Collective Story
                </span>
              </li>
              <li>
                <span className="hover:text-art-charcoal cursor-default transition-colors">
                  Pan-India Safe Transit
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-art-stone/60 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Handcrafted in India. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/" className="hover:text-art-charcoal transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-art-charcoal transition-colors">
              Terms of Craft
            </Link>
            <Link to="/" className="hover:text-art-charcoal transition-colors">
              Care Guide
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
