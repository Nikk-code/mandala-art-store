import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminReviewsPage } from '@/pages/admin/AdminReviewsPage';
import * as adminService from '@/services/admin-service';
import type { AdminReviewDto, AdminProductDto } from '@/types';

// Mock useAuth context
vi.mock('@/context', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      email: 'admin@mandala.test',
      firstName: 'Meera',
      lastName: 'Deshmukh',
      role: 'ADMIN',
    },
    logout: vi.fn(),
  }),
}));

describe('AdminReviewsPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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
      images: [],
    },
  ];

  const mockReviews: AdminReviewDto[] = [
    {
      id: 'rev-pending-1',
      productId: 'prod-1',
      product: {
        id: 'prod-1',
        name: 'Sacred Lotus Mandala',
        slug: 'sacred-lotus-mandala',
        sku: 'MND-LOTUS-01',
      },
      userId: 'user-1',
      user: {
        id: 'user-1',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@example.com',
      },
      customer: {
        id: 'user-1',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@example.com',
      },
      orderId: 'order-uuid-1',
      rating: 5,
      title: 'Breathtaking Detail',
      body: 'The gold acrylic work on the lotus petals is stunning in person.',
      status: 'PENDING',
      isVerifiedPurchase: true,
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-15T10:00:00.000Z',
    },
    {
      id: 'rev-approved-2',
      productId: 'prod-1',
      product: {
        id: 'prod-1',
        name: 'Sacred Lotus Mandala',
        slug: 'sacred-lotus-mandala',
        sku: 'MND-LOTUS-01',
      },
      userId: 'user-2',
      user: {
        id: 'user-2',
        firstName: 'Rohan',
        lastName: 'Verma',
        email: 'rohan@example.com',
      },
      customer: {
        id: 'user-2',
        firstName: 'Rohan',
        lastName: 'Verma',
        email: 'rohan@example.com',
      },
      orderId: null,
      rating: 4,
      title: 'Wonderful Gift',
      body: 'Gave this to my sister for Diwali, she loved the packaging.',
      status: 'APPROVED',
      isVerifiedPurchase: false,
      createdAt: '2026-10-14T14:30:00.000Z',
      updatedAt: '2026-10-14T15:00:00.000Z',
    },
  ];

  function renderPage() {
    return render(
      <MemoryRouter>
        <AdminReviewsPage />
      </MemoryRouter>
    );
  }

  it('renders page header, filters, and customer review items', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: mockReviews,
      pagination: { page: 1, pageSize: 15, totalItems: 2, totalPages: 1 },
    });

    renderPage();

    expect(screen.getByRole('heading', { name: /Review Moderation/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
      expect(screen.getByText('Wonderful Gift')).toBeInTheDocument();
    });

    // Verify reviewer identity and product info
    expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
    expect(screen.getByText('priya@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('SKU: MND-LOTUS-01')).toHaveLength(2);
    expect(screen.getByText(/Verified Purchase/i)).toBeInTheDocument();

    // Verify status badges inside review cards
    const pendingCard = screen.getByTestId('review-card-rev-pending-1');
    expect(within(pendingCard).getByText('Pending Moderation')).toBeInTheDocument();

    const approvedCard = screen.getByTestId('review-card-rev-approved-2');
    expect(within(approvedCard).getByText('Approved')).toBeInTheDocument();
  });

  it('filters reviews by moderation status', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    const fetchSpy = vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: [mockReviews[0]],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/Moderation Status/i)).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/Moderation Status/i);
    fireEvent.change(statusSelect, { target: { value: 'PENDING' } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
          page: 1,
        })
      );
    });
  });

  it('filters reviews by search query', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    const fetchSpy = vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: [mockReviews[0]],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/Search Reviews/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/Search Reviews/i);
    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    const searchButton = screen.getByRole('button', { name: /^Search$/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Priya',
          page: 1,
        })
      );
    });
  });

  it('filters reviews by product selection', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    const fetchSpy = vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: mockReviews,
      pagination: { page: 1, pageSize: 15, totalItems: 2, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/Artwork \/ Product/i)).toBeInTheDocument();
    });

    const productSelect = screen.getByLabelText(/Artwork \/ Product/i);
    fireEvent.change(productSelect, { target: { value: 'prod-1' } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-1',
          page: 1,
        })
      );
    });
  });

  it('sorts reviews by selected sort option', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    const fetchSpy = vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: mockReviews,
      pagination: { page: 1, pageSize: 15, totalItems: 2, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/Sort Order/i)).toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText(/Sort Order/i);
    fireEvent.change(sortSelect, { target: { value: 'rating_desc' } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'rating_desc',
          page: 1,
        })
      );
    });
  });

  it('clears active filters when Clear all filters is clicked', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    const fetchSpy = vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: mockReviews,
      pagination: { page: 1, pageSize: 15, totalItems: 2, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/Moderation Status/i)).toBeInTheDocument();
    });

    // Set filter to show Clear button
    fireEvent.change(screen.getByLabelText(/Moderation Status/i), {
      target: { value: 'PENDING' },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Clear all filters/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Clear all filters/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          search: undefined,
          status: undefined,
          productId: undefined,
          sort: 'newest',
        })
      );
    });
  });

  it('approves a pending review and displays success feedback', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: [mockReviews[0]],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });
    const updateSpy = vi.spyOn(adminService, 'updateAdminReviewStatus').mockResolvedValue({
      ...mockReviews[0],
      status: 'APPROVED',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', {
      name: /Approve review for Sacred Lotus Mandala/i,
    });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('rev-pending-1', { status: 'APPROVED' });
    });

    await waitFor(() => {
      expect(screen.getByText(/was approved/i)).toBeInTheDocument();
    });
  });

  it('rejects an approved review and displays success feedback', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: [mockReviews[1]],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });
    const updateSpy = vi.spyOn(adminService, 'updateAdminReviewStatus').mockResolvedValue({
      ...mockReviews[1],
      status: 'REJECTED',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Wonderful Gift')).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', {
      name: /Reject review for Sacred Lotus Mandala/i,
    });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('rev-approved-2', { status: 'REJECTED' });
    });

    await waitFor(() => {
      expect(screen.getByText(/was rejected/i)).toBeInTheDocument();
    });
  });

  it('handles delete flow: cancel does not delete, confirm deletes review', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: [mockReviews[0]],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });
    const deleteSpy = vi.spyOn(adminService, 'deleteAdminReview').mockResolvedValue();

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', {
      name: /Delete review for Sacred Lotus Mandala/i,
    });
    fireEvent.click(deleteButton);

    // Modal appears
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Delete Customer Review/i)).toBeInTheDocument();
    });

    // Test Cancel
    const cancelButton = screen.getByRole('button', { name: /^Cancel$/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteSpy).not.toHaveBeenCalled();

    // Reopen and Confirm Delete
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /^Confirm Delete$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('rev-pending-1');
    });

    await waitFor(() => {
      expect(screen.getByText(/was permanently deleted/i)).toBeInTheDocument();
      expect(screen.queryByText('Breathtaking Detail')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no reviews match', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 15, totalItems: 0, totalPages: 0 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/No reviews found/i)).toBeInTheDocument();
    });
  });

  it('shows error state with retry button on API failure', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    const fetchSpy = vi
      .spyOn(adminService, 'fetchAdminReviews')
      .mockRejectedValueOnce(new Error('Network error loading reviews'))
      .mockResolvedValueOnce({
        items: mockReviews,
        pagination: { page: 1, pageSize: 15, totalItems: 2, totalPages: 1 },
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Network error loading reviews')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /^Retry$/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
    });
  });

  it('handles action errors without falsely displaying success', async () => {
    vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
      items: [mockReviews[0]],
      pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(adminService, 'updateAdminReviewStatus').mockRejectedValue(
      new Error('Forbidden: Administrative privileges revoked')
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', {
      name: /Approve review for Sacred Lotus Mandala/i,
    });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText('Forbidden: Administrative privileges revoked')).toBeInTheDocument();
      expect(screen.queryByText(/was approved/i)).not.toBeInTheDocument();
    });
  });

  describe('Delete Dialog Accessibility & Focus Management', () => {
    it('moves keyboard focus into the dialog when opened', async () => {
      vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
        items: mockProducts,
        pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
      });
      vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
        items: [mockReviews[0]],
        pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /Delete review for Sacred Lotus Mandala/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Cancel$/i })).toHaveFocus();
      });
    });

    it('dismisses delete dialog on Escape key without deleting', async () => {
      vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
        items: mockProducts,
        pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
      });
      vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
        items: [mockReviews[0]],
        pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
      });
      const deleteSpy = vi.spyOn(adminService, 'deleteAdminReview').mockResolvedValue();

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /Delete review for Sacred Lotus Mandala/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('restores focus to delete trigger button when dialog closes', async () => {
      vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
        items: mockProducts,
        pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
      });
      vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
        items: [mockReviews[0]],
        pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /Delete review for Sacred Lotus Mandala/i,
      });
      deleteButton.focus();
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /^Cancel$/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(deleteButton).toHaveFocus();
      });
    });

    it('contains keyboard focus within dialog when Tab or Shift+Tab is pressed', async () => {
      vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
        items: mockProducts,
        pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
      });
      vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
        items: [mockReviews[0]],
        pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /Delete review for Sacred Lotus Mandala/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /^Cancel$/i });
      const confirmButton = screen.getByRole('button', { name: /^Confirm Delete$/i });

      // Tab from last focusable element wraps to first
      confirmButton.focus();
      expect(confirmButton).toHaveFocus();
      fireEvent.keyDown(window, { key: 'Tab' });
      expect(cancelButton).toHaveFocus();

      // Shift+Tab from first focusable element wraps to last
      cancelButton.focus();
      expect(cancelButton).toHaveFocus();
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      expect(confirmButton).toHaveFocus();
    });
  });

  describe('Pagination After Deletion & Edge Cases', () => {
    it('navigates to previous valid page when final item on a page is deleted', async () => {
      vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
        items: mockProducts,
        pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
      });

      const fetchSpy = vi.spyOn(adminService, 'fetchAdminReviews');
      // Mount on page 2 where page 2 has 1 item
      fetchSpy.mockResolvedValueOnce({
        items: [mockReviews[1]],
        pagination: { page: 2, pageSize: 1, totalItems: 2, totalPages: 2 },
      });
      // Second load after deletion reloads page 1
      fetchSpy.mockResolvedValueOnce({
        items: [mockReviews[0]],
        pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
      });

      const deleteSpy = vi.spyOn(adminService, 'deleteAdminReview').mockResolvedValue();

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Wonderful Gift')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /Delete review for Sacred Lotus Mandala/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^Confirm Delete$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('rev-approved-2');
      });

      // Automatically transitions to page 1 and loads page 1 review
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
        expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
      });
    });

    it('handles deleting the only remaining review and displays empty state', async () => {
      vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
        items: mockProducts,
        pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
      });
      vi.spyOn(adminService, 'fetchAdminReviews').mockResolvedValue({
        items: [mockReviews[0]],
        pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
      });
      const deleteSpy = vi.spyOn(adminService, 'deleteAdminReview').mockResolvedValue();

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /Delete review for Sacred Lotus Mandala/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^Confirm Delete$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('rev-pending-1');
      });

      await waitFor(() => {
        expect(screen.getByText(/No reviews found/i)).toBeInTheDocument();
        expect(screen.queryByText('Breathtaking Detail')).not.toBeInTheDocument();
      });
    });
  });

  describe('Rapid Filter Changes & Request Sequencing', () => {
    it('prevents stale out-of-order responses from overwriting newer filter results', async () => {
      vi.spyOn(adminService, 'fetchAdminProducts').mockResolvedValue({
        items: mockProducts,
        pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
      });

      let resolveRequest1!: (value: unknown) => void;
      let resolveRequest2!: (value: unknown) => void;

      const request1Promise = new Promise(resolve => {
        resolveRequest1 = resolve;
      });
      const request2Promise = new Promise(resolve => {
        resolveRequest2 = resolve;
      });

      vi.spyOn(adminService, 'fetchAdminReviews')
        // Initial mount call
        .mockResolvedValueOnce({
          items: mockReviews,
          pagination: { page: 1, pageSize: 15, totalItems: 2, totalPages: 1 },
        })
        // Request 1 (status: PENDING)
        .mockReturnValueOnce(
          request1Promise as unknown as ReturnType<typeof adminService.fetchAdminReviews>
        )
        // Request 2 (status: APPROVED)
        .mockReturnValueOnce(
          request2Promise as unknown as ReturnType<typeof adminService.fetchAdminReviews>
        );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Breathtaking Detail')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/Moderation Status/i);

      // Trigger Request 1 (PENDING)
      fireEvent.change(statusSelect, { target: { value: 'PENDING' } });

      // Immediately trigger Request 2 (APPROVED) before Request 1 finishes
      fireEvent.change(statusSelect, { target: { value: 'APPROVED' } });

      // Resolve Request 2 FIRST with approved reviews
      resolveRequest2({
        items: [mockReviews[1]],
        pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
      });

      await waitFor(() => {
        expect(screen.getByText('Wonderful Gift')).toBeInTheDocument();
      });

      // Now resolve Request 1 AFTER Request 2 with pending reviews
      resolveRequest1({
        items: [mockReviews[0]],
        pagination: { page: 1, pageSize: 15, totalItems: 1, totalPages: 1 },
      });

      // Verify Request 1 was discarded and Request 2 results (Wonderful Gift) remain displayed
      await waitFor(() => {
        expect(screen.getByText('Wonderful Gift')).toBeInTheDocument();
        expect(screen.queryByText('Breathtaking Detail')).not.toBeInTheDocument();
      });
    });
  });
});
