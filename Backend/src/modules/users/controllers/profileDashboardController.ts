import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../../../shared/database/models/userModel';
import CommunityPost from '../../../shared/database/models/communityPostModel';
import ExperiencePost from '../../../shared/database/models/experiencePostModel';
import CommunityComment from '../../../shared/database/models/communityCommentModel';
import ExperienceComment from '../../../shared/database/models/experienceCommentModel';
import GroupMembership from '../../../shared/database/models/groupMembershipModel';
import logger from '../../../shared/utils/logger';

const getUserByFirebaseUidWithSync = async (firebaseUid: string) => {
    let user = await User.findOne({ firebaseUid });
    // JIT Provisioning handles Firebase sync in the protect middleware before reaching controllers.
    return user;
};

/**
 * ── 1. GET DYNAMIC PROFILE & CALCULATED STATS ──
 */
export const getUserDashboardProfile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { firebaseUid } = req.params;
        if (!firebaseUid) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Firebase User ID is required' });
        }

        const user = await getUserByFirebaseUidWithSync(firebaseUid);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
        }

        // Parallel counts for high performance
        const [postsCount, experiencesCount, communityCommentsCount, experienceCommentsCount, likedCommunityPosts, likedExperiencePosts, groupsCount] = await Promise.all([
            CommunityPost.countDocuments({ firebaseUid }),
            ExperiencePost.countDocuments({ firebaseUid }),
            CommunityComment.countDocuments({ firebaseUid }),
            ExperienceComment.countDocuments({ firebaseUid }),
            CommunityPost.countDocuments({ likes: firebaseUid }),
            ExperiencePost.countDocuments({ likes: firebaseUid }),
            GroupMembership.countDocuments({ userId: user._id })
        ]);

        const totalComments = communityCommentsCount + experienceCommentsCount;
        const totalLikedPosts = likedCommunityPosts + likedExperiencePosts;

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                profile: {
                    _id: user._id,
                    firebaseUid: user.firebaseUid,
                    email: user.email,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullname: user.fullname || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Traveler',
                    profilepicture: user.profilepicture,
                    coverImage: user.coverImage || '',
                    bio: user.bio || '',
                    gender: user.gender || '',
                    country: user.country || '',
                    phonenumber: user.phonenumber || '',
                    preferences: user.preferences || [],
                    isPrivate: user.isPrivate || false,
                    socialLinks: user.socialLinks || {},
                    followersCount: user.followers?.length || 0,
                    followingCount: user.following?.length || 0,
                    createdAt: user.createdAt
                },
                stats: {
                    postsCount,
                    experiencesCount,
                    commentsCount: totalComments,
                    likedPostsCount: totalLikedPosts,
                    groupsCount
                }
            }
        });
    } catch (error: any) {
        logger.error('Error fetching dashboard profile stats:', error);
        next(error);
    }
};

/**
 * ── 2. GET USER POSTS ──
 */
export const getUserDashboardPosts = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { firebaseUid } = req.params;
        const posts = await CommunityPost.find({ firebaseUid })
            .populate('userId', 'username fullname profilepicture')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(StatusCodes.OK).json({ success: true, data: posts });
    } catch (error: any) {
        logger.error('Error fetching user dashboard posts:', error);
        next(error);
    }
};

/**
 * ── 3. GET USER EXPERIENCES ──
 */
export const getUserDashboardExperiences = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { firebaseUid } = req.params;
        const experiences = await ExperiencePost.find({ firebaseUid })
            .populate('userId', 'username fullname profilepicture')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(StatusCodes.OK).json({ success: true, data: experiences });
    } catch (error: any) {
        logger.error('Error fetching user dashboard experiences:', error);
        next(error);
    }
};

/**
 * ── 4. GET USER COMMENTS ──
 */
export const getUserDashboardComments = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { firebaseUid } = req.params;
        
        // Find community comments
        const commComments = await CommunityComment.find({ firebaseUid })
            .populate('postId', 'title content')
            .sort({ createdAt: -1 })
            .lean();

        // Map type flag
        const mappedComm = commComments.map(c => ({
            ...c,
            postType: 'community',
            postTitle: (c.postId as any)?.title || 'Community Post'
        }));

        return res.status(StatusCodes.OK).json({ success: true, data: mappedComm });
    } catch (error: any) {
        logger.error('Error fetching user dashboard comments:', error);
        next(error);
    }
};

/**
 * ── 5. GET USER LIKED POSTS ──
 */
export const getUserDashboardLikes = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { firebaseUid } = req.params;
        
        // Find community posts liked by this user
        const likedComm = await CommunityPost.find({ likes: firebaseUid })
            .populate('userId', 'username fullname profilepicture')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(StatusCodes.OK).json({ success: true, data: likedComm });
    } catch (error: any) {
        logger.error('Error fetching user dashboard likes:', error);
        next(error);
    }
};

/**
 * ── 6. GET USER GROUPS ──
 */
export const getUserDashboardGroups = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { firebaseUid } = req.params;
        const user = await getUserByFirebaseUidWithSync(firebaseUid);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
        }

        const groups = await GroupMembership.find({ userId: user._id })
            .populate('groupId', 'name description image membersCount')
            .lean();

        return res.status(StatusCodes.OK).json({ success: true, data: groups });
    } catch (error: any) {
        logger.error('Error fetching user dashboard groups:', error);
        next(error);
    }
};
