import UserTrustProfile from '../database/models/userTrustProfileModel';
import ContentModerationLog from '../database/models/contentModerationLogModel';
import Review from '../database/models/reviewModel';
import User from '../database/models/userModel';
import Plan from '../database/models/planModel';
import CommunityPost from '../database/models/communityPostModel';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import redis from '../redis/client';
import { moderateContent } from './moderationEngine';


/**
 * Helper to resolve user document via Firebase UID or MongoDB ObjectId.
 */
const findUserByIdentifier = async (userId: string) => {
    let user = await User.findOne({ firebaseUid: userId });
    if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
    }
    return user;
};

/**
 * Helper to calculate Jaccard text similarity between two strings.
 */
const calculateJaccardSimilarity = (str1: string, str2: string): number => {
    const getWords = (s: string) => new Set(s.toLowerCase().match(/\b\w+\b/g) || []);
    const words1 = getWords(str1);
    const words2 = getWords(str2);
    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
};

/**
 * Detects fake reviews for a user based on text patterns, frequency, and rating distribution.
 */
export const detectFakeReviews = async (userId: string): Promise<number> => {
    try {
        const reviews = await Review.find({ userId }).sort({ createdAt: -1 }).limit(10);
        if (reviews.length === 0) return 0;

        let similarityScore = 0;
        let frequencyScore = 0;
        let ratingAbuseScore = 0;

        // 1. Similarity Check (same text patterns between reviews)
        if (reviews.length > 1) {
            let matches = 0;
            let totalPairs = 0;
            for (let i = 0; i < reviews.length; i++) {
                for (let j = i + 1; j < reviews.length; j++) {
                    totalPairs++;
                    const sim = calculateJaccardSimilarity(reviews[i].comment || '', reviews[j].comment || '');
                    if (sim > 0.6) matches++;
                }
            }
            similarityScore = totalPairs > 0 ? matches / totalPairs : 0;
        }

        // 2. Frequency Check (multiple reviews written in past 10 minutes)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentCount = await Review.countDocuments({
            userId,
            createdAt: { $gte: tenMinutesAgo }
        });
        if (recentCount >= 4) frequencyScore = 0.8;
        else if (recentCount >= 2) frequencyScore = 0.4;

        // 3. Rating Abuse Check (always 5 stars or always 1 star)
        if (reviews.length >= 3) {
            const ratings = reviews.map(r => r.rating);
            const allSame = ratings.every(val => val === ratings[0]);
            if (allSame && (ratings[0] === 5 || ratings[0] === 1)) {
                ratingAbuseScore = 0.7;
            }
        }

        // Aggregate scores (capped at 1.0)
        return Math.min(1.0, similarityScore * 0.4 + frequencyScore * 0.3 + ratingAbuseScore * 0.3);
    } catch (err) {
        logger.error('[TrustEngine] Failed fake review analysis:', err);
        return 0;
    }
};

/**
 * Detects bot-like behaviors for a user.
 */
export const detectBotBehavior = async (userId: string): Promise<number> => {
    try {
        const user = await findUserByIdentifier(userId);
        if (!user) return 0.5; // default suspicion if user not found

        let botScore = 0;

        // 1. Profile completeness signal
        const hasAvatar = !!user.profilepicture;
        const hasBio = !!user.bio;
        if (!hasAvatar && !hasBio) {
            botScore += 0.3;
        }

        // 2. High activity signal (plans created in the last 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // Handle queries safely with either ObjectId or string UID using resolved user fields
        const planConditions: any = { 
            createdAt: { $gte: oneHourAgo },
            $or: [
                { userId: user._id },
                { firebaseUid: user.firebaseUid }
            ]
        };
        const planActivity = await Plan.countDocuments(planConditions);
        
        // 3. High post activity (community posts in the last 1 hour)
        const postConditions: any = { 
            createdAt: { $gte: oneHourAgo },
            $or: [
                { userId: user._id },
                { firebaseUid: user.firebaseUid }
            ]
        };
        const postActivity = await CommunityPost.countDocuments(postConditions);

        const totalActions = planActivity + postActivity;
        if (totalActions > 15) botScore += 0.6;
        else if (totalActions > 8) botScore += 0.3;

        return Math.min(1.0, botScore);
    } catch (err) {
        logger.error('[TrustEngine] Failed bot behavior check:', err);
        return 0;
    }
};

/**
 * Recalculate user trust score and update profile database records.
 */
export const recalculateUserTrustScore = async (userId: string): Promise<number> => {
    try {
        let profile = await UserTrustProfile.findOne({ userId });
        if (!profile) {
            profile = new UserTrustProfile({ userId });
        }

        // 1. Retrieve AI Moderation Logs
        const logs = await ContentModerationLog.find({ authorId: userId });
        
        let avgToxicity = 0;
        let avgSpam = 0;

        if (logs.length > 0) {
            const toxicLogs = logs.filter(l => l.flags.includes('toxic') || l.aiScore > 0.4);
            const spamLogs = logs.filter(l => l.flags.includes('spam') || l.aiScore > 0.4);
            avgToxicity = toxicLogs.length / logs.length;
            avgSpam = spamLogs.length / logs.length;
        }

        // 2. Fetch Fake Review Analysis
        const fakeReviewScore = await detectFakeReviews(userId);

        // 3. Fetch Bot Suspicions
        const botSpamFactor = await detectBotBehavior(userId);
        
        // Combine AI logs spam with bot signals
        const finalSpamScore = Math.min(1.0, avgSpam * 0.6 + botSpamFactor * 0.4);

        // 4. Update Profile Scores
        profile.toxicityScore = parseFloat(avgToxicity.toFixed(2));
        profile.spamScore = parseFloat(finalSpamScore.toFixed(2));
        profile.fakeReviewScore = parseFloat(fakeReviewScore.toFixed(2));

        // 5. Formula: trustScore = 100 - (toxicityScore * 30) - (spamScore * 20) - (reportCount * 5) - (fakeReviewScore * 20)
        const rawScore = 100 
            - (profile.toxicityScore * 30) 
            - (profile.spamScore * 20) 
            - (profile.reportCount * 5) 
            - (profile.fakeReviewScore * 20);

        // Clamp between 0 - 100
        profile.trustScore = Math.max(0, Math.min(100, Math.round(rawScore)));
        profile.lastUpdated = new Date();

        await profile.save();

        // 🕒 Invalidate Redis cache
        try {
            if (redis.status === 'ready') {
                await redis.del(`trust:profile:${userId}`);
            }
        } catch (cacheErr) {
            logger.warn(`[TrustEngine] Redis invalidation failed for ${userId}:`, cacheErr);
        }

        if (profile.trustScore < 30) {
            logger.warn(`[TrustEngine] Warning: User ${userId} has high risk profile. Trust score: ${profile.trustScore}`);
        }

        return profile.trustScore;
    } catch (err) {
        logger.error('[TrustEngine] Failed trust score recalculation:', err);
        return 100;
    }
};

/**
 * Non-blocking background hook to perform AI content moderation, log the event,
 * and dynamically recalculate user trust profiles.
 */
export const triggerContentModeration = (
    contentId: string,
    type: 'POST' | 'COMMENT' | 'REVIEW',
    authorId: string,
    text: string
): void => {
    // Process asynchronously without blocking main response thread
    Promise.resolve().then(async () => {
        try {
            logger.info(`[TrustEngine] Running async AI moderation for ${type} (ID: ${contentId}) by ${authorId}`);
            
            // 1. Moderate content via GROQ
            const moderation = await moderateContent(text);
            
            // 2. Save Moderation Log
            const log = new ContentModerationLog({
                contentId,
                type,
                contentSnippet: text.slice(0, 150),
                authorId,
                aiScore: Math.max(moderation.toxicityScore, moderation.spamScore),
                flags: moderation.flags,
                status: moderation.flags.length > 0 ? 'flagged' : 'approved'
            });
            await log.save();

            // 3. Recalculate dynamic Trust Profile
            const newScore = await recalculateUserTrustScore(authorId);
            logger.info(`[TrustEngine] Recalculated trust score for ${authorId}: ${newScore}`);

        } catch (error) {
            logger.error(`[TrustEngine] Async moderation hook failed for ${type} (ID: ${contentId}):`, error);
        }
    });
};

