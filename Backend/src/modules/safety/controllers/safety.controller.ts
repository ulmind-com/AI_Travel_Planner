import { Request, Response } from 'express';
import SafetyAlert from '../../../shared/database/models/safetyAlertModel';
import EmergencyContact from '../../../shared/database/models/emergencyContactModel';
import LocationTracking from '../../../shared/database/models/locationTrackingModel';
import User from '../../../shared/database/models/userModel';
import { getIO } from '../../../shared/socket/socket';
import logger from '../../../shared/utils/logger';

/**
 * Get active safety alerts near a location or globally
 */
export const getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { location, lat, lng, radius } = req.query;

        let query: any = {};

        if (location) {
            query.location = { $regex: new RegExp(location as string, 'i') };
        }

        // If coordinates provided, filter by distance range
        if (lat && lng) {
            const latitude = parseFloat(lat as string);
            const longitude = parseFloat(lng as string);
            const rad = parseFloat(radius as string) || 50; // km

            // Simple latitude/longitude bounding box calculation as fallback for indexing
            const kmPerDegree = 111;
            const deltaLat = rad / kmPerDegree;
            const deltaLng = rad / (kmPerDegree * Math.cos(latitude * (Math.PI / 180)));

            query['coordinates.lat'] = { $gte: latitude - deltaLat, $lte: latitude + deltaLat };
            query['coordinates.lng'] = { $gte: longitude - deltaLng, $lte: longitude + deltaLng };
        }

        const alerts = await SafetyAlert.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, alerts });
    } catch (error) {
        logger.error('Error fetching safety alerts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch safety alerts' });
    }
};

/**
 * Report a new safety alert
 */
export const reportAlert = async (req: Request, res: Response): Promise<void> => {
    try {
        const { location, coordinates, type, severity, message } = req.body;

        if (!location || !type || !severity || !message) {
            res.status(400).json({ success: false, message: 'Missing required safety alert fields' });
            return;
        }

        const alert = await SafetyAlert.create({
            location,
            coordinates,
            type,
            severity,
            message
        });

        // Broadcast alert in real-time via Socket.IO
        try {
            const io = getIO();
            if (io) {
                io.emit('safety:alert', alert);
            }
        } catch (socketErr) {
            logger.warn('Socket emit safety:alert warning: ' + socketErr);
        }

        res.status(201).json({ success: true, alert });
    } catch (error) {
        logger.error('Error reporting safety alert:', error);
        res.status(500).json({ success: false, message: 'Failed to report safety alert' });
    }
};

/**
 * Add an emergency contact
 */
export const addContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, phone, relation } = req.body;
        const userId = (req as any).user._id;

        if (!name || !phone || !relation) {
            res.status(400).json({ success: false, message: 'Missing contact details' });
            return;
        }

        const contact = await EmergencyContact.create({
            userId,
            name,
            phone,
            relation
        });

        res.status(201).json({ success: true, contact });
    } catch (error) {
        logger.error('Error adding contact:', error);
        res.status(500).json({ success: false, message: 'Failed to add emergency contact' });
    }
};

/**
 * Get user's emergency contacts
 */
export const getContacts = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const contacts = await EmergencyContact.find({ userId });
        res.status(200).json({ success: true, contacts });
    } catch (error) {
        logger.error('Error getting emergency contacts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch emergency contacts' });
    }
};

/**
 * Remove an emergency contact
 */
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const { contactId } = req.params;
        const userId = (req as any).user._id;

        const result = await EmergencyContact.findOneAndDelete({ _id: contactId, userId });
        if (!result) {
            res.status(404).json({ success: false, message: 'Contact not found or unauthorized' });
            return;
        }

        res.status(200).json({ success: true, message: 'Contact removed' });
    } catch (error) {
        logger.error('Error deleting contact:', error);
        res.status(500).json({ success: false, message: 'Failed to delete emergency contact' });
    }
};

/**
 * Share/Update live location tracking status
 */
export const shareLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lat, lng, isActiveSharing } = req.body;
        const userId = (req as any).user._id;

        if (lat === undefined || lng === undefined) {
            res.status(400).json({ success: false, message: 'Missing lat or lng coordinates' });
            return;
        }

        const tracking = await LocationTracking.findOneAndUpdate(
            { userId },
            {
                lat,
                lng,
                isActiveSharing: isActiveSharing !== undefined ? isActiveSharing : true,
                timestamp: new Date()
            },
            { upsert: true, new: true }
        );

        // Notify followers/group members about updated location if active
        if (tracking.isActiveSharing) {
            try {
                const io = getIO();
                if (io) {
                    io.emit(`location:update:${userId}`, {
                        userId,
                        lat,
                        lng,
                        timestamp: tracking.timestamp
                    });
                }
            } catch (socketErr) {
                logger.warn('Socket location update error: ' + socketErr);
            }
        }

        res.status(200).json({ success: true, tracking });
    } catch (error) {
        logger.error('Error sharing location:', error);
        res.status(500).json({ success: false, message: 'Failed to share location' });
    }
};

/**
 * Track another user's live location (if active)
 */
export const getLiveLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const tracking = await LocationTracking.findOne({ userId, isActiveSharing: true })
            .populate('userId', 'username fullname profilepicture');

        if (!tracking) {
            res.status(404).json({ success: false, message: 'Live location not active or sharing disabled' });
            return;
        }

        res.status(200).json({ success: true, tracking });
    } catch (error) {
        logger.error('Error getting live location:', error);
        res.status(500).json({ success: false, message: 'Failed to get live location' });
    }
};

/**
 * SOS Panic Button trigger
 */
export const triggerSOS = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        // Fetch emergency contacts
        const contacts = await EmergencyContact.find({ userId });

        // Retrieve current location (if any)
        const location = await LocationTracking.findOne({ userId });

        const sosAlert = {
            userId,
            user: {
                username: user.username,
                fullname: user.fullname,
                phone: (user as any).phone || 'Not provided'
            },
            location: location ? { lat: location.lat, lng: location.lng } : null,
            timestamp: new Date()
        };

        // Broadcast SOS event via socket
        try {
            const io = getIO();
            if (io) {
                // Broadcast to admins or nearby users
                io.emit('safety:sos', sosAlert);
                
                // Specifically notify emergency contacts if they have firebase UID mapped
                contacts.forEach(async (c) => {
                    // Look up contact user by phone if registered
                    const contactUser = await User.findOne({ phone: c.phone });
                    if (contactUser && contactUser.firebaseUid) {
                        io.emit(`safety:sos:${contactUser.firebaseUid}`, sosAlert);
                    }
                });
            }
        } catch (socketErr) {
            logger.warn('Socket SOS broadcast warning: ' + socketErr);
        }

        res.status(200).json({
            success: true,
            message: 'SOS Alert triggered successfully. Emergency contacts notified.',
            contactsNotified: contacts.length,
            location: sosAlert.location
        });
    } catch (error) {
        logger.error('Error triggering SOS:', error);
        res.status(500).json({ success: false, message: 'Failed to trigger SOS alert' });
    }
};
