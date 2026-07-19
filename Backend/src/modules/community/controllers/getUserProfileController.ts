import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../../../shared/database/models/userModel';
import CommunityPost from '../../../shared/database/models/communityPostModel';
import TravelStory from '../../../shared/database/models/travelStoryModel';
import logger from '../../../shared/utils/logger';
import { adminAuth } from '../../../shared/config/firebase';

/**
 * Controller to fetch a user's public profile and activity.
 */
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { firebaseUid } = req.params;
        const requestingUserFirebaseUid = (req as any).user?.firebaseUid;

        if (!firebaseUid) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'User ID is required'
            });
        }

        let user = await User.findOne({ firebaseUid });

        // --- REAL-TIME SYNC FALLBACK ---
        // If user not in DB, fetch from Firebase and sync
        if (!user) {
            logger.info(`🔍 User ${firebaseUid} not found in DB, attempting sync from Firebase...`);
            try {
                const firebaseUser = await adminAuth.getUser(firebaseUid);
                if (firebaseUser) {
                    user = await User.findOneAndUpdate(
                        { firebaseUid },
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
                    logger.info(`✅ Synced missing user ${firebaseUid} to database.`);
                }
            } catch (firebaseError: any) {
                logger.error(`❌ Firebase sync failed: ${firebaseError.message}`);
            }
        }

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        // Fetch user's community posts
        const posts = await CommunityPost.find({ firebaseUid })
            .sort({ createdAt: -1 })
            .limit(10);

        // Fetch user's travel stories (blogs)
        const stories = await TravelStory.find({ firebaseUid })
            .sort({ createdAt: -1 })
            .limit(10);

        // Fetch user's saved plans
        const savedPlans = await User.findOne({ firebaseUid })
            .populate('plans')
            .then(u => u?.plans || []);

        // Check if the requesting user is following this user
        const isFollowing = requestingUserFirebaseUid
            ? user.followers?.includes(requestingUserFirebaseUid)
            : false;

        // Better name derivation for profile
        const fullname = user.fullname || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Traveler';

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                profile: {
                    firebaseUid: user.firebaseUid,
                    username: user.username,
                    fullname,
                    profilepicture: user.profilepicture,
                    bio: user.bio || '',
                    coverImage: user.coverImage || '',
                    country: user.country || '',
                    phonenumber: user.phonenumber,
                    gender: user.gender || '',
                    preferences: user.preferences || [],
                    followersCount: user.followers?.length || 0,
                    followingCount: user.following?.length || 0,
                    isFollowing,
                    createdAt: user.createdAt
                },
                activity: {
                    posts,
                    stories,
                    savedPlans
                }
            }
        });
    } catch (error: any) {
        logger.error(`Error fetching user profile: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};
