import UserBehaviorLog from '../database/models/userBehaviorLogModel';
import UserPreferenceProfile from '../database/models/userPreferenceProfileModel';
import User from '../database/models/userModel';
import UserTrustProfile from '../database/models/userTrustProfileModel';
import Plan from '../database/models/planModel';
import { groqGeneratedData } from './groq.service';
import redis from '../redis/client';
import logger from '../utils/logger';

// Redis cache helpers with safe connection state checks
const CACHE_TTL = 86400; // 24 hours

const getCache = async (key: string): Promise<string | null> => {
    try {
        if (redis.status === 'ready') {
            return await redis.get(key);
        }
    } catch (err) {
        logger.warn(`[Redis Cache GET Error]: ${err instanceof Error ? err.message : String(err)}`);
    }
    return null;
};

const setCache = async (key: string, value: string, ttl: number): Promise<void> => {
    try {
        if (redis.status === 'ready') {
            await redis.setex(key, ttl, value);
        }
    } catch (err) {
        logger.warn(`[Redis Cache SET Error]: ${err instanceof Error ? err.message : String(err)}`);
    }
};

const deleteCache = async (key: string): Promise<void> => {
    try {
        if (redis.status === 'ready') {
            await redis.del(key);
        }
    } catch (err) {
        logger.warn(`[Redis Cache DEL Error]: ${err instanceof Error ? err.message : String(err)}`);
    }
};

/**
 * Pushes a new behavior interaction log to the database.
 */
export const logUserBehavior = async (
    userId: string,
    actionType: 'SEARCH' | 'CLICK' | 'LIKE' | 'BOOK_INTENT',
    metadata: Record<string, any>
) => {
    try {
        if (!userId) return;
        const log = new UserBehaviorLog({
            userId,
            actionType,
            metadata,
            timestamp: new Date()
        });
        await log.save();
        logger.info(`[DigitalTwin] Logged ${actionType} for user ${userId}`);
    } catch (error) {
        logger.error('[DigitalTwin] Error logging user behavior:', error);
    }
};

/**
 * Rebuilds the travel preference profile for a user using GROQ.
 */
export const rebuildPreferenceProfile = async (userId: string) => {
    try {
        logger.info(`[DigitalTwin] Rebuilding preference profile for user: ${userId}`);
        
        // 1. Fetch user logs (limit to last 100 for token efficiency)
        const logs = await UserBehaviorLog.find({ userId })
            .sort({ timestamp: -1 })
            .limit(100);

        if (logs.length === 0) {
            logger.info(`[DigitalTwin] No behavior logs found for user: ${userId}. Skipping rebuild.`);
            return null;
        }

        // 2. Prepare aggregated data for GROQ
        const summarizedLogs = logs.map(log => ({
            action: log.actionType,
            details: log.metadata,
            date: log.timestamp
        }));

        const prompt = `
You are a travel profile analyzer. Based on the following user action logs, analyze the user's travel preferences.

User Activity Logs:
${JSON.stringify(summarizedLogs, null, 2)}

Extract:
1. preferredDestinations (list of destination city/country names, max 5)
2. budgetMin (minimum preferred travel budget in INR, number)
3. budgetMax (maximum preferred travel budget in INR, number)
4. travelStyle (array of styles: "luxury", "budget", "adventure")
5. preferredClimate (array of climates, e.g., "cold", "beach", "tropical", "mountainous")
6. aiPredictionText (a brief, user-friendly 1-2 sentence description explaining what the AI thinks they like)

Return JSON only in this exact structure:
{
  "preferredDestinations": string[],
  "budgetMin": number,
  "budgetMax": number,
  "travelStyle": ("luxury" | "budget" | "adventure")[],
  "preferredClimate": string[],
  "aiPredictionText": string
}
`;

        const groqResponse = await groqGeneratedData(prompt);
        if (!groqResponse) {
            throw new Error('Empty response received from GROQ AI engine.');
        }

        const parsedProfile = JSON.parse(groqResponse);

        // 3. Save to MongoDB
        const profile = await UserPreferenceProfile.findOneAndUpdate(
            { userId },
            {
                preferredDestinations: parsedProfile.preferredDestinations || [],
                budgetRange: {
                    min: parsedProfile.budgetMin ?? 0,
                    max: parsedProfile.budgetMax ?? 1000000
                },
                travelStyle: parsedProfile.travelStyle || [],
                preferredClimate: parsedProfile.preferredClimate || [],
                aiPredictionText: parsedProfile.aiPredictionText || 'You enjoy discovering custom destinations.',
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        // 4. Update Cache
        const cacheKey = `digitalTwin:profile:${userId}`;
        await setCache(cacheKey, JSON.stringify(profile), CACHE_TTL);

        logger.info(`[DigitalTwin] Successfully rebuilt and cached profile for ${userId}`);
        return profile;

    } catch (error) {
        logger.error(`[DigitalTwin] Failed to rebuild preference profile for ${userId}:`, error);
        throw error;
    }
};

/**
 * Retrieves the preference profile of a user (using Redis cache if available).
 */
export const getUserProfile = async (userId: string) => {
    try {
        const cacheKey = `digitalTwin:profile:${userId}`;
        const cached = await getCache(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        let profile = await UserPreferenceProfile.findOne({ userId });
        if (!profile) {
            // Check if user has logs
            const hasLogs = await UserBehaviorLog.exists({ userId });
            if (hasLogs) {
                try {
                    profile = await rebuildPreferenceProfile(userId);
                } catch (e) {
                    logger.error(`[DigitalTwin] Synchronous rebuild failed for user ${userId}:`, e);
                }
            }

            // If still no profile, create and save a default beautiful starting profile
            if (!profile) {
                const userDoc = await User.findOne({ firebaseUid: userId });
                const userCountry = userDoc?.country || 'India';

                profile = await UserPreferenceProfile.findOneAndUpdate(
                    { userId },
                    {
                        preferredDestinations: [userCountry, 'Sikkim', 'Kerala'],
                        budgetRange: { min: 10000, max: 150000 },
                        travelStyle: ['Adventure', 'Nature', 'Culture'],
                        preferredClimate: ['Mountainous', 'Tropical', 'Temperate'],
                        aiPredictionText: 'AdventureNexus is calibrating your Digital Twin. Start exploring, liking, or searching for plans to tailor your recommendations!',
                        lastUpdated: new Date()
                    },
                    { upsert: true, new: true }
                );
            }
        }

        // Cache the profile
        if (profile) {
            await setCache(cacheKey, JSON.stringify(profile), CACHE_TTL);
        }

        return profile;
    } catch (error) {
        logger.error(`[DigitalTwin] Error getting user preference profile:`, error);
        // Fail-safe default profile with nice values
        return {
            userId,
            preferredDestinations: ['India', 'Sikkim', 'Kerala'],
            budgetRange: { min: 10000, max: 150000 },
            travelStyle: ['Adventure', 'Nature', 'Culture'],
            preferredClimate: ['Mountainous', 'Tropical', 'Temperate'],
            aiPredictionText: 'AdventureNexus is calibrating your Digital Twin. Start exploring, liking, or searching for plans to tailor your recommendations!'
        };
    }
};

/**
 * Scores a Travel Plan against a preference profile.
 */
export const scorePlan = (plan: any, profile: any): number => {
    // 1. match(preferredDestinations) * 0.4
    let destinationMatch = 0;
    if (profile.preferredDestinations && profile.preferredDestinations.length > 0) {
        const isMatched = profile.preferredDestinations.some((dest: string) => 
            plan.to && plan.to.toLowerCase().includes(dest.toLowerCase())
        );
        destinationMatch = isMatched ? 1.0 : 0.0;
    }

    // 2. match(budget) * 0.2
    let budgetMatch = 0;
    const planBudget = plan.budget ?? plan.cost ?? 0;
    if (profile.budgetRange) {
        const { min, max } = profile.budgetRange;
        if (planBudget >= min && planBudget <= max) {
            budgetMatch = 1.0;
        } else if (planBudget > 0) {
            // Partial match calculation based on percentage distance
            const mid = (min + max) / 2;
            const diff = Math.abs(planBudget - mid);
            const range = max - min || 1;
            budgetMatch = Math.max(0, 1 - (diff / (range * 2)));
        }
    }

    // 3. match(activityType) * 0.2
    let styleMatch = 0;
    if (profile.travelStyle && profile.travelStyle.length > 0 && plan.travel_style) {
        const isStyleMatched = profile.travelStyle.some((style: string) =>
            plan.travel_style.toLowerCase().includes(style.toLowerCase())
        );
        styleMatch = isStyleMatched ? 1.0 : 0.0;
    }

    // 4. popularityScore * 0.2
    const likes = plan.likesCount ?? 0;
    const popularityScore = Math.min(likes / 100, 1.0); // Scale up to 100 likes max

    // Summing weight values
    const finalScore = 
        (destinationMatch * 0.4) + 
        (budgetMatch * 0.2) + 
        (styleMatch * 0.2) + 
        (popularityScore * 0.2);

    return parseFloat(finalScore.toFixed(3));
};

/**
 * Pulls the smart AI digital twin recommendations for a user.
 */
export const getTwinSuggestions = async (userId: string) => {
    try {
        const profile = await getUserProfile(userId);
        
        // Query active plans in DB
        const plans = await Plan.find({ status: 'active', isFlagged: false }).limit(20);
        
        // Fetch trust scores for creators of these plans
        const creatorUids = plans.map(p => p.firebaseUid).filter(Boolean);
        const trustProfiles = await UserTrustProfile.find({ userId: { $in: creatorUids } }).lean();
        const trustMap = new Map(trustProfiles.map(p => [p.userId, p.trustScore]));
        
        const recommendations = plans.map(plan => {
            let score = scorePlan(plan, profile);
            const creatorTrust = trustMap.get(plan.firebaseUid) ?? 100;
            
            // 🛡️ AI + Digital Twin Visibility: Boost or Penalize based on Creator's Trust Score
            if (creatorTrust >= 80) {
                score *= 1.2; // High trust boost
            } else if (creatorTrust < 30) {
                score = 0; // Extremely low trust: hidden
            } else if (creatorTrust < 50) {
                score *= 0.5; // Moderate risk penalty
            }
            
            return {
                planId: plan._id,
                name: plan.name || plan.to,
                destination: plan.to,
                cost: plan.budget ?? plan.cost ?? 0,
                travelStyle: plan.travel_style || 'Relaxed',
                image: plan.image_url || '',
                score: parseFloat(score.toFixed(3))
            };
        });

        // Filter out zero scores and sort by twin score descending
        const filteredRecs = recommendations
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score);

        return {
            recommendations: filteredRecs.slice(0, 4),
            reason: profile.aiPredictionText || 'AdventureNexus is analyzing your travel footprint.'
        };
    } catch (error) {
        logger.error('[DigitalTwin] Error generating suggestions:', error);
        return {
            recommendations: [],
            reason: 'AdventureNexus is analyzing your travel footprint.'
        };
    }
};

/**
 * Sweeps all users to find profiles that need rebuilding because of new interaction logs.
 */
export const rebuildAllPendingProfiles = async () => {
    try {
        logger.info('[DigitalTwin] Checking for pending profile updates...');
        
        // Get all unique userIds who have behavior logs
        const activeUserIds = await UserBehaviorLog.distinct('userId');
        
        for (const userId of activeUserIds) {
            // Find user's preference profile
            const profile = await UserPreferenceProfile.findOne({ userId });
            
            // Find the latest behavior log for this user
            const latestLog = await UserBehaviorLog.findOne({ userId }).sort({ timestamp: -1 });
            
            if (!latestLog) continue;
            
            // If profile doesn't exist, or if the latest log is newer than the last profile update
            if (!profile || latestLog.timestamp > profile.lastUpdated) {
                logger.info(`[DigitalTwin] Profile for user ${userId} is stale. Rebuilding...`);
                await rebuildPreferenceProfile(userId);
            }
        }
    } catch (error) {
        logger.error('[DigitalTwin] Error in rebuildAllPendingProfiles:', error);
    }
};
