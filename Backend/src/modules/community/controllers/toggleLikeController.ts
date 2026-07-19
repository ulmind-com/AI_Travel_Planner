import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import CommunityPost from '../../../shared/database/models/communityPostModel';
import CommunityComment from '../../../shared/database/models/communityCommentModel';
import logger from '../../../shared/utils/logger';
import { logUserBehavior } from '../../../shared/services/digitalTwinEngine';

/**
 * Controller to toggle like on a post or comment.
 */
export const toggleLike = async (req: Request, res: Response) => {
    try {
        const { targetType, targetId } = req.body;
        const firebaseUid = (req as any).user?.firebaseUid;

        if (!firebaseUid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        let target: any;
        if (targetType === 'post') {
            target = await CommunityPost.findById(targetId);
        } else if (targetType === 'comment') {
            target = await CommunityComment.findById(targetId);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid target type'
            });
        }

        if (!target) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Target not found'
            });
        }

        const likeIndex = target.likes.indexOf(firebaseUid);
        if (likeIndex > -1) {
            // Unlike
            target.likes.splice(likeIndex, 1);
        } else {
            // Like
            target.likes.push(firebaseUid);

            // Log LIKE event for AI Digital Twin
            logUserBehavior(firebaseUid, 'LIKE', {
                targetType,
                targetId,
                title: target.title || target.text || ''
            });

            // Send notification
            const { createAndSendNotification } = await import('../../../shared/utils/notificationHelper');
            const { NotificationType } = await import('../../../shared/database/models/notificationModel');
            
            // Only notify if it's not the user liking their own content
            if (target.firebaseUid && target.firebaseUid !== firebaseUid) {
                createAndSendNotification({
                    recipientFirebaseUid: target.firebaseUid,
                    senderFirebaseUid: firebaseUid!,
                    type: NotificationType.LIKE_POST,
                    relatedId: targetType === 'post' ? targetId : undefined
                });
            }

            // Track activity
            try {
                const { trackActivity } = await import('../../../shared/utils/activityTracker');
                await trackActivity(firebaseUid!, 'like_given', targetId);
            } catch (err) {
                logger.error('Failed to track like_given activity:', err);
            }
        }

        await target.save();

        // Real-time broadcast
        import('../../../shared/socket/socket').then(({ broadcastRealtimeEvent }) => {
            broadcastRealtimeEvent('community:like', {
                targetType,
                targetId,
                likes: target.likes,
                firebaseUid
            });
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                likes: target.likes,
                liked: likeIndex === -1
            }
        });
    } catch (error: any) {
        logger.error(`Error toggling like: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to process like'
        });
    }
};
