import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/review.controller';

const router = Router();

// Public: Retrieve approved reviews and rating summary for a product
router.get('/product/:productId', getProductReviews);

// Authenticated: Eligibility check, create, edit, delete
router.get('/eligibility/:productId', requireAuth, checkReviewEligibility);
router.post('/', requireAuth, createReview);
router.put('/:reviewId', requireAuth, updateReview);
router.delete('/:reviewId', requireAuth, deleteReview);

export default router;
