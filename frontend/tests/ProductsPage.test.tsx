import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductsPage } from '@/pages/ProductsPage';
import type { CategoryDto, ProductListItemDto } from '@/types';

describe('ProductsPage Catalog Browsing & Filter Integration', () => {
  const mockCategories: CategoryDto[] = [
    {
      id: 'cat-1',
      name: 'Mandala Art',
      slug: 'mandala-art',
      description: 'Sacred geometry collection',
      imageUrl: null,
      displayOrder: 1,
    },
    {
      id: 'cat-2',
      name: 'Lippan Art',
      slug: 'lippan-art',
      description: 'Traditional mirror craft',
      imageUrl: null,
      displayOrder: 2,
    },
  ];

  const mockProductsPage1: ProductListItemDto[] = [
    {
      id: 'prod-1',
      sku: 'MAN-001',
      name: 'Cosmic Mandala Canvas',
      slug: 'cosmic-mandala-canvas',
      shortDescription: 'Spiritual dot-work art',
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
    {
      id: 'prod-2',
      sku: 'LIP-001',
      name: 'Kutch Sun Mirror Relief',
      slug: 'kutch-sun-mirror-relief',
      shortDescription: 'Mud and mirror work',
      description: 'Full description',
      price: 389900,
      compareAtPrice: 450000,
      availability: 'MADE_TO_ORDER',
      dimensions: '16 x 16 in',
      material: 'Clay and glass mirrors',
      weightGrams: 1500,
      isHandmade: true,
      isFeatured: false,
      category: { id: 'cat-2', name: 'Lippan Art', slug: 'lippan-art' },
      images: [],
      createdAt: '2026-10-04T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (initialEntries = ['/products']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/products" element={<ProductsPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders catalog page and loads products and categories from API', async () => {
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
                  items: mockProductsPage1,
                  pagination: { page: 1, pageSize: 12, totalItems: 2, totalPages: 1 },
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

    renderWithRouter();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Explore All Artworks' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Fetching curated catalog creations.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Cosmic Mandala Canvas' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Kutch Sun Mirror Relief' })).toBeInTheDocument();
      expect(screen.getByText('Showing 2 of 2 artworks')).toBeInTheDocument();
    });
  });

  it('filters by category when initial URL parameter is present', async () => {
    let requestedUrl = '';

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
          requestedUrl = url;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  items: [mockProductsPage1[0]],
                  pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 },
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

    renderWithRouter(['/products?category=mandala-art']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Mandala Art' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Cosmic Mandala Canvas' })).toBeInTheDocument();
      expect(requestedUrl).toContain('category=mandala-art');
    });
  });

  it('handles error state and allows retry', async () => {
    let attempt = 0;

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
          attempt++;
          if (attempt === 1) {
            return Promise.resolve({
              ok: false,
              status: 500,
              json: () => Promise.resolve({ success: false, error: { message: 'Server down' } }),
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  items: mockProductsPage1,
                  pagination: { page: 1, pageSize: 12, totalItems: 2, totalPages: 1 },
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

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Unable to load artworks')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(attempt).toBe(2);
      expect(screen.getByRole('heading', { name: 'Cosmic Mandala Canvas' })).toBeInTheDocument();
    });
  });

  it('renders empty state when no products match filters', async () => {
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
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                items: [],
                pagination: { page: 1, pageSize: 12, totalItems: 0, totalPages: 0 },
              },
            }),
        } as Response);
      })
    );

    renderWithRouter(['/products?category=nonexistent']);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'No artworks found' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear All Filters' })).toBeInTheDocument();
    });
  });

  it('opens and closes mobile filter drawer', async () => {
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
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                items: mockProductsPage1,
                pagination: { page: 1, pageSize: 12, totalItems: 2, totalPages: 1 },
              },
            }),
        } as Response);
      })
    );

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Cosmic Mandala Canvas' })).toBeInTheDocument();
    });

    const refineBtn = screen.getByRole('button', { name: /Open filter and sorting options/i });
    fireEvent.click(refineBtn);

    expect(screen.getByRole('dialog', { name: 'Refine Artworks' })).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Close filters drawer' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog', { name: 'Refine Artworks' })).not.toBeInTheDocument();
  });
});
