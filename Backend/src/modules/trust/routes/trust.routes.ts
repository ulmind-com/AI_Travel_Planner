import express from 'express';
import { getUserTrustProfile } from '../controllers/trustController';

const router = express.Router();

// GET /api/v1/trust/:userId
router.get('/:userId', getUserTrustProfile);

export default router;
