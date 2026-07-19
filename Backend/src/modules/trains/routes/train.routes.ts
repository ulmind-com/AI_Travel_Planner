import { Router } from 'express';
import {
    searchStations,
    searchTrains,
    getTrainSchedule,
    getTrainLiveStatus,
    bookTicket,
    getMyBookings,
    cancelBooking
} from '../controllers/train.controller';
import protect from '../../../shared/middleware/firebaseAuthMiddleware';

const router = Router();

// ── Public Routes (no auth required) ──────────────────────────────────────────
router.get('/stations/search', searchStations);
router.get('/search', searchTrains);
router.get('/schedule/:trainNumber', getTrainSchedule);
router.get('/live/:trainNumber', getTrainLiveStatus);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.post('/book', protect, bookTicket);
router.get('/bookings/mine', protect, getMyBookings);
router.delete('/bookings/:id/cancel', protect, cancelBooking);

export default router;
