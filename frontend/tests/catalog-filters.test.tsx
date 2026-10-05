import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CatalogFilters, ActiveFilterChips } from '@/components/catalog';
import type { CategoryDto } from '@/types';

describe('Catalog Filter Components', () => {
  const mockCategories: CategoryDto[] = [
    {
      id: 'cat-1',
      name: 'Mandala Art',
      slug: 'mandala-art',
      description: 'Sacred geometry',
      imageUrl: null,
      displayOrder: 1,
    },
    {
      id: 'cat-2',
      name: 'Lippan Art',
      slug: 'lippan-art',
      description: 'Clay mirror work',
      imageUrl: null,
      displayOrder: 2,
    },
  ];

  describe('CatalogFilters', () => {
    it('renders category options and handles selection', () => {
      const handleChange = vi.fn();
      render(
        <CatalogFilters
          categories={mockCategories}
          values={{}}
          onChange={handleChange}
          onReset={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /All Artworks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mandala Art/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Lippan Art/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Mandala Art/i }));
      expect(handleChange).toHaveBeenCalledWith({ category: 'mandala-art' });
    });

    it('handles availability selection', () => {
      const handleChange = vi.fn();
      render(
        <CatalogFilters
          categories={mockCategories}
          values={{ availability: 'IN_STOCK' }}
          onChange={handleChange}
          onReset={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Made to Order/i }));
      expect(handleChange).toHaveBeenCalledWith({ availability: 'MADE_TO_ORDER' });
    });

    it('handles sort dropdown change', () => {
      const handleChange = vi.fn();
      render(
        <CatalogFilters
          categories={mockCategories}
          values={{}}
          onChange={handleChange}
          onReset={vi.fn()}
        />
      );

      const sortSelect = screen.getByLabelText(/Sort Order/i);
      fireEvent.change(sortSelect, { target: { value: 'price_asc' } });
      expect(handleChange).toHaveBeenCalledWith({ sort: 'price_asc' });
    });

    it('handles clear all filters trigger', () => {
      const handleReset = vi.fn();
      render(
        <CatalogFilters
          categories={mockCategories}
          values={{ category: 'mandala-art' }}
          onChange={vi.fn()}
          onReset={handleReset}
        />
      );

      const clearBtn = screen.getByRole('button', { name: /Clear All/i });
      fireEvent.click(clearBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('ActiveFilterChips', () => {
    it('renders active filter chips and handles individual chip removal', () => {
      const handleRemoveCat = vi.fn();
      const handleRemoveAvail = vi.fn();
      const handleRemoveSort = vi.fn();
      const handleClearAll = vi.fn();

      render(
        <ActiveFilterChips
          categories={mockCategories}
          values={{
            category: 'mandala-art',
            availability: 'IN_STOCK',
            sort: 'price_asc',
          }}
          onRemoveCategory={handleRemoveCat}
          onRemoveAvailability={handleRemoveAvail}
          onRemoveSort={handleRemoveSort}
          onClearAll={handleClearAll}
        />
      );

      expect(screen.getByText(/Category: Mandala Art/i)).toBeInTheDocument();
      expect(screen.getByText(/Availability: In Stock/i)).toBeInTheDocument();
      expect(screen.getByText(/Sort: Price: Low to High/i)).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(/Remove Mandala Art category filter/i));
      expect(handleRemoveCat).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByLabelText(/Remove In Stock availability filter/i));
      expect(handleRemoveAvail).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByLabelText(/Reset sort order to newest/i));
      expect(handleRemoveSort).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Clear All/i }));
      expect(handleClearAll).toHaveBeenCalledTimes(1);
    });
  });
});
