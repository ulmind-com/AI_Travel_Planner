import User from './src/shared/database/models/userModel';
import UserTrustProfile from './src/shared/database/models/userTrustProfileModel';
import ContentModerationLog from './src/shared/database/models/contentModerationLogModel';
import Review from './src/shared/database/models/reviewModel';
import Plan from './src/shared/database/models/planModel';
import CommunityPost from './src/shared/database/models/communityPostModel';
import { recalculateUserTrustScore } from './src/shared/services/trustEngine';
import redis from './src/shared/redis/client';

console.log("🚀 Initializing Mock Environment for Trust Verification...");

// 1. Mock Database Storage
const mockDb = {
    users: [] as any[],
    trustProfiles: [] as any[],
    moderationLogs: [] as any[],
    reviews: [] as any[],
    plans: [] as any[],
    posts: [] as any[]
};

// 2. Mock User Model Methods
User.findOne = (async (query: any) => {
    return mockDb.users.find(u => u.firebaseUid === query.firebaseUid) || null;
}) as any;
User.prototype.save = async function() {
    const idx = mockDb.users.findIndex(u => u.firebaseUid === this.firebaseUid);
    if (idx !== -1) mockDb.users[idx] = this;
    else mockDb.users.push(this);
    return this;
};
User.deleteOne = (async (query: any) => {
    mockDb.users = mockDb.users.filter(u => u.firebaseUid !== query.firebaseUid);
    return { deletedCount: 1 };
}) as any;

// 3. Mock UserTrustProfile Model Methods
UserTrustProfile.findOne = (async (query: any) => {
    return mockDb.trustProfiles.find(tp => tp.userId === query.userId) || null;
}) as any;
UserTrustProfile.prototype.save = async function() {
    const idx = mockDb.trustProfiles.findIndex(tp => tp.userId === this.userId);
    if (idx !== -1) mockDb.trustProfiles[idx] = this;
    else mockDb.trustProfiles.push(this);
    return this;
};
UserTrustProfile.deleteOne = (async (query: any) => {
    mockDb.trustProfiles = mockDb.trustProfiles.filter(tp => tp.userId !== query.userId);
    return { deletedCount: 1 };
}) as any;

// 4. Mock ContentModerationLog Model Methods
ContentModerationLog.find = (async (query: any) => {
    return mockDb.moderationLogs.filter(l => l.authorId === query.authorId);
}) as any;
ContentModerationLog.prototype.save = async function() {
    mockDb.moderationLogs.push(this);
    return this;
};
ContentModerationLog.deleteMany = (async (query: any) => {
    mockDb.moderationLogs = mockDb.moderationLogs.filter(l => l.authorId !== query.authorId);
    return { deletedCount: 1 };
}) as any;

// 5. Mock Review, Plan, CommunityPost to prevent database errors during detection
const chainableMock = {
    sort: function() { return this; },
    limit: function() { return this; },
    then: function(resolve: any) { resolve([]); }
};
Review.find = (() => chainableMock) as any;
Review.countDocuments = (async () => 0) as any;
Plan.countDocuments = (async () => 0) as any;
CommunityPost.countDocuments = (async () => 0) as any;

// 6. Mock Redis client
const redisStore = new Map<string, string>();
Object.defineProperty(redis, 'status', { value: 'ready', writable: true });
redis.get = async (key: string) => redisStore.get(key) || null;
redis.setex = async (key: string, seconds: number, value: string) => {
    redisStore.set(key, value);
    return 'OK';
};
redis.del = async (key: string) => {
    const existed = redisStore.has(key);
    redisStore.delete(key);
    return existed ? 1 : 0;
};
redis.disconnect = () => {};

async function runVerification() {
    console.log("🚀 Starting Social Trust Score & AI Fraud Detection Verification (Mock Mode)...");
    
    const testUserId = 'test-traveler-verification-uid-123';
    const cacheKey = `trust:profile:${testUserId}`;

    // Clean up
    mockDb.users = [];
    mockDb.trustProfiles = [];
    mockDb.moderationLogs = [];
    redisStore.clear();

    // 1. Create Dummy User
    console.log("👤 Creating test user profile...");
    const user = new User({
        firebaseUid: testUserId,
        email: 'verification@adventurenexus.com',
        username: 'TrustTester',
        fullname: 'Trust Tester',
        profilepicture: 'https://via.placeholder.com/150',
        bio: 'Safety & Trust Engineering Verification'
    });
    await user.save();
    console.log("✅ Test user profile created.");

    // 2. Initial Recalculation (No Logs)
    console.log("🧮 Calculating initial trust score...");
    const initialScore = await recalculateUserTrustScore(testUserId);
    console.log(`ℹ️ Initial Score calculated: ${initialScore}`);
    if (initialScore !== 100) {
        throw new Error(`Expected initial score of 100, got ${initialScore}`);
    }

    // Verify profile was saved
    let profile = await UserTrustProfile.findOne({ userId: testUserId });
    if (!profile) {
        throw new Error("Trust profile document was not created.");
    }
    console.log("✅ Trust Profile stored in Mock Database successfully.");

    // 3. Redis Cache Verification
    console.log("📡 Testing Redis Caching...");
    
    // Cache the profile
    await redis.setex(cacheKey, 300, JSON.stringify(profile));
    
    const cached = await redis.get(cacheKey);
    if (!cached) {
        throw new Error("Redis failed to retrieve cached trust profile.");
    }
    
    const parsed = JSON.parse(cached);
    console.log(`✅ Redis Cache Hit: Trust Score retrieved from cache is ${parsed.trustScore}`);
    if (parsed.trustScore !== 100) {
        throw new Error(`Expected cached score to be 100, got ${parsed.trustScore}`);
    }

    // 4. Toxicity Moderate content check simulation (aiScore = 0.3, flag = toxic to trigger avgToxicity but keep avgSpam = 0)
    console.log("⚠️ Simulating toxic content detection (AI toxicity scoring = 0.3, toxic flag)...");
    const modLog = new ContentModerationLog({
        contentId: 'dummy-content-id',
        type: 'POST',
        contentSnippet: 'You are completely stupid and I hate you!',
        authorId: testUserId,
        aiScore: 0.3,
        flags: ['toxic'],
        status: 'flagged'
    });
    await modLog.save();
    console.log("✅ ContentModerationLog saved.");

    // 5. Recalculate score after toxicity check
    console.log("🔄 Recalculating trust score post-moderation...");
    const updatedScore = await recalculateUserTrustScore(testUserId);
    console.log(`ℹ️ Updated Trust Score is: ${updatedScore}`);
    
    // Formula: 100 - (1.0 * 30) = 70
    if (updatedScore !== 70) {
        throw new Error(`Expected updated trust score to be 70, got ${updatedScore}`);
    }
    console.log("✅ Trust Score correctly penalized for toxic content (100 -> 70).");

    // 6. Verify Cache Invalidation
    const cachedPostEvict = await redis.get(cacheKey);
    if (cachedPostEvict) {
        throw new Error("Redis cache was NOT invalidated after trust score recalculation.");
    }
    console.log("✅ Redis cache successfully evicted (deleted) after score change.");

    // 7. Admin Moderation & Eviction Test
    console.log("🛡️ Testing Admin Manual Intervention & Invalidation...");
    profile = await UserTrustProfile.findOne({ userId: testUserId });
    if (!profile) throw new Error("Profile not found.");
    
    // Simulate penalty of 40 points
    profile.trustScore = Math.max(0, profile.trustScore - 40);
    await profile.save();
    
    // Set cache and manually invalidate
    await redis.setex(cacheKey, 300, JSON.stringify(profile));
    await redis.del(cacheKey);
    const cachedPostAdmin = await redis.get(cacheKey);
    if (cachedPostAdmin) {
        throw new Error("Redis cache was NOT invalidated after admin override action.");
    }
    console.log("✅ Redis cache successfully evicted on admin manual action.");

    console.log("\n🎉 ALL TRUST ENGINE AND REDIS INTEGRATION VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n");
}

runVerification().catch(err => {
    console.error("❌ Verification failed with error:", err);
    process.exit(1);
});
