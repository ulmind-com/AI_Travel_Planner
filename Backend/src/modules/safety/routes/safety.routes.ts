import express from 'express';
import {
    getAlerts,
    reportAlert,
    addContact,
    getContacts,
    deleteContact,
    shareLocation,
    getLiveLocation,
    triggerSOS
} from '../controllers/safety.controller';
import protect from '../../../shared/middleware/firebaseAuthMiddleware';

const router = express.Router();

/**
 * @route GET /api/v1/safety/alerts
 * @desc Get nearby or general safety alerts
 */
router.get('/alerts', getAlerts);

/**
 * @route POST /api/v1/safety/alerts/report
 * @desc Report a new safety/incident alert
 */
router.post('/alerts/report', protect, reportAlert);

/**
 * @route POST /api/v1/safety/contacts
 * @desc Add an emergency contact
 */
router.post('/contacts', protect, addContact);

/**
 * @route GET /api/v1/safety/contacts
 * @desc Get user's emergency contacts
 */
router.get('/contacts', protect, getContacts);

/**
 * @route DELETE /api/v1/safety/contacts/:contactId
 * @desc Delete an emergency contact
 */
router.delete('/contacts/:contactId', protect, deleteContact);

/**
 * @route POST /api/v1/safety/share-location
 * @desc Update live sharing coordinates
 */
router.post('/share-location', protect, shareLocation);

/**
 * @route GET /api/v1/safety/track/:userId
 * @desc Retrieve current live location of another user
 */
router.get('/track/:userId', protect, getLiveLocation);

/**
 * @route POST /api/v1/safety/sos
 * @desc SOS Panic trigger
 */
router.post('/sos', protect, triggerSOS);

export default router;
