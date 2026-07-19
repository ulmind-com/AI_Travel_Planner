import ActivityLog, { ActivityType } from '../database/models/activityLogModel';
import logger from './logger';

/**
 * Utility to log granular user actions.
 */
export const trackActivity = async (firebaseUid: string, activityType: ActivityType, targetId: string) => {
    try {
        if (!firebaseUid || !targetId) return;

        await ActivityLog.create({
            firebaseUid,
            activityType,
            targetId
        });
        logger.info(`Activity tracked: User ${firebaseUid} completed ${activityType} on target ${targetId}`);
    } catch (error: any) {
        logger.error(`Error tracking activity: ${error.message}`);
    }
};
export { ActivityType };
