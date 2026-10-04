import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { App } from '@/App';

// Mock global fetch for health check in tests
vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: 42,
          environment: 'test',
        }),
    } as Response)
  )
);

describe('Application Shell & Design System Integration', () => {
  it('renders application header with brand name and navigation landmarks', async () => {
    render(<App />);
    const heading = await screen.findByRole('link', { name: /Mandala Art Store/i });
    expect(heading).toBeInTheDocument();

    const mainNav = screen.getByRole('navigation', { name: /Main Navigation/i });
    expect(mainNav).toBeInTheDocument();

    // Ensure async health check has completed
    await screen.findByText(/API Connected \(test\)/i);
  });

  it('renders skip-to-content accessibility link', async () => {
    render(<App />);
    const skipLink = screen.getByRole('link', { name: /Skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    await screen.findByText(/API Connected \(test\)/i);
  });

  it('renders boutique hero section with brand messaging', async () => {
    render(<App />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Timeless art to bring serenity and harmony into your home/i,
      })
    ).toBeInTheDocument();

    await screen.findByText(/API Connected \(test\)/i);
  });

  it('renders artisanal footer with heritage information and copyright', async () => {
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(screen.getByText(/Authentic Handmade Certification/i)).toBeInTheDocument();

    await screen.findByText(/API Connected \(test\)/i);
  });
});
