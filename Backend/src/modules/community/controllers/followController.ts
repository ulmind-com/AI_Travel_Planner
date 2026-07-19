import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../../../shared/database/models/userModel';
import logger from '../../../shared/utils/logger';
import { adminAuth } from '../../../shared/config/firebase';

/**
 * Controller to toggle follow/unfollow a user.
 */
export const toggleFollow = async (req: Request, res: Response) => {
    try {
        const { targetFirebaseUid } = req.body;
        const followerFirebaseUid = (req as any).user?.firebaseUid;

        if (!targetFirebaseUid) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Target user ID is required'
            });
        }

        if (targetFirebaseUid === followerFirebaseUid) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'You cannot follow yourself'
            });
        }

        let targetUser = await User.findOne({ firebaseUid: targetFirebaseUid });
        let followerUser = await User.findOne({ firebaseUid: followerFirebaseUid });

        // --- REAL-TIME SYNC FALLBACK ---
        if (!targetUser) {
            try {
                const firebaseUser = await adminAuth.getUser(targetFirebaseUid);
                if (firebaseUser) {
                    targetUser = await User.findOneAndUpdate(
                        { firebaseUid: targetFirebaseUid },
                        {
                            firebaseUid: firebaseUser.uid,
                            email: firebaseUser.email,
                            username: firebaseUser.displayName || `traveler_${firebaseUser.uid.substring(0, 5)}`,
                            firstName: firebaseUser.displayName?.split(' ')[0] || '',
                            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                            fullname: firebaseUser.displayName || 'Traveler',
                            profilepicture: firebaseUser.photoURL,
                        },
                        { upsert: true, new: true }
                    );
                }
            } catch (e) { }
        }

        if (!followerUser && followerFirebaseUid) {
            try {
                const firebaseUser = await adminAuth.getUser(followerFirebaseUid);
                if (firebaseUser) {
                    followerUser = await User.findOneAndUpdate(
                        { firebaseUid: followerFirebaseUid },
                        {
                            firebaseUid: firebaseUser.uid,
                            email: firebaseUser.email,
                            username: firebaseUser.displayName || `traveler_${firebaseUser.uid.substring(0, 5)}`,
                            firstName: firebaseUser.displayName?.split(' ')[0] || '',
                            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                            fullname: firebaseUser.displayName || 'Traveler',
                            profilepicture: firebaseUser.photoURL,
                        },
                        { upsert: true, new: true }
                    );
                }
            } catch (e) { }
        }

        if (!targetUser || !followerUser) {
            logger.warn(`❌ Follow failed: Target(${targetFirebaseUid}:${!!targetUser}) or Follower(${followerFirebaseUid}:${!!followerUser}) not in DB`);
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'User not found in database'
            });
        }

        const isFollowing = followerUser.following?.includes(targetFirebaseUid);

        if (isFollowing) {
            // Unfollow
            await User.findOneAndUpdate(
                { firebaseUid: followerFirebaseUid },
                { $pull: { following: targetFirebaseUid } }
            );
            await User.findOneAndUpdate(
                { firebaseUid: targetFirebaseUid },
                { $pull: { followers: followerFirebaseUid } }
            );

            logger.info(`User ${followerFirebaseUid} unfollowed ${targetFirebaseUid}`);
            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Unfollowed successfully',
                data: { isFollowing: false }
            });
        } else {
            // Follow
            await User.findOneAndUpdate(
                { firebaseUid: followerFirebaseUid },
                { $addToSet: { following: targetFirebaseUid } }
            );
            await User.findOneAndUpdate(
                { firebaseUid: targetFirebaseUid },
                { $addToSet: { followers: followerFirebaseUid } }
            );

            logger.info(`User ${followerFirebaseUid} followed ${targetFirebaseUid}`);

            // Log FOLLOW event for AI Digital Twin
            try {
                const { logUserBehavior } = require('../../../shared/services/digitalTwinEngine');
                logUserBehavior(followerFirebaseUid, 'CLICK', {
                    action: 'FOLLOW',
                    targetFirebaseUid,
                    targetUsername: targetUser.username || ''
                });
            } catch (err) {
                logger.error('Failed to log follow behavior:', err);
            }

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Followed successfully',
                data: { isFollowing: true }
            });
        }
    } catch (error: any) {
        logger.error(`Error toggling follow: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to toggle follow status'
        });
    }
};
