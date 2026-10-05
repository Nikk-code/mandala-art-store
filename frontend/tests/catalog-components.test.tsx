import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard, CategoryCard } from '@/components/catalog';
import type { ProductListItemDto, CategoryDto } from '@/types';

describe('Catalog Presentation Components', () => {
  const mockProduct: ProductListItemDto = {
    id: 'prod-1',
    sku: 'MAN-SRI-001',
    name: 'Sacred Sri Yantra Mandala',
    slug: 'sacred-sri-yantra-mandala',
    shortDescription: 'Intricate spiritual geometry on seasoned wood canvas.',
    description: 'Full description of the mandala',
    price: 349900,
    compareAtPrice: 429900,
    availability: 'IN_STOCK',
    dimensions: '18 x 18 inches',
    material: 'Wood canvas, Mineral pigments',
    weightGrams: 1200,
    isHandmade: true,
    isFeatured: true,
    category: {
      id: 'cat-1',
      name: 'Mandala Art',
      slug: 'mandala-art',
    },
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-mandala.jpg',
        altText: 'Sri Yantra Close Up',
        displayOrder: 0,
        isPrimary: true,
      },
    ],
    createdAt: '2026-10-04T00:00:00.000Z',
  };

  const mockCategory: CategoryDto = {
    id: 'cat-1',
    name: 'Mandala Art',
    slug: 'mandala-art',
    description: 'Centuries-old meditative geometric compositions.',
    imageUrl: 'https://images.unsplash.com/cat-mandala.jpg',
    displayOrder: 1,
  };

  describe('ProductCard', () => {
    it('renders product details, formatted prices, and availability badge', () => {
      render(<ProductCard product={mockProduct} />);

      expect(
        screen.getByRole('heading', { name: 'Sacred Sri Yantra Mandala' })
      ).toBeInTheDocument();
      expect(screen.getByText('Mandala Art')).toBeInTheDocument();
      expect(screen.getByText('Handcrafted')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByText('In Stock')).toBeInTheDocument();
      expect(screen.getByText(/3,499/)).toBeInTheDocument();
      expect(screen.getByText(/4,299/)).toBeInTheDocument();
      expect(screen.getByText(/18 x 18 inches/)).toBeInTheDocument();

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'https://images.unsplash.com/photo-mandala.jpg');
      expect(image).toHaveAttribute('alt', 'Sri Yantra Close Up');
    });

    it('renders placeholder fallback when product has no images', () => {
      const productNoImage: ProductListItemDto = {
        ...mockProduct,
        images: [],
      };
      render(<ProductCard product={productNoImage} />);
      expect(screen.getByLabelText('Image placeholder')).toBeInTheDocument();
    });
  });

  describe('CategoryCard', () => {
    it('renders category name and description', () => {
      render(
        <MemoryRouter>
          <CategoryCard category={mockCategory} />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Mandala Art' })).toBeInTheDocument();
      expect(
        screen.getByText('Centuries-old meditative geometric compositions.')
      ).toBeInTheDocument();
      expect(screen.getByText('Explore Collection')).toBeInTheDocument();
    });
  });
});
