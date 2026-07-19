import { Router } from 'express';
import { getTravelIntel } from './travelIntelController';

const router = Router();

/**
 * @route GET /api/v1/travel/intel
 * @desc Get real-time weather, crowd levels, risks and AI suggestions for a destination
 * @access Public/Private
 */
router.get('/intel', getTravelIntel);

export default router;
