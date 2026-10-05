import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';

describe('HomePage Integration & State Handling', () => {
  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Mandala Art',
      slug: 'mandala-art',
      description: 'Sacred geometric patterns',
      imageUrl: null,
      displayOrder: 1,
    },
    {
      id: 'cat-2',
      name: 'Lippan Art',
      slug: 'lippan-art',
      description: 'Clay and mirror art',
      imageUrl: null,
      displayOrder: 2,
    },
  ];

  const mockProducts = [
    {
      id: 'prod-1',
      sku: 'MAN-001',
      name: 'Cosmic Mandala Canvas',
      slug: 'cosmic-mandala-canvas',
      shortDescription: 'Spiritual harmony artwork',
      description: 'Full description',
      price: 249900,
      compareAtPrice: null,
      availability: 'IN_STOCK',
      dimensions: '12 x 12 in',
      material: 'Canvas',
      weightGrams: 800,
      isHandmade: true,
      isFeatured: true,
      category: { id: 'cat-1', name: 'Mandala Art', slug: 'mandala-art' },
      images: [],
      createdAt: '2026-10-04T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  it('renders loaded categories and featured products from catalog service', async () => {
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
                  pagination: { page: 1, pageSize: 8, totalItems: 1, totalPages: 1 },
                },
              }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        } as Response);
      })
    );

    renderHomePage();

    expect(screen.getByText(/Loading artisanal categories.../i)).toBeInTheDocument();
    expect(screen.getByText(/Curating featured creations.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Mandala Art' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Lippan Art' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Cosmic Mandala Canvas' })).toBeInTheDocument();
    });
  });

  it('renders error state and retries on failure', async () => {
    let categoryAttempts = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('categories')) {
          categoryAttempts++;
          if (categoryAttempts === 1) {
            return Promise.resolve({
              ok: false,
              status: 500,
              json: () =>
                Promise.resolve({
                  success: false,
                  error: { code: 'SERVER_ERROR', message: 'Failed to fetch categories' },
                }),
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockCategories }),
          } as Response);
        }

        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                items: mockProducts,
                pagination: { page: 1, pageSize: 8, totalItems: 1, totalPages: 1 },
              },
            }),
        } as Response);
      })
    );

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Unable to load collections')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(categoryAttempts).toBe(2);
      expect(screen.getByRole('heading', { name: 'Mandala Art' })).toBeInTheDocument();
    });
  });

  it('renders empty states when API returns empty lists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                items: [],
                pagination: { page: 1, pageSize: 8, totalItems: 0, totalPages: 0 },
              },
            }),
        } as Response);
      })
    );

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('No Categories Available')).toBeInTheDocument();
      expect(screen.getByText('No Featured Creations Found')).toBeInTheDocument();
    });
  });
});
