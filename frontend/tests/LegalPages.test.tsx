import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { TermsOfCraftPage } from '@/pages/TermsOfCraftPage';
import { CareGuidePage } from '@/pages/CareGuidePage';
import { Footer } from '@/components/layout/Footer';

describe('Legal & Artisan Care Pages', () => {
  it('renders PrivacyPolicyPage with all required data protection and Razorpay security sections', () => {
    render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeInTheDocument();
    expect(screen.getByText(/Payment Gateway Security \(Razorpay\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We NEVER collect, store, or view your payment instruments/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/support@mandalaartstore.com/i)).toBeInTheDocument();
  });

  it('renders TermsOfCraftPage with handmade authenticity, transit, and damage policies', () => {
    render(
      <MemoryRouter>
        <TermsOfCraftPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /Terms of Craft & Purchase/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Authenticity & The Nature of Handcrafted Art/i)).toBeInTheDocument();
    expect(screen.getByText(/15-minute stock reservation/i)).toBeInTheDocument();
    expect(screen.getByText(/Transit Damage, Replacements & Returns/i)).toBeInTheDocument();
    expect(screen.getByText(/Unboxing Video Requirement/i)).toBeInTheDocument();
  });

  it('renders CareGuidePage with Lippan Art and Mandala preservation guides', () => {
    render(
      <MemoryRouter>
        <CareGuidePage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /Artisan Care & Preservation Guide/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Caring for Lippan Art/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/NEVER Use Water or Sprays/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Preserving Sacred Mandala Paintings & Canvas Panels/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Safe Hanging & Wall Installation/i)).toBeInTheDocument();
  });

  it('verifies Footer links route to dedicated legal and care pages', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i });
    const termsLink = screen.getByRole('link', { name: /Terms of Craft/i });
    const careLink = screen.getByRole('link', { name: /Care Guide/i });

    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    expect(termsLink).toHaveAttribute('href', '/terms-of-craft');
    expect(careLink).toHaveAttribute('href', '/care-guide');
  });
});
