import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
});
