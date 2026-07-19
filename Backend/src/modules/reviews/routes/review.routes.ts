import express from 'express';
import { getAllReviews, createReview, likeReview } from '../controllers/reviewController';
import { cacheMiddleware } from '../../../shared/middleware/cacheMiddleware';
import { CACHE_CONFIG } from '../../../shared/config/cache.config';
import { protect } from '../../../shared/middleware/firebaseAuthMiddleware';
import { checkBanned } from '../../../shared/middleware/checkBannedMiddleware';

const router = express.Router();

router.get('/', cacheMiddleware({ prefix: CACHE_CONFIG.PREFIX.REVIEWS }), getAllReviews);
router.post('/', protect, checkBanned, createReview);
router.put('/:id/like', likeReview);

export default router;
