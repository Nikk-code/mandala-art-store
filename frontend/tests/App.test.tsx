import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App } from '@/App';

describe('Application Shell & Homepage Integration', () => {
  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Mandala Art',
      slug: 'mandala-art',
      description: 'Sacred geometry',
      imageUrl: null,
      displayOrder: 1,
    },
  ];

  const mockProducts = [
    {
      id: 'prod-1',
      sku: 'MAN-001',
      name: 'Sacred Sri Yantra Mandala',
      slug: 'sacred-sri-yantra-mandala',
      shortDescription: 'Spiritual dot-work art',
      description: 'Full description',
      price: 249900,
      compareAtPrice: 349900,
      availability: 'IN_STOCK',
      dimensions: '18 x 18 in',
      material: 'Wood',
      weightGrams: 1000,
      isHandmade: true,
      isFeatured: true,
      category: {
        id: 'cat-1',
        name: 'Mandala Art',
        slug: 'mandala-art',
      },
      images: [],
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockCategories }),
          } as Response);
        }

        if (url.includes('products')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  items: mockProducts,
                  pagination: {
                    page: 1,
                    pageSize: 8,
                    totalItems: 1,
                    totalPages: 1,
                  },
                },
              }),
          } as Response);
        }

        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'ok',
              timestamp: new Date().toISOString(),
              uptime: 42,
              environment: 'test',
            }),
        } as Response);
      })
    );
  });

  it('renders application header with brand name and navigation landmarks', async () => {
    render(<App />);
    const heading = await screen.findByRole('link', { name: /Mandala Art Store/i });
    expect(heading).toBeInTheDocument();

    const mainNav = screen.getByRole('navigation', { name: /Main Navigation/i });
    expect(mainNav).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sacred Sri Yantra Mandala' })
      ).toBeInTheDocument();
    });
  });

  it('renders skip-to-content accessibility link', async () => {
    render(<App />);
    const skipLink = screen.getByRole('link', { name: /Skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sacred Sri Yantra Mandala' })
      ).toBeInTheDocument();
    });
  });

  it('renders boutique hero section with brand messaging', async () => {
    render(<App />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Timeless sacred art to bring serenity and harmony into your home/i,
      })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sacred Sri Yantra Mandala' })
      ).toBeInTheDocument();
    });
  });

  it('renders artisanal footer with heritage information and copyright', async () => {
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(screen.getByText(/Authentic Handmade Certification/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sacred Sri Yantra Mandala' })
      ).toBeInTheDocument();
    });
  });
});
