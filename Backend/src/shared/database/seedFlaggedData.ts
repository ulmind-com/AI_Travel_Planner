import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import connection from './connection';
import User from './models/userModel';
import CommunityPost from './models/communityPostModel';
import CommunityComment from './models/communityCommentModel';
import Review from './models/reviewModel';
import ModerationReport, { ModerationType, ModerationSeverity } from './models/moderationReportModel';

const runSeed = async () => {
    const dbUri = process.env.DB_URI;
    if (!dbUri) {
        console.error('❌ DB_URI is not set in environment variables!');
        process.exit(1);
    }

    console.log('Connecting to database...');
    await connection(dbUri);

    try {
        console.log('Fetching or creating base user for associations...');
        let user = await User.findOne();
        if (!user) {
            user = await User.create({
                firebaseUid: 'user_seed_test_123',
                email: 'tester_moderation@nexus.com',
                fullname: 'John Tester',
                username: 'moderation_tester',
                profilepicture: 'https://ui-avatars.com/api/?name=John+Tester&background=ef4444&color=fff',
                role: 'user'
            });
            console.log('Created base seed user.');
        }

        // Clear existing pending moderation reports to avoid cluttering
        console.log('Clearing existing pending reports...');
        await ModerationReport.deleteMany({ status: 'pending' });

        // ── 1. SEED FLAGGED POSTS ──
        console.log('Seeding flagged posts...');
        const flaggedPostsData = [
            {
                title: 'CRITICAL WARNING: This Travel App is a Total Scam!',
                content: 'They hacked my credit card payments and bypassed my security. Complete fraudsters and money laundering operators! Beware!',
                category: 'General'
            },
            {
                title: 'Earn $5000/day instantly by bypassing payments!',
                content: 'Click here to download this cheat package and hack into premium travel systems. 100% working bypass exploits!',
                category: 'Exploits'
            },
            {
                title: 'DISSOLVING MY ACCOUNT: Absolute garbage services',
                content: 'Highly aggressive support staff, harassing customers and sending threats! Disgusting experience, illegal actions!',
                category: 'General'
            }
        ];

        for (const postData of flaggedPostsData) {
            const post = await CommunityPost.create({
                userId: user._id,
                firebaseUid: user.firebaseUid,
                title: postData.title,
                content: postData.content,
                category: postData.category,
                tags: ['warning', 'scam']
            });

            await ModerationReport.create({
                type: ModerationType.POST,
                entityId: post._id.toString(),
                reason: 'Harassment & Fraudulent Scam Content',
                severity: ModerationSeverity.HIGH,
                aiScore: 0.96,
                flaggedContent: `${post.title}: ${post.content}`,
                status: 'pending'
            });
        }

        // ── 2. SEED FLAGGED COMMENTS ──
        console.log('Seeding flagged comments...');
        const flaggedCommentsData = [
            'Do not trust this platform! This is a total scam. They hacked my payments. Worst support ever!',
            'Stupid developers! Worst travel guidelines. Disgusting app, I hope you all go bankrupt!',
            'Download the hacked version of this app for free credit cards and security bypass cheats!',
            'Warning: the admin has hacked into user details and is harassing female operators!',
            'This is a fake website trying to steal money. Absolute fraud and criminal activity!',
            'Shut up! You are a fraud. Do not comment on my plan or I will find your details and leak them!',
            'Cheap scam software, aggressive payments hijacking alert! Bypass security codes here!'
        ];

        // Let\'s grab a post to associate comments with
        let post = await CommunityPost.findOne();
        if (!post) {
            post = await CommunityPost.create({
                userId: user._id,
                firebaseUid: user.firebaseUid,
                title: 'Active Community Travel Discussion',
                content: 'Welcome to AdventureNexus discussion boards!',
                category: 'General'
            });
        }

        for (const commentText of flaggedCommentsData) {
            const comment = await CommunityComment.create({
                postId: post._id,
                userId: user._id,
                firebaseUid: user.firebaseUid,
                content: commentText
            });

            await ModerationReport.create({
                type: ModerationType.COMMENT,
                entityId: comment._id.toString(),
                reason: 'Aggressive Vulgarity & Security Exploits',
                severity: ModerationSeverity.HIGH,
                aiScore: 0.94,
                flaggedContent: commentText,
                status: 'pending'
            });
        }

        // ── 3. SEED FLAGGED REVIEWS ──
        console.log('Seeding flagged reviews...');
        const flaggedReviewsData = [
            'Absolute waste of money. Completely fake itineraries and cheat accommodation! Worst support.',
            'Worst service ever! They threatened me and refused refunds. This travel agency is a fraud!',
            'Total scam. Do not buy these plans! They hacked my payments. Very bad experience.'
        ];

        for (const reviewText of flaggedReviewsData) {
            const review = await Review.create({
                userId: user._id.toString(),
                firebaseUid: user.firebaseUid,
                userName: 'Angry Nomad',
                location: 'Cairo, Egypt',
                tripType: 'solo',
                tripDuration: '5 Days',
                travelers: '1 Adult',
                rating: 2,
                comment: reviewText,
                isVerified: false
            });

            await ModerationReport.create({
                type: ModerationType.REVIEW,
                entityId: review._id.toString(),
                reason: 'Highly Threatening Review Comment',
                severity: ModerationSeverity.MEDIUM,
                aiScore: 0.88,
                flaggedContent: `@Angry Nomad: ${reviewText}`,
                status: 'pending'
            });
        }

        // ── 4. SEED FLAGGED USERS ──
        console.log('Seeding flagged user accounts...');
        const flaggedUserData = [
            {
                username: 'cheats_bypass_99',
                fullname: 'Exploits Seller',
                bio: 'Providing credit card cheats and payment bypass tools. Harassing regular accounts.'
            },
            {
                username: 'scammer_nexus',
                fullname: 'Fake Traveler',
                bio: 'Click here for guaranteed travel refund scams. Total hacker profile.'
            }
        ];

        for (const uData of flaggedUserData) {
            const u = await User.create({
                firebaseUid: `user_mock_flagged_${Math.random().toString(36).substr(2, 9)}`,
                email: `${uData.username}@scamnexus.com`,
                fullname: uData.fullname,
                username: uData.username,
                profilepicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(uData.fullname)}&background=dc2626&color=fff`,
                bio: uData.bio,
                role: 'user'
            });

            await ModerationReport.create({
                type: ModerationType.USER,
                entityId: u._id.toString(),
                reason: 'Exploits bio & scam activities profile',
                severity: ModerationSeverity.HIGH,
                aiScore: 0.98,
                flaggedContent: `@${u.username}: ${u.fullname} (${u.bio})`,
                status: 'pending'
            });
        }

        console.log('✅ Seeding completed successfully!');
        console.log('seeded:');
        console.log('  - Flagged Posts: 3');
        console.log('  - Flagged Comments: 7');
        console.log('  - Flagged Reviews: 3');
        console.log('  - Flagged Accounts: 2');
        console.log('  - Corresponding Moderation reports created in pending status.');

    } catch (err: any) {
        console.error('❌ Error seeding data:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Database disconnected.');
    }
};

runSeed();
