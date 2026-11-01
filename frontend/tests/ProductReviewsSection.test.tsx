import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductReviewsSection } from '../src/components/reviews/ProductReviewsSection';
import { AuthContext, type AuthContextValue } from '../src/context/AuthContext';
import * as reviewService from '../src/services/review-service';
import type { ReviewDto, ReviewListResponseData } from '../src/types';

describe('ProductReviewsSection Component', () => {
  const sampleProductId = 'prod-123';
  const sampleProductName = 'Sacred Lotus Mandala';
  const sampleProductSlug = 'sacred-lotus-mandala';
  const currentUserId = 'user-1';

  const mockReview: ReviewDto = {
    id: 'rev-1',
    productId: sampleProductId,
    userId: currentUserId,
    user: {
      id: currentUserId,
      firstName: 'Ananya',
      lastName: 'Sharma',
    },
    orderId: 'ord-1',
    rating: 5,
    title: 'Breathtaking Mandala',
    body: 'The gold acrylic leaf work and geometry are truly spiritual.',
    status: 'APPROVED',
    isVerifiedPurchase: true,
    createdAt: '2026-10-10T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  };

  const mockReviewList: ReviewListResponseData = {
    reviews: [mockReview],
    summary: {
      averageRating: 5.0,
      totalReviews: 1,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
    },
  };

  const authUser: AuthContextValue = {
    user: {
      id: currentUserId,
      email: 'ananya@example.com',
      firstName: 'Ananya',
      lastName: 'Sharma',
      phone: '9876543210',
      role: 'CUSTOMER',
      createdAt: '2026-10-01T00:00:00.000Z',
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    updateProfile: vi.fn(),
  };

  const guestAuth: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    updateProfile: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderSection = (authContextValue = authUser) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authContextValue}>
          <ProductReviewsSection
            productId={sampleProductId}
            productName={sampleProductName}
            productSlug={sampleProductSlug}
          />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders rating summary, score, and reviews list', async () => {
    vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue(mockReviewList);
    vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
      isEligible: true,
      hasReviewed: true,
      existingReview: mockReview,
    });

    await act(async () => {
      renderSection(authUser);
    });

    expect(screen.getByText('Customer Reviews & Ratings')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.getByText('Based on 1 customer review')).toBeInTheDocument();
    expect(screen.getByText('Breathtaking Mandala')).toBeInTheDocument();
    expect(screen.getByText(/gold acrylic leaf work/i)).toBeInTheDocument();
    expect(screen.getByText('Verified Purchase')).toBeInTheDocument();
  });

  it('renders guest sign-in link when unauthenticated', async () => {
    vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue(mockReviewList);

    await act(async () => {
      renderSection(guestAuth);
    });

    const signInLink = screen.getByRole('link', { name: /Sign In to Review/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', `/login?redirect=/products/${sampleProductSlug}`);
  });

  it('renders verified purchase notice when authenticated customer is not eligible', async () => {
    vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue(mockReviewList);
    vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
      isEligible: false,
      hasReviewed: false,
      existingReview: null,
      reason: 'Only verified purchasers can leave a review.',
    });

    await act(async () => {
      renderSection(authUser);
    });

    expect(
      screen.getByText(/Verified Purchase Only: To ensure authentic artwork impressions/i)
    ).toBeInTheDocument();
  });

  it('displays Write a Review button when eligible and toggles form', async () => {
    vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue(mockReviewList);
    vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
      isEligible: true,
      hasReviewed: false,
      existingReview: null,
    });

    await act(async () => {
      renderSection(authUser);
    });

    const writeButtons = screen.getAllByRole('button', { name: /Write a Review/i });
    expect(writeButtons.length).toBeGreaterThan(0);

    // Click write a review to open form
    await act(async () => {
      fireEvent.click(writeButtons[0]);
    });

    expect(
      screen.getByRole('heading', { name: `Review “${sampleProductName}”` })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Written Review/i)).toBeInTheDocument();
  });

  it('submits review and refreshes review list', async () => {
    vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue(mockReviewList);
    vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
      isEligible: true,
      hasReviewed: false,
      existingReview: null,
    });
    vi.spyOn(reviewService, 'createReview').mockResolvedValue(mockReview);

    await act(async () => {
      renderSection(authUser);
    });

    const writeButtons = screen.getAllByRole('button', { name: /Write a Review/i });
    await act(async () => {
      fireEvent.click(writeButtons[0]);
    });

    const bodyInput = screen.getByLabelText(/Written Review/i);
    await act(async () => {
      fireEvent.change(bodyInput, {
        target: { value: 'Incredible details and deep meditative symmetry!' },
      });
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Review/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(reviewService.createReview).toHaveBeenCalledWith({
      productId: sampleProductId,
      rating: 5,
      title: null,
      body: 'Incredible details and deep meditative symmetry!',
    });

    expect(
      screen.getByText(
        'Your review has been submitted successfully and is awaiting admin moderation.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Your review will appear publicly on the artwork page once it is approved.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/successfully published/i)).not.toBeInTheDocument();
  });

  it('renders empty state when artwork has no reviews yet', async () => {
    vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue({
      reviews: [],
      summary: {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    });
    vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
      isEligible: false,
      hasReviewed: false,
      existingReview: null,
    });

    await act(async () => {
      renderSection(guestAuth);
    });

    expect(screen.getByText('No Reviews Yet')).toBeInTheDocument();
    expect(screen.getByText('No customer reviews yet')).toBeInTheDocument();
  });

  it('allows reviewer to delete their review with confirmation', async () => {
    vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue(mockReviewList);
    vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
      isEligible: true,
      hasReviewed: true,
      existingReview: mockReview,
    });
    vi.spyOn(reviewService, 'deleteReview').mockResolvedValue();

    await act(async () => {
      renderSection(authUser);
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete review/i });
    expect(deleteBtn).toBeInTheDocument();

    // Click delete -> shows confirmation prompt
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(screen.getByText('Delete review?')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: 'Yes' });

    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(reviewService.deleteReview).toHaveBeenCalledWith(mockReview.id);
  });

  describe('Step 25.6: Storefront Customer Feedback & Moderation Status Synchronization', () => {
    const pendingReview: ReviewDto = {
      ...mockReview,
      id: 'rev-pending-1',
      status: 'PENDING',
      title: 'Spiritual Lotus Experience',
      body: 'The canvas quality and brushwork are deeply centering.',
    };

    const rejectedReview: ReviewDto = {
      ...mockReview,
      id: 'rev-rejected-1',
      status: 'REJECTED',
      title: 'Packaging Feedback',
      body: 'Review text rejected due to mentioning shipping damage rather than artwork.',
    };

    it('displays Pending Moderation badge, notice, and preview to the review author', async () => {
      vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue({
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
      vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
        isEligible: true,
        hasReviewed: true,
        existingReview: pendingReview,
      });

      await act(async () => {
        renderSection(authUser);
      });

      expect(screen.getByTestId('author-review-panel')).toBeInTheDocument();
      expect(screen.getByTestId('author-review-status-badge')).toHaveTextContent(
        'Pending Moderation'
      );
      const pendingNotice = screen.getByTestId('author-status-pending-notice');
      expect(pendingNotice).toBeInTheDocument();
      expect(within(pendingNotice).getByText('Awaiting Admin Moderation')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Your review is awaiting admin moderation and is not yet publicly visible/i
        )
      ).toBeInTheDocument();

      // Verify preview of author's pending review content
      expect(screen.getByText('Spiritual Lotus Experience')).toBeInTheDocument();
      expect(
        screen.getByText('The canvas quality and brushwork are deeply centering.')
      ).toBeInTheDocument();
      expect(screen.getByText('5 of 5 stars')).toBeInTheDocument();
    });

    it('displays Approved badge and notice to the review author', async () => {
      vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue(mockReviewList);
      vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
        isEligible: true,
        hasReviewed: true,
        existingReview: mockReview,
      });

      await act(async () => {
        renderSection(authUser);
      });

      expect(screen.getByTestId('author-review-panel')).toBeInTheDocument();
      expect(screen.getByTestId('author-review-status-badge')).toHaveTextContent('Approved');
      expect(screen.getByTestId('author-status-approved-notice')).toBeInTheDocument();
      expect(screen.getByText(/Approved & Publicly Visible/i)).toBeInTheDocument();
    });

    it('displays Not Approved badge, notice, and preview to the review author', async () => {
      vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue({
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
      vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
        isEligible: true,
        hasReviewed: true,
        existingReview: rejectedReview,
      });

      await act(async () => {
        renderSection(authUser);
      });

      expect(screen.getByTestId('author-review-panel')).toBeInTheDocument();
      expect(screen.getByTestId('author-review-status-badge')).toHaveTextContent('Not Approved');
      const rejectedNotice = screen.getByTestId('author-status-rejected-notice');
      expect(rejectedNotice).toBeInTheDocument();
      expect(within(rejectedNotice).getByText('Not Approved')).toBeInTheDocument();
      expect(
        screen.getByText(
          /This review was not approved during moderation and is not publicly visible/i
        )
      ).toBeInTheDocument();

      // Verify preview of author's rejected review content
      expect(screen.getByText('Packaging Feedback')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Review text rejected due to mentioning shipping damage rather than artwork.'
        )
      ).toBeInTheDocument();
    });

    it('ensures pending and rejected reviews remain strictly absent from public reviews list', async () => {
      vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue({
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
      vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
        isEligible: true,
        hasReviewed: true,
        existingReview: pendingReview,
      });

      await act(async () => {
        renderSection(authUser);
      });

      // Public reviews header must show 0
      expect(screen.getByText('All Customer Reviews (0)')).toBeInTheDocument();
      expect(screen.getByText('No Reviews Yet')).toBeInTheDocument();

      // Only 1 instance of the title exists on the entire page (in the author panel preview)
      expect(screen.getAllByText('Spiritual Lotus Experience')).toHaveLength(1);
    });

    it('shows review moderation status only to the authenticated review author', async () => {
      vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue({
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });

      // Another patron who hasn't reviewed
      const otherUserAuth: AuthContextValue = {
        ...authUser,
        user: {
          ...authUser.user!,
          id: 'user-2',
          email: 'other@example.com',
        },
      };

      vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
        isEligible: true,
        hasReviewed: false,
        existingReview: null,
      });

      await act(async () => {
        renderSection(otherUserAuth);
      });

      // Author panel must NOT be visible to other customers
      expect(screen.queryByTestId('author-review-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('author-review-status-badge')).not.toBeInTheDocument();

      // Unauthenticated guest must also NOT see author panel
      await act(async () => {
        renderSection(guestAuth);
      });
      expect(screen.queryByTestId('author-review-panel')).not.toBeInTheDocument();
    });

    it('allows author to edit a pending review and preserves pending moderation status', async () => {
      vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue({
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
      vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
        isEligible: true,
        hasReviewed: true,
        existingReview: pendingReview,
      });

      const updatedPendingReview: ReviewDto = {
        ...pendingReview,
        rating: 4,
        body: 'Updated text with additional insights on the color harmony.',
      };
      const updateSpy = vi
        .spyOn(reviewService, 'updateReview')
        .mockResolvedValue(updatedPendingReview);

      await act(async () => {
        renderSection(authUser);
      });

      const editBtn = screen.getByRole('button', { name: /Edit Your Review/i });
      await act(async () => {
        fireEvent.click(editBtn);
      });

      // Verify edit form opened with existing review data
      expect(
        screen.getByRole('heading', { name: /Edit Your Artwork Review/i })
      ).toBeInTheDocument();
      const bodyInput = screen.getByLabelText(/Written Review/i);
      expect(bodyInput).toHaveValue(pendingReview.body);

      // Modify body and submit
      await act(async () => {
        fireEvent.change(bodyInput, {
          target: { value: 'Updated text with additional insights on the color harmony.' },
        });
      });

      const updateSubmitBtn = screen.getByRole('button', { name: /Update Review/i });
      await act(async () => {
        fireEvent.click(updateSubmitBtn);
      });

      expect(updateSpy).toHaveBeenCalledWith(pendingReview.id, {
        rating: 5,
        title: 'Spiritual Lotus Experience',
        body: 'Updated text with additional insights on the color harmony.',
      });

      expect(screen.getByText('Your review has been successfully updated.')).toBeInTheDocument();
      expect(
        screen.getByText('Your review remains awaiting admin moderation before public display.')
      ).toBeInTheDocument();
    });

    it('allows author to delete their pending review from author panel and refreshes eligibility', async () => {
      vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue({
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });

      const eligibilitySpy = vi
        .spyOn(reviewService, 'checkReviewEligibility')
        .mockResolvedValueOnce({
          isEligible: true,
          hasReviewed: true,
          existingReview: pendingReview,
        })
        .mockResolvedValueOnce({
          isEligible: true,
          hasReviewed: false,
          existingReview: null,
        });

      const deleteSpy = vi.spyOn(reviewService, 'deleteReview').mockResolvedValue();

      await act(async () => {
        renderSection(authUser);
      });

      const authorDeleteBtn = screen.getByTestId('author-delete-button');
      await act(async () => {
        fireEvent.click(authorDeleteBtn);
      });

      expect(screen.getByText('Delete review?')).toBeInTheDocument();
      const confirmBtn = screen.getByRole('button', { name: 'Yes' });

      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      expect(deleteSpy).toHaveBeenCalledWith(pendingReview.id);
      expect(screen.getByText('Your review has been removed.')).toBeInTheDocument();
      expect(eligibilitySpy).toHaveBeenCalledTimes(2);

      // After deletion, Write a Review button is restored for eligible customer
      expect(screen.getAllByRole('button', { name: /Write a Review/i }).length).toBeGreaterThan(0);
      expect(screen.queryByTestId('author-review-panel')).not.toBeInTheDocument();
    });

    it('failed submission displays form error and does not show success feedback', async () => {
      vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue(mockReviewList);
      vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
        isEligible: true,
        hasReviewed: false,
        existingReview: null,
      });
      vi.spyOn(reviewService, 'createReview').mockRejectedValue(
        new Error('You have already submitted a review for this product.')
      );

      await act(async () => {
        renderSection(authUser);
      });

      const writeButtons = screen.getAllByRole('button', { name: /Write a Review/i });
      await act(async () => {
        fireEvent.click(writeButtons[0]);
      });

      const bodyInput = screen.getByLabelText(/Written Review/i);
      await act(async () => {
        fireEvent.change(bodyInput, {
          target: { value: 'Valid review content about mandala meditation.' },
        });
      });

      const submitBtn = screen.getByRole('button', { name: /Submit Review/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Verify form error is displayed inside the form
      expect(
        screen.getByText('You have already submitted a review for this product.')
      ).toBeInTheDocument();

      // Success feedback must NOT be present
      expect(
        screen.queryByText(
          'Your review has been submitted successfully and is awaiting admin moderation.'
        )
      ).not.toBeInTheDocument();

      // Form remains visible
      expect(screen.getByRole('button', { name: /Submit Review/i })).toBeInTheDocument();
    });

    it('prevents duplicate submissions with disabled button state while submitting', async () => {
      vi.spyOn(reviewService, 'fetchProductReviews').mockResolvedValue(mockReviewList);
      vi.spyOn(reviewService, 'checkReviewEligibility').mockResolvedValue({
        isEligible: true,
        hasReviewed: false,
        existingReview: null,
      });

      let resolveSubmission!: () => void;
      const pendingSubmission = new Promise<ReviewDto>(resolve => {
        resolveSubmission = () => resolve(pendingReview);
      });
      vi.spyOn(reviewService, 'createReview').mockReturnValue(pendingSubmission);

      await act(async () => {
        renderSection(authUser);
      });

      const writeButtons = screen.getAllByRole('button', { name: /Write a Review/i });
      await act(async () => {
        fireEvent.click(writeButtons[0]);
      });

      const bodyInput = screen.getByLabelText(/Written Review/i);
      await act(async () => {
        fireEvent.change(bodyInput, {
          target: { value: 'Valid review text that is being processed.' },
        });
      });

      const submitBtn = screen.getByRole('button', { name: /Submit Review/i });
      expect(submitBtn).not.toBeDisabled();

      // Trigger submit (starts async submission)
      fireEvent.click(submitBtn);

      // While submitting, button is disabled
      expect(submitBtn).toBeDisabled();

      // Resolve submission
      await act(async () => {
        resolveSubmission();
      });

      expect(
        screen.getByText(
          'Your review has been submitted successfully and is awaiting admin moderation.'
        )
      ).toBeInTheDocument();
    });
  });
});
