import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import type { ProductDetailDto } from '@/types';

describe('ProductDetailPage Integration & State Handling', () => {
  const mockProductDetail: ProductDetailDto = {
    id: 'prod-1',
    sku: 'MAN-SRI-001',
    name: 'Sacred Sri Yantra Mandala',
    slug: 'sacred-sri-yantra-mandala',
    shortDescription: 'Intricate spiritual geometry on seasoned wood canvas.',
    description: 'Masterpiece mandala handcrafted using ancient geometric principles.',
    price: 349900,
    compareAtPrice: 429900,
    availability: 'IN_STOCK',
    dimensions: '18 x 18 inches',
    material: 'Seasoned Teak Canvas, Mineral Pigments',
    weightGrams: 1200,
    isHandmade: true,
    isFeatured: true,
    metaTitle: 'Sacred Sri Yantra Mandala | Handmade Art',
    metaDescription: 'Authentic handcrafted Sri Yantra geometric mandala.',
    category: {
      id: 'cat-1',
      name: 'Mandala Art',
      slug: 'mandala-art',
      description: 'Sacred geometric patterns',
    },
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-sri-yantra-front.jpg',
        altText: 'Sri Yantra Frontal View',
        displayOrder: 0,
        isPrimary: true,
      },
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-sri-yantra-detail.jpg',
        altText: 'Sri Yantra Intricate Details',
        displayOrder: 1,
        isPrimary: false,
      },
    ],
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (initialEntries = ['/products/sacred-sri-yantra-mandala']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/products" element={<div>Catalog Listing Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders product information, specifications, formatted prices, and gallery', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('products/sacred-sri-yantra-mandala')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockProductDetail }),
          } as Response);
        }
        return Promise.resolve({ ok: false, status: 404 } as Response);
      })
    );

    renderWithRouter();

    // Verify loading state
    expect(screen.getByText(/Curating artwork details.../i)).toBeInTheDocument();

    await waitFor(() => {
      // Title, Category, SKU
      expect(
        screen.getByRole('heading', { level: 1, name: 'Sacred Sri Yantra Mandala' })
      ).toBeInTheDocument();
      expect(screen.getAllByText('Mandala Art').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('MAN-SRI-001')).toBeInTheDocument();

      // Prices & Availability
      expect(screen.getByText(/3,499/)).toBeInTheDocument();
      expect(screen.getByText(/4,299/)).toBeInTheDocument();
      expect(screen.getByText('In Stock')).toBeInTheDocument();

      // Specifications
      expect(screen.getByText('18 x 18 inches')).toBeInTheDocument();
      expect(screen.getByText('Seasoned Teak Canvas, Mineral Pigments')).toBeInTheDocument();
      expect(screen.getByText('1.2 kg')).toBeInTheDocument();
      expect(screen.getByText('100% Handcrafted Original')).toBeInTheDocument();

      // Descriptions
      expect(
        screen.getByText(/Intricate spiritual geometry on seasoned wood canvas./)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Masterpiece mandala handcrafted using ancient geometric principles./)
      ).toBeInTheDocument();

      // Breadcrumb navigation
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    });
  });

  it('handles 404 Not Found error gracefully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () =>
            Promise.resolve({
              success: false,
              error: { code: 'NOT_FOUND', message: 'Product not found' },
            }),
        } as Response)
      )
    );

    renderWithRouter(['/products/nonexistent-slug']);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Artwork Not Found' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Explore All Artworks' })).toBeInTheDocument();
    });
  });

  it('handles server error with retry capability', async () => {
    let attempt = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        attempt++;
        if (attempt === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () =>
              Promise.resolve({
                success: false,
                error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
              }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProductDetail }),
        } as Response);
      })
    );

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Unable to load artwork')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(attempt).toBe(2);
      expect(
        screen.getByRole('heading', { level: 1, name: 'Sacred Sri Yantra Mandala' })
      ).toBeInTheDocument();
    });
  });

  it('renders Made to Order and Sold Out states accurately', async () => {
    const madeToOrderProduct: ProductDetailDto = {
      ...mockProductDetail,
      availability: 'MADE_TO_ORDER',
      compareAtPrice: null,
      dimensions: null,
      material: null,
      weightGrams: null,
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: madeToOrderProduct }),
        } as Response)
      )
    );

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Made to Order')).toBeInTheDocument();
      expect(
        screen.getByText(/Individually crafted on demand by our master artisan/i)
      ).toBeInTheDocument();

      // Ensure omitted optional fields do not render empty labels
      expect(screen.queryByText('Dimensions')).not.toBeInTheDocument();
      expect(screen.queryByText('Material & Medium')).not.toBeInTheDocument();
      expect(screen.queryByText('Weight')).not.toBeInTheDocument();
    });
  });
});
