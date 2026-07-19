import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import UserTrustProfile from '../../../shared/database/models/userTrustProfileModel';
import ContentModerationLog from '../../../shared/database/models/contentModerationLogModel';
import User from '../../../shared/database/models/userModel';
import Review from '../../../shared/database/models/reviewModel';
import CommunityPost from '../../../shared/database/models/communityPostModel';
import ExperienceComment from '../../../shared/database/models/experienceCommentModel';
import { recalculateUserTrustScore } from '../../../shared/services/trustEngine';
import logger from '../../../shared/utils/logger';
import redis from '../../../shared/redis/client';

/**
 * GET /api/v1/trust/:userId
 * Retrieves or generates a user's Dynamic Trust Profile.
 */
export const getUserTrustProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'User ID is required' });
        }

        const cacheKey = `trust:profile:${userId}`;
        try {
            if (redis.status === 'ready') {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    return res.status(StatusCodes.OK).json({
                        success: true,
                        data: JSON.parse(cached)
                    });
                }
            }
        } catch (cacheErr) {
            logger.warn(`[TrustController] Redis GET failed for user ${userId}:`, cacheErr);
        }

        let profile = await UserTrustProfile.findOne({ userId });
        if (!profile) {
            // Generate trust profile dynamically on first request
            const score = await recalculateUserTrustScore(userId);
            profile = await UserTrustProfile.findOne({ userId });
        }

        if (profile) {
            try {
                if (redis.status === 'ready') {
                    await redis.setex(cacheKey, 300, JSON.stringify(profile)); // Cache for 5 mins
                }
            } catch (cacheErr) {
                logger.warn(`[TrustController] Redis SET failed for user ${userId}:`, cacheErr);
            }
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            data: profile || {
                userId,
                trustScore: 100,
                toxicityScore: 0,
                spamScore: 0,
                reportCount: 0,
                fakeReviewScore: 0,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        logger.error('Error fetching user trust profile:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/v1/admin/flagged-content
 * Retrieves all AI-moderated content logs flagged as toxic/spam/etc.
 */
export const getFlaggedContent = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const flaggedLogs = await ContentModerationLog.find({ status: 'flagged' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ContentModerationLog.countDocuments({ status: 'flagged' });

        return res.status(StatusCodes.OK).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: flaggedLogs
        });
    } catch (error) {
        logger.error('Error fetching flagged content:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/v1/admin/ban-user/:id
 * Bans or unbans a user and sets their trust score to 0.
 */
export const adminBanUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isBanned, banReason } = req.body;

        const user = await User.findOne({ firebaseUid: id }) || await User.findById(id);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
        }

        user.isBanned = isBanned !== false;
        user.banReason = banReason || 'Violated AdventureNexus community standards.';
        await user.save();

        // Drop trust score to 0 on ban, or restore on unban
        let trust = await UserTrustProfile.findOne({ userId: user.firebaseUid });
        if (!trust) {
            trust = new UserTrustProfile({ userId: user.firebaseUid });
        }
        trust.trustScore = user.isBanned ? 0 : 80;
        trust.lastUpdated = new Date();
        await trust.save();

        // 🕒 Invalidate Redis cache
        try {
            if (redis.status === 'ready') {
                await redis.del(`trust:profile:${user.firebaseUid}`);
            }
        } catch (cacheErr) {
            logger.warn(`[TrustController] Redis DEL failed in adminBanUser for ${user.firebaseUid}:`, cacheErr);
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
            data: { isBanned: user.isBanned, trustScore: trust.trustScore }
        });
    } catch (error) {
        logger.error('Error banning user:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/v1/admin/reduce-trust/:userId
 * Manually reduces or overrides a user's trust score.
 */
export const adminReduceTrustScore = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { penaltyAmount, reason } = req.body;

        const amount = parseInt(penaltyAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid penalty amount' });
        }

        let profile = await UserTrustProfile.findOne({ userId });
        if (!profile) {
            profile = new UserTrustProfile({ userId });
        }

        profile.reportCount = (profile.reportCount || 0) + Math.round(amount / 5);
        profile.trustScore = Math.max(0, profile.trustScore - amount);
        profile.lastUpdated = new Date();
        await profile.save();

        // 🕒 Invalidate Redis cache
        try {
            if (redis.status === 'ready') {
                await redis.del(`trust:profile:${userId}`);
            }
        } catch (cacheErr) {
            logger.warn(`[TrustController] Redis DEL failed in adminReduceTrustScore for ${userId}:`, cacheErr);
        }

        logger.info(`[TrustEngine] Admin penalized user ${userId} by ${amount} points. Reason: ${reason}`);

        return res.status(StatusCodes.OK).json({ success: true, data: profile });
    } catch (error) {
        logger.error('Error penalizing trust score:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * DELETE /api/v1/admin/content/:logId
 * Deletes flagged content from the platform database and resolves the moderation log.
 */
export const adminDeleteContent = async (req: Request, res: Response) => {
    try {
        const { logId } = req.params;

        const log = await ContentModerationLog.findById(logId);
        if (!log) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Moderation log not found' });
        }

        // Delete the matching document in collection
        if (log.type === 'POST') {
            await CommunityPost.findByIdAndDelete(log.contentId);
        } else if (log.type === 'COMMENT') {
            await ExperienceComment.findByIdAndDelete(log.contentId);
        } else if (log.type === 'REVIEW') {
            await Review.findByIdAndDelete(log.contentId);
        }

        log.status = 'deleted';
        await log.save();

        // Penalize the author trust score
        await recalculateUserTrustScore(log.authorId);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Flagged content deleted successfully from database',
            data: log
        });
    } catch (error) {
        logger.error('Error deleting flagged content:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/v1/admin/risky-users
 * Returns a list of users with low trust scores, enriched with profile details.
 */
export const getRiskyUsers = async (req: Request, res: Response) => {
    try {
        const profiles = await UserTrustProfile.find({ trustScore: { $lt: 80 } })
            .sort({ trustScore: 1 })
            .limit(50)
            .lean();

        const uids = profiles.map(p => p.userId);
        const users = await User.find({ firebaseUid: { $in: uids } }).lean();
        const userMap = new Map(users.map(u => [u.firebaseUid, u]));

        const enriched = profiles.map(profile => {
            const user = userMap.get(profile.userId);
            return {
                ...profile,
                username: user?.username || user?.fullname || 'Traveler',
                email: user?.email || 'N/A',
                profilepicture: user?.profilepicture || '',
                isBanned: user?.isBanned || false
            };
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            data: enriched
        });
    } catch (error) {
        logger.error('Error fetching risky users:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

