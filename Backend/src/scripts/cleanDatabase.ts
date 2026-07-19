/**
 * AdventureNexus - Database Cleanup Script
 * =========================================
 * Run before presentation to clean test/junk data.
 * KEEPS: Users, Plans
 * REMOVES: Messages, Conversations, Logs, Expenses, Groups, etc.
 *
 * Run with: npx ts-node src/scripts/cleanDatabase.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const DB_URI = process.env.DB_URI!;

const KEEP_COLLECTIONS = ['users', 'plans', 'reviews'];

// All collections to clean
const CLEAN_MAP: { collection: string; description: string; keepUsers?: boolean }[] = [
    // ── Messages & Conversations ──────────────────────────
    { collection: 'messages',          description: '💬 All chat messages (E2EE ciphertexts)' },
    { collection: 'conversations',     description: '💬 All conversation threads' },
    { collection: 'groupmessages',     description: '💬 All group chat messages' },

    // ── Groups & Memberships ──────────────────────────────
    { collection: 'groups',            description: '👥 All travel groups' },
    { collection: 'groupmemberships',  description: '👥 All group memberships' },

    // ── Expenses & Balances ──────────────────────────────
    { collection: 'groupexpenses',     description: '💰 All group expenses' },
    { collection: 'expenseitems',      description: '💰 All expense items / splits' },
    { collection: 'userbalances',      description: '💰 All user balance records' },

    // ── Community & Social ────────────────────────────────
    { collection: 'communityposts',    description: '📰 All community posts' },
    { collection: 'communitycomments', description: '📰 All community comments' },
    { collection: 'communityevents',   description: '📰 All community events' },
    { collection: 'communityspotlights', description: '📰 All community spotlights' },
    { collection: 'communities',       description: '📰 All communities' },
    { collection: 'travelstories',     description: '📰 All travel stories' },

    // ── Friendships & Social Graph ────────────────────────
    { collection: 'friendships',       description: '🤝 All friendship records' },
    { collection: 'notifications',     description: '🔔 All notifications' },

    // ── Logs & Telemetry ──────────────────────────────────
    { collection: 'activitylogs',      description: '📋 All activity logs' },
    { collection: 'apilogs',           description: '📋 All API logs' },
    { collection: 'auditlogs',         description: '📋 All audit logs' },
    { collection: 'emaillogs',         description: '📋 All email logs' },
    { collection: 'userbehaviorlogs',  description: '📋 All user behavior logs' },
    { collection: 'contentmoderationlogs', description: '📋 All moderation logs' },
    { collection: 'moderationreports', description: '📋 All moderation reports' },

    // ── Recommendations & Tracking ────────────────────────
    { collection: 'recommendationhistories', description: '🤖 All recommendation histories' },
    { collection: 'recommendations',   description: '🤖 All recommendation records' },
    { collection: 'locationtrackings', description: '📍 All location tracking data' },

    // ── Reviews ──────────────────────────────────────────
    { collection: 'reviews',           description: '⭐ All travel reviews' },

    // ── Bookings ──────────────────────────────────────────
    { collection: 'bookings',          description: '🏨 All hotel bookings' },
    { collection: 'experiencebookings', description: '🎯 All experience bookings' },
    { collection: 'trainbookings',     description: '🚂 All train bookings' },

    // ── Safety & Emergency ────────────────────────────────
    { collection: 'safetyalerts',      description: '🚨 All safety alerts' },
    { collection: 'emergencycontacts', description: '🚨 All emergency contacts' },

    // ── Misc ──────────────────────────────────────────────
    { collection: 'subscribemails',    description: '📧 All newsletter subscriptions' },
    { collection: 'contacts',          description: '📧 All contact form submissions' },
    { collection: 'chathistories',     description: '🤖 All AI chat histories' },
];

// ── User fields to RESET (not delete users) ──────────────
const USER_FIELDS_TO_RESET = {
    plans: [],
    likedPlans: [],
    followers: [],
    following: [],
    savedPosts: [],
    isBanned: false,
    banReason: '',
    onlineStatus: 'offline',
};

async function cleanDatabase() {
    console.log('\n🚀 AdventureNexus - Database Cleanup Starting...');
    console.log('='.repeat(55));
    console.log(`📦 Database: ${DB_URI.split('/').pop()}`);
    console.log('✅ KEEPING  : users, plans only');
    console.log('🗑️  REMOVING : messages, reviews, logs, expenses, groups & more');
    console.log('='.repeat(55));
    console.log('⏳ Connecting to MongoDB Atlas (may take 30-60s if cluster was paused)...');

    await mongoose.connect(DB_URI, {
        serverSelectionTimeoutMS: 60000,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
    });
    console.log('\n✅ Connected to MongoDB Atlas\n');

    const db = mongoose.connection.db!;
    let totalDeleted = 0;

    for (const item of CLEAN_MAP) {
        try {
            const result = await db.collection(item.collection).deleteMany({});
            const count = result.deletedCount;
            totalDeleted += count;
            if (count > 0) {
                console.log(`🗑️  Cleaned [${item.collection}] → ${count} docs removed  (${item.description})`);
            } else {
                console.log(`⬜ Empty   [${item.collection}] → already clean`);
            }
        } catch (err: any) {
            console.log(`⚠️  Skipped [${item.collection}] → ${err.message}`);
        }
    }

    // Reset user relational array fields (keep user accounts)
    try {
        const userResult = await db.collection('users').updateMany({}, {
            $set: USER_FIELDS_TO_RESET
        });
        console.log(`\n👤 Reset user social fields for ${userResult.modifiedCount} users (kept accounts intact)`);
    } catch (err: any) {
        console.log(`⚠️  Could not reset user fields: ${err.message}`);
    }

    console.log('\n' + '='.repeat(55));
    console.log(`✅ Cleanup Complete! Total documents removed: ${totalDeleted}`);
    console.log('📊 Remaining: User accounts + Plans only');
    console.log('='.repeat(55));
    console.log('\n🎉 Database is clean and ready for presentation!\n');

    await mongoose.disconnect();
}

cleanDatabase().catch((err) => {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
});
