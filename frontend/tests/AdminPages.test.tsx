import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage';
import * as adminService from '@/services/admin-service';
import type { AdminProductDto, AdminCategoryDto, AdminInventoryItemDto } from '@/types';

describe('Admin Catalog & Inventory Pages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockCategories: AdminCategoryDto[] = [
    {
      id: 'cat-1',
      name: 'Mandala Art',
      slug: 'mandala-art',
      description: 'Sacred circular geometries',
      imageUrl: 'https://images.mandala.test/mandala.jpg',
      displayOrder: 1,
      isActive: true,
      productCount: 4,
      createdAt: '2026-10-14T00:00:00.000Z',
      updatedAt: '2026-10-14T00:00:00.000Z',
    },
    {
      id: 'cat-2',
      name: 'Lippan Clay Art',
      slug: 'lippan-clay-art',
      description: 'Traditional Gujarati mud-mirror artwork',
      imageUrl: null,
      displayOrder: 2,
      isActive: false,
      productCount: 0,
      createdAt: '2026-10-14T00:00:00.000Z',
      updatedAt: '2026-10-14T00:00:00.000Z',
    },
  ];

  const mockProducts: AdminProductDto[] = [
    {
      id: 'prod-1',
      sku: 'MND-LOTUS-01',
      name: 'Sacred Lotus Mandala',
      slug: 'sacred-lotus-mandala',
      description: 'Handcrafted spiritual mandala on canvas',
      shortDescription: 'Spiritual mandala',
      price: 1500000,
      compareAtPrice: 1800000,
      categoryId: 'cat-1',
      availability: 'IN_STOCK',
      stockQuantity: 5,
      dimensions: '30x30 cm',
      material: 'Canvas & Acrylic',
      weightGrams: 900,
      isHandmade: true,
      isFeatured: true,
      isActive: true,
      metaTitle: 'Sacred Lotus',
      metaDescription: 'Lotus painting',
      createdAt: '2026-10-14T00:00:00.000Z',
      updatedAt: '2026-10-14T00:00:00.000Z',
      category: { id: 'cat-1', name: 'Mandala Art', slug: 'mandala-art' },
      images: [
        {
          id: 'img-1',
          url: 'https://images.mandala.test/lotus.jpg',
          altText: 'Lotus Mandala',
          isPrimary: true,
          displayOrder: 0,
        },
      ],
    },
  ];

  const mockInventoryItems: AdminInventoryItemDto[] = [
    {
      ...mockProducts[0],
      isLowStock: false,
    },
    {
      ...mockProducts[0],
      id: 'prod-2',
      name: 'Sun Chariot Lippan Art',
      sku: 'LIP-SUN-02',
      stockQuantity: 2,
      isLowStock: true,
    },
  ];

  describe('AdminProductsPage Component', () => {
    it('renders products table and filters', async () => {
      vi.spyOn(adminService, 'fetchAdminCategories').mockResolvedValue(mockCategories);
      vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
        items: mockProducts,
        pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <AdminProductsPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Loading catalog artworks/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Sacred Lotus Mandala')).toBeInTheDocument();
      });

      expect(screen.getByText('MND-LOTUS-01')).toBeInTheDocument();
      expect(screen.getByText('₹15,000')).toBeInTheDocument();
      expect(screen.getByText('Create New Artwork')).toBeInTheDocument();
    });

    it('toggles product active status when button is clicked', async () => {
      vi.spyOn(adminService, 'fetchAdminCategories').mockResolvedValue(mockCategories);
      vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
        items: mockProducts,
        pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
      });

      const toggleSpy = vi
        .spyOn(adminService, 'toggleAdminProductStatus')
        .mockResolvedValue({ ...mockProducts[0], isActive: false });

      render(
        <MemoryRouter>
          <AdminProductsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Sacred Lotus Mandala')).toBeInTheDocument();
      });

      const deactivateBtn = screen.getByRole('button', { name: /Deactivate/i });
      fireEvent.click(deactivateBtn);

      await waitFor(() => {
        expect(toggleSpy).toHaveBeenCalledWith('prod-1', false);
      });
    });
  });

  describe('AdminCategoriesPage Component', () => {
    it('renders category cards with active product counts', async () => {
      vi.spyOn(adminService, 'fetchAdminCategories').mockResolvedValue(mockCategories);

      render(
        <MemoryRouter>
          <AdminCategoriesPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Loading categories/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Mandala Art')).toBeInTheDocument();
      });

      expect(screen.getByText('Lippan Clay Art')).toBeInTheDocument();
      expect(screen.getByText(/4 artworks/i)).toBeInTheDocument();
      expect(screen.getByText(/0 artworks/i)).toBeInTheDocument();
    });

    it('disables deletion when products depend on category', async () => {
      vi.spyOn(adminService, 'fetchAdminCategories').mockResolvedValue(mockCategories);

      render(
        <MemoryRouter>
          <AdminCategoriesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mandala Art')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      expect(deleteButtons.length).toBe(2);

      // cat-1 has 4 products -> delete button disabled
      expect(deleteButtons[0]).toBeDisabled();

      // cat-2 has 0 products -> delete button enabled
      expect(deleteButtons[1]).not.toBeDisabled();
    });
  });

  describe('AdminInventoryPage Component', () => {
    it('renders inventory metrics and stock alert levels', async () => {
      vi.spyOn(adminService, 'fetchAdminCategories').mockResolvedValue(mockCategories);
      vi.spyOn(adminService, 'fetchAdminInventory').mockResolvedValue({
        items: mockInventoryItems,
        pagination: { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <AdminInventoryPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Loading inventory allocations/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Sacred Lotus Mandala')).toBeInTheDocument();
      });

      expect(screen.getByText('Sun Chariot Lippan Art')).toBeInTheDocument();
      expect(screen.getByText(/Low Stock \(≤ 3\)/i)).toBeInTheDocument();
    });

    it('opens adjust stock modal and saves stock change', async () => {
      vi.spyOn(adminService, 'fetchAdminCategories').mockResolvedValue(mockCategories);
      vi.spyOn(adminService, 'fetchAdminInventory').mockResolvedValue({
        items: mockInventoryItems,
        pagination: { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 },
      });

      const adjustSpy = vi.spyOn(adminService, 'adjustAdminInventory').mockResolvedValue({
        ...mockInventoryItems[0],
        stockQuantity: 10,
      });

      render(
        <MemoryRouter>
          <AdminInventoryPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Sacred Lotus Mandala')).toBeInTheDocument();
      });

      const adjustButtons = screen.getAllByRole('button', { name: /Adjust Stock/i });
      fireEvent.click(adjustButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Adjust Inventory Stock/i)).toBeInTheDocument();
      });

      const quantityInput = screen.getByRole('spinbutton');
      fireEvent.change(quantityInput, { target: { value: '10' } });

      const saveBtn = screen.getByRole('button', { name: /Save Stock/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(adjustSpy).toHaveBeenCalledWith(
          'prod-1',
          expect.objectContaining({ stockQuantity: 10 })
        );
      });
    });
  });
});
