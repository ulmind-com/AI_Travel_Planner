import Notification, { NotificationType } from '../database/models/notificationModel';
import User from '../database/models/userModel';
import { sendRealtimeNotification } from '../socket/socket';
import logger from './logger';

interface CreateNotificationParams {
    recipientFirebaseUid: string;
    senderFirebaseUid: string;
    type: NotificationType;
    relatedId?: string;
}

/**
 * Creates, saves, enriches with sender profile, and sends a real-time notification to the recipient.
 */
export const createAndSendNotification = async (params: CreateNotificationParams) => {
    try {
        // Prevent sending notification to oneself
        if (params.recipientFirebaseUid === params.senderFirebaseUid) {
            return null;
        }

        // Save to DB
        const notification = await Notification.create({
            recipientFirebaseUid: params.recipientFirebaseUid,
            senderFirebaseUid: params.senderFirebaseUid,
            type: params.type,
            relatedId: params.relatedId,
            isRead: false
        });

        // Fetch sender details
        const sender = await User.findOne({ firebaseUid: params.senderFirebaseUid })
            .select('username profilepicture fullname');

        const enrichedNotification = {
            ...notification.toObject(),
            sender: sender ? {
                username: sender.username,
                profilepicture: sender.profilepicture,
                fullname: sender.fullname
            } : { username: 'Someone', profilepicture: '', fullname: 'Someone' }
        };

        // Send via Socket.io
        sendRealtimeNotification(params.recipientFirebaseUid, enrichedNotification);

        return enrichedNotification;
    } catch (error: any) {
        logger.error(`Error in createAndSendNotification: ${error.message}`);
        return null;
    }
};
