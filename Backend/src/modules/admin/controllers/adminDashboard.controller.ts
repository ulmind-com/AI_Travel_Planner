import { Request, Response } from 'express';
import User from '../../../shared/database/models/userModel';
import Plan from '../../../shared/database/models/planModel';
import Review from '../../../shared/database/models/reviewModel';
import { StatusCodes } from 'http-status-codes';
import logger from '../../../shared/utils/logger';
import os from 'os';
import AuditLog from '../../../shared/database/models/auditLogModel';
import ApiLog from '../../../shared/database/models/apiLogModel';
import CommunityPost from '../../../shared/database/models/communityPostModel';
import ExperiencePost from '../../../shared/database/models/experiencePostModel';
import CommunityComment from '../../../shared/database/models/communityCommentModel';
import ExperienceComment from '../../../shared/database/models/experienceCommentModel';
import GroupMembership from '../../../shared/database/models/groupMembershipModel';
import ActivityLog from '../../../shared/database/models/activityLogModel';

// --- Stats ---
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPlans = await Plan.countDocuments();
        const totalReviews = await Review.countDocuments();

        // Example: Get recent plans for a "Recent Activity" widget
        const recentPlans = await Plan.find().sort({ createdAt: -1 }).limit(5).select('name to date');

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: {
                totalUsers,
                totalPlans,
                totalReviews,
                recentPlans
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

export const getGrowthStats = async (req: Request, res: Response) => {
    try {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            return date;
        }).reverse();

        const growthData = await Promise.all(last7Days.map(async (date) => {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const userCount = await User.countDocuments({
                createdAt: { $gte: date, $lt: nextDay }
            });
            const planCount = await Plan.countDocuments({
                createdAt: { $gte: date, $lt: nextDay }
            });

            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                users: userCount,
                plans: planCount
            };
        }));

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: growthData
        });
    } catch (error) {
        logger.error('Error fetching growth stats:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

// --- System Intelligence (Phase 4) ---
export const getSystemHealth = async (req: Request, res: Response) => {
    try {
        const cpuUsage = os.loadavg(); // Returns 1, 5, 15 min load averages
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const uptime = os.uptime();

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: {
                cpuLoad: cpuUsage[0], // 1 min load average
                memory: {
                    total: totalMem, free: freeMem, used: totalMem - freeMem,
                    percentage: (((totalMem - freeMem) / totalMem) * 100).toFixed(2)
                },
                uptime,
                platform: os.platform(),
                arch: os.arch()
            }
        });
    } catch (error) {
        logger.error('Error fetching system health:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

// --- User Management ---
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const usersWithStats = await User.aggregate([
            {
                $lookup: {
                    from: 'plans',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'plansData'
                }
            },
            {
                $lookup: {
                    from: 'communityposts',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'postsData'
                }
            },
            {
                $lookup: {
                    from: 'communitycomments',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'commentsData'
                }
            },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'reviewsData'
                }
            },
            {
                $project: {
                    firebaseUid: 1,
                    email: 1,
                    firstName: 1,
                    lastName: 1,
                    username: 1,
                    profilepicture: 1,
                    phonenumber: 1,
                    fullname: 1,
                    role: 1,
                    gender: 1,
                    country: 1,
                    preferences: 1,
                    followers: 1,
                    following: 1,
                    bio: 1,
                    coverImage: 1,
                    isPrivate: 1,
                    onlineStatus: 1,
                    isBanned: 1,
                    banReason: 1,
                    lastActive: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    plansCount: { $size: '$plansData' },
                    postsCount: { $size: '$postsData' },
                    commentsCount: { $size: '$commentsData' },
                    reviewsCount: { $size: '$reviewsData' }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.status(StatusCodes.OK).json({ status: 'Success', data: usersWithStats });
    } catch (error) {
        logger.error('Error fetching users with aggregated stats:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        const { getIO } = await import('../../../shared/socket/socket'); // Dynamic import
        if (user) {
            getIO().emit('user:deleted', user.firebaseUid);

            // Log the action (Phase 4)
            await AuditLog.log({
                action: 'DELETE_USER',
                module: 'COMMUNITY',
                adminId: 'admin',
                targetId: req.params.id,
                details: { username: user.username, email: user.email },
                severity: 'warning'
            });
        }

        res.status(StatusCodes.OK).json({ status: 'Success', message: 'User deleted' });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

export const toggleBanUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }

        user.isBanned = !user.isBanned;
        user.banReason = user.isBanned ? (req.body.reason || 'Violated community guidelines') : '';
        await user.save();

        const { getIO } = await import('../../../shared/socket/socket');
        getIO().emit('user:ban_status_changed', { firebaseUid: user.firebaseUid, isBanned: user.isBanned });

        await AuditLog.log({
            action: user.isBanned ? 'BAN_USER' : 'UNBAN_USER',
            module: 'COMMUNITY',
            adminId: 'admin',
            targetId: req.params.id,
            details: { username: user.username, email: user.email, reason: user.banReason },
            severity: user.isBanned ? 'danger' : 'info'
        });

        res.status(StatusCodes.OK).json({ 
            status: 'Success', 
            message: `User successfully ${user.isBanned ? 'banned' : 'unbanned'}`, 
            data: user 
        });
    } catch (error) {
        logger.error('Error toggling ban status for user:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

// --- Plan Management ---
export const getAllPlans = async (req: Request, res: Response) => {
    try {
        const plans = await Plan.find().populate('userId', 'email username').sort({ createdAt: -1 });
        res.status(StatusCodes.OK).json({ status: 'Success', data: plans });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

export const getPlansAnalytics = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || '';
        const status = (req.query.status as string) || '';
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

        // Base filter query
        const matchQuery: any = {};
        if (status) {
            matchQuery.status = status;
        }

        const aggregatePipeline: any[] = [
            // 1. Join with users
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            {
                $unwind: {
                    path: '$creator',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        // Search match (on destination, creator username or plan name)
        if (search) {
            aggregatePipeline.push({
                $match: {
                    $or: [
                        { to: { $regex: search, $options: 'i' } },
                        { 'creator.username': { $regex: search, $options: 'i' } },
                        { name: { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Apply general match
        if (Object.keys(matchQuery).length > 0) {
            aggregatePipeline.push({ $match: matchQuery });
        }

        // 2. Add calculated fields for analytics
        aggregatePipeline.push({
            $addFields: {
                // Engagement score = likesCount + commentsCount * 2 + (star * 5)
                engagementScore: {
                    $add: [
                        { $ifNull: ['$likesCount', 18] },
                        { $multiply: [{ $ifNull: ['$commentsCount', 5] }, 2] },
                        { $multiply: [{ $ifNull: ['$star', 4] }, 5] }
                    ]
                },
                // Default value fallbacks if not explicitly set
                views: { $ifNull: ['$views', 120] },
                saves: { $ifNull: ['$saves', 24] },
                likesCount: { $ifNull: ['$likesCount', 18] },
                commentsCount: { $ifNull: ['$commentsCount', 5] },
                status: { $ifNull: ['$status', 'active'] },
                isFlagged: { $ifNull: ['$isFlagged', false] }
            }
        });

        // 3. Sorting
        const sortField = sortBy === 'engagementScore' ? 'engagementScore' : sortBy;
        aggregatePipeline.push({
            $sort: { [sortField]: sortOrder }
        });

        // Clone pipeline for count
        const countPipeline = [...aggregatePipeline];

        // 4. Pagination
        aggregatePipeline.push(
            { $skip: (page - 1) * limit },
            { $limit: limit }
        );

        const plans = await Plan.aggregate(aggregatePipeline);
        
        // Count matching documents
        countPipeline.push({ $count: 'total' });
        const countResult = await Plan.aggregate(countPipeline);
        const totalPlansMatching = countResult[0]?.total || 0;

        // 5. Global aggregated stats (Total, Trending, Most Active Destination, Highest Engagement)
        const totalStats = await Plan.aggregate([
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                    activeCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    trendingCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'trending'] }, 1, 0] }
                    },
                    totalViews: { $sum: { $ifNull: ['$views', 120] } },
                    totalSaves: { $sum: { $ifNull: ['$saves', 24] } }
                }
            }
        ]);

        const trendingDestinations = await Plan.aggregate([
            {
                $group: {
                    _id: '$to',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const highestEngagementPlan = await Plan.aggregate([
            {
                $addFields: {
                    engagementScore: {
                        $add: [
                            { $ifNull: ['$likesCount', 18] },
                            { $multiply: [{ $ifNull: ['$commentsCount', 5] }, 2] }
                        ]
                    }
                }
            },
            { $sort: { engagementScore: -1 } },
            { $limit: 1 }
        ]);

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: {
                plans,
                pagination: {
                    total: totalPlansMatching,
                    page,
                    limit,
                    pages: Math.ceil(totalPlansMatching / limit)
                },
                stats: {
                    totalPlans: totalStats[0]?.totalCount || 0,
                    activePlans: totalStats[0]?.activeCount || 0,
                    trendingPlans: totalStats[0]?.trendingCount || 0,
                    totalViews: totalStats[0]?.totalViews || 0,
                    totalSaves: totalStats[0]?.totalSaves || 0,
                    mostActiveDestination: trendingDestinations[0]?._id || 'N/A',
                    highestEngagement: highestEngagementPlan[0] || null
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching plans analytics:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

export const promotePlan = async (req: Request, res: Response) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Plan not found' });
        }

        // Toggle status between active and trending
        plan.status = plan.status === 'trending' ? 'active' : 'trending';
        await plan.save();

        const { getIO } = await import('../../../shared/socket/socket');
        getIO().emit('plan:updated', plan);

        await AuditLog.log({
            action: plan.status === 'trending' ? 'PROMOTE_PLAN' : 'DEMOTE_PLAN',
            module: 'EXPEDITIONS',
            adminId: 'admin',
            targetId: req.params.id,
            details: { destination: plan.to, status: plan.status },
            severity: 'success'
        });

        res.status(StatusCodes.OK).json({ status: 'Success', message: `Plan status updated to ${plan.status}`, data: plan });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

export const flagPlan = async (req: Request, res: Response) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Plan not found' });
        }

        // Toggle flagged status
        plan.isFlagged = !plan.isFlagged;
        plan.flagReason = plan.isFlagged ? (req.body.reason || 'Flagged by system administrator') : '';
        await plan.save();

        const { getIO } = await import('../../../shared/socket/socket');
        getIO().emit('plan:updated', plan);

        await AuditLog.log({
            action: plan.isFlagged ? 'FLAG_PLAN' : 'UNFLAG_PLAN',
            module: 'EXPEDITIONS',
            adminId: 'admin',
            targetId: req.params.id,
            details: { destination: plan.to, reason: plan.flagReason },
            severity: plan.isFlagged ? 'warning' : 'info'
        });

        res.status(StatusCodes.OK).json({ status: 'Success', message: `Plan flagged status updated`, data: plan });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        const plan = await Plan.findByIdAndDelete(req.params.id);
        const { getIO } = await import('../../../shared/socket/socket');
        getIO().emit('plan:deleted', req.params.id);

        // Log the action (Phase 4)
        if (plan) {
            await AuditLog.log({
                action: 'DELETE_PLAN',
                module: 'EXPEDITIONS',
                adminId: 'admin',
                targetId: req.params.id,
                details: { destination: (plan as any).to },
                severity: 'info'
            });
        }

        res.status(StatusCodes.OK).json({ status: 'Success', message: 'Plan deleted' });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

// --- Review Management ---
export const getAllReviews = async (req: Request, res: Response) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.status(StatusCodes.OK).json({ status: 'Success', data: reviews });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

export const deleteReview = async (req: Request, res: Response) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        const { getIO } = await import('../../../shared/socket/socket');
        getIO().emit('review:deleted', req.params.id);

        // Log the action (Phase 4)
        if (review) {
            await AuditLog.log({
                action: 'DELETE_REVIEW',
                module: 'TESTIMONIALS',
                adminId: 'admin',
                targetId: req.params.id,
                details: { reviewer: (review as any).userName },
                severity: 'info'
            });
        }

        res.status(StatusCodes.OK).json({ status: 'Success', message: 'Review deleted' });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

// --- Governance (Audit Logs) ---
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
        res.status(StatusCodes.OK).json({ status: 'Success', data: logs });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

// --- API Analytics (Phase 5) ---
export const getApiAnalytics = async (req: Request, res: Response) => {
    try {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        // 1. Status Distribution
        const statusDistribution = await ApiLog.aggregate([
            { $match: { timestamp: { $gte: last7Days } } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lt: ["$statusCode", 300] }, "Success",
                            { $cond: [{ $lt: ["$statusCode", 400] }, "Redirect", "Error"] }
                        ]
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 2. Latency Trends (Daily average)
        const latencyTrends = await ApiLog.aggregate([
            { $match: { timestamp: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    avgDuration: { $avg: "$duration" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Top Error Endpoints
        const topErrors = await ApiLog.aggregate([
            { $match: { timestamp: { $gte: last7Days }, statusCode: { $gte: 400 } } },
            {
                $group: {
                    _id: { endpoint: "$endpoint", method: "$method" },
                    errorCount: { $sum: 1 }
                }
            },
            { $sort: { errorCount: -1 } },
            { $limit: 10 }
        ]);

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: {
                distribution: statusDistribution,
                latency: latencyTrends.map(d => ({ date: d._id, value: Math.round(d.avgDuration) })),
                errors: topErrors.map(e => ({ endpoint: e._id.endpoint, method: e._id.method, count: e.errorCount }))
            }
        });
    } catch (error) {
        logger.error('Error fetching API analytics:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

/**
 * ── GET REAL-TIME METRICS FOR GRAFANA OBSERVABILITY ──
 */
/**
 * ── GET REAL-TIME METRICS FOR GRAFANA OBSERVABILITY ──
 */
export const getDashboardMetrics = async (req: Request, res: Response) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Fetch counts in parallel
        const [
            totalUsers,
            activeUsers,
            newUsersToday,
            usersCount7dAgo,
            commPosts,
            expPosts,
            commPostsToday,
            expPostsToday,
            commComments,
            expComments,
            commCommentsToday,
            expCommentsToday,
            likesToday,
            groupJoins,
            apiRequestCount,
            latencyRes,
            errorRequests
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ updatedAt: { $gte: last24h } }),
            User.countDocuments({ createdAt: { $gte: startOfToday } }),
            User.countDocuments({ createdAt: { $lt: sevenDaysAgo } }),
            CommunityPost.countDocuments(),
            ExperiencePost.countDocuments(),
            CommunityPost.countDocuments({ createdAt: { $gte: startOfToday } }),
            ExperiencePost.countDocuments({ createdAt: { $gte: startOfToday } }),
            CommunityComment.countDocuments(),
            ExperienceComment.countDocuments(),
            CommunityComment.countDocuments({ createdAt: { $gte: startOfToday } }),
            ExperienceComment.countDocuments({ createdAt: { $gte: startOfToday } }),
            ActivityLog.countDocuments({ activityType: { $in: ['like_given', 'like:added'] }, createdAt: { $gte: startOfToday } }),
            GroupMembership.countDocuments(),
            ApiLog.countDocuments({ timestamp: { $gte: last24h } }),
            ApiLog.aggregate([
                { $match: { timestamp: { $gte: last24h } } },
                { $group: { _id: null, avgLatency: { $avg: '$duration' } } }
            ]),
            ApiLog.countDocuments({ timestamp: { $gte: last24h }, statusCode: { $gte: 400 } })
        ]);

        const totalPosts = commPosts + expPosts;
        const postsToday = commPostsToday + expPostsToday;
        const totalComments = commComments + expComments;
        const commentsToday = commCommentsToday + expCommentsToday;

        // User growth rate weekly
        const userGrowthRate = usersCount7dAgo > 0 
            ? parseFloat((((totalUsers - usersCount7dAgo) / usersCount7dAgo) * 100).toFixed(2)) 
            : 0;

        // Aggregate total likes from posts
        const [communityLikes, experienceLikes] = await Promise.all([
            CommunityPost.aggregate([{ $group: { _id: null, total: { $sum: { $size: { $ifNull: ["$likes", []] } } } } }]),
            ExperiencePost.aggregate([{ $group: { _id: null, total: { $sum: { $size: { $ifNull: ["$likes", []] } } } } }])
        ]);

        const totalLikes = (communityLikes[0]?.total || 0) + (experienceLikes[0]?.total || 0);

        // Engagement Metrics
        const avgLikesPerPost = totalPosts > 0 ? parseFloat((totalLikes / totalPosts).toFixed(2)) : 0;
        const avgCommentsPerPost = totalPosts > 0 ? parseFloat((totalComments / totalPosts).toFixed(2)) : 0;

        // System Metrics
        const avgLatency = latencyRes[0]?.avgLatency ? Math.round(latencyRes[0].avgLatency) : 0;
        const errorRate = apiRequestCount > 0 ? parseFloat(((errorRequests / apiRequestCount) * 100).toFixed(2)) : 0;

        const { getOnlineUsersCount } = await import('../../../shared/socket/socket');
        const onlineUsersCount = getOnlineUsersCount();

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                // User Metrics
                totalUsers,
                activeUsers,
                newUsersToday,
                userGrowthRate,

                // Content Metrics
                totalPosts,
                postsToday,
                commentsToday,
                likesToday,

                // Engagement Metrics
                avgLikesPerPost,
                avgCommentsPerPost,
                activeSessions: onlineUsersCount,

                // System Metrics
                apiRequestCount,
                avgLatency,
                errorRate,

                // Legacy fallback support to prevent any breaking elements
                commentsCount: totalComments,
                likesCount: totalLikes,
                groupJoins,
                onlineUsersCount
            }
        });
    } catch (error: any) {
        logger.error('Error fetching admin observability metrics:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * ── GET TIME-SERIES DATA FOR GRAFANA REAL-TIME CHARTS ──
 */
export const getDashboardTimeSeries = async (req: Request, res: Response) => {
    try {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // 1. Hourly user registrations
        const hourlyUsers = await User.aggregate([
            { $match: { createdAt: { $gte: last24h } } },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Map to continuous 24 hours format
        const formattedHourly = Array.from({ length: 24 }, (_, i) => {
            const match = hourlyUsers.find(h => h._id === i);
            return { hour: `${i}:00`, registrations: match ? match.count : 0 };
        });

        // 2. Cumulative User Growth Trend (Line Chart)
        const totalUsersNow = await User.countDocuments();
        const userGrowthTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(23, 59, 59, 999);
            const count = await User.countDocuments({ createdAt: { $lte: date } });
            userGrowthTrend.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count
            });
        }

        // 3. Combined Daily Posts per day (Bar Chart)
        const dailyPostsCombined = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const start = new Date(date); start.setHours(0, 0, 0, 0);
            const end = new Date(date); end.setHours(23, 59, 59, 999);
            
            const cPosts = await CommunityPost.countDocuments({ createdAt: { $gte: start, $lte: end } });
            const ePosts = await ExperiencePost.countDocuments({ createdAt: { $gte: start, $lte: end } });
            dailyPostsCombined.push({ date: dateStr, count: cPosts + ePosts });
        }

        // 4. Combined Daily Comments per day
        const dailyCommentsCombined = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const start = new Date(date); start.setHours(0, 0, 0, 0);
            const end = new Date(date); end.setHours(23, 59, 59, 999);

            const cComments = await CommunityComment.countDocuments({ createdAt: { $gte: start, $lte: end } });
            const eComments = await ExperienceComment.countDocuments({ createdAt: { $gte: start, $lte: end } });
            dailyCommentsCombined.push({ date: dateStr, count: cComments + eComments });
        }

        // 5. Daily Likes recorded (last 7 days)
        const dailyLikes = await ActivityLog.aggregate([
            { $match: { activityType: { $in: ['like_given', 'like:added'] }, createdAt: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const getMergedSeries = (aggData: any[]) => {
            const result = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dateStr = date.toISOString().split('T')[0];
                const displayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const match = aggData.find(d => d._id === dateStr);
                result.push({ date: displayStr, count: match ? match.count : 0 });
            }
            return result;
        };

        // 6. API Latency Trends (Area Chart)
        const latencyTrends = await ApiLog.aggregate([
            { $match: { timestamp: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    avgDuration: { $avg: "$duration" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const dailyLatency = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const displayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const match = latencyTrends.find(l => l._id === dateStr);
            dailyLatency.push({ date: displayStr, value: match ? Math.round(match.avgDuration) : 45 });
        }

        // 7. Content Distribution (Pie Chart)
        const postsCount = (await CommunityPost.countDocuments()) + (await ExperiencePost.countDocuments());
        const commentsCount = (await CommunityComment.countDocuments()) + (await ExperienceComment.countDocuments());
        
        // Aggregate total likes
        const [communityLikes, experienceLikes] = await Promise.all([
            CommunityPost.aggregate([{ $group: { _id: null, total: { $sum: { $size: { $ifNull: ["$likes", []] } } } } }]),
            ExperiencePost.aggregate([{ $group: { _id: null, total: { $sum: { $size: { $ifNull: ["$likes", []] } } } } }])
        ]);
        const totalLikes = (communityLikes[0]?.total || 0) + (experienceLikes[0]?.total || 0);

        const contentDistribution = [
            { name: 'Posts', value: postsCount, color: '#8b5cf6' },
            { name: 'Comments', value: commentsCount, color: '#06b6d4' },
            { name: 'Likes', value: totalLikes, color: '#f43f5e' }
        ];

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                hourlyRegistrations: formattedHourly,
                dailyPosts: dailyPostsCombined,
                dailyExperiences: dailyPostsCombined, // keep for compatibility
                dailyComments: dailyCommentsCombined,
                dailyLikes: getMergedSeries(dailyLikes),
                dailyGroups: dailyPostsCombined, // keep for compatibility
                apiLatency: dailyLatency,
                userGrowthTrend,
                contentDistribution
            }
        });
    } catch (error: any) {
        logger.error('Error fetching time-series data:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * ── GET DYNAMIC OBSERVABILITY USER ACTIVITY LOGS ──
 */
export const getDashboardActivityLogs = async (req: Request, res: Response) => {
    try {
        const logs = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        res.status(StatusCodes.OK).json({
            success: true,
            data: logs
        });
    } catch (error: any) {
        logger.error('Error fetching admin dashboard activity logs:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * ── TOGGLE LIVE TRAFFIC SIMULATOR ENGINE ──
 */
import { startSimulator, stopSimulator, isSimulatorRunning } from '../services/trafficSimulator';

export const getSimulatorStatus = async (req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
        success: true,
        data: { active: isSimulatorRunning() }
    });
};

export const toggleSimulator = async (req: Request, res: Response) => {
    try {
        const running = isSimulatorRunning();
        if (running) {
            stopSimulator();
        } else {
            startSimulator(4000);
        }
        res.status(StatusCodes.OK).json({
            success: true,
            data: { active: !running }
        });
    } catch (error: any) {
        logger.error('Error toggling traffic simulator:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * ── GET ECOSYSTEM TOXICITY MODERATION ALERTS ──
 */
export const getModerationAlerts = async (req: Request, res: Response) => {
    try {
        // Fetch comments and reviews to check toxicity
        const [reviews, comments] = await Promise.all([
            Review.find().sort({ createdAt: -1 }).limit(50).lean(),
            CommunityComment.find().populate('userId', 'username fullname profilepicture').sort({ createdAt: -1 }).limit(50).lean()
        ]);

        const TOXIC_KEYWORDS = ['scam', 'cheat', 'hack', 'fake', 'worst', 'shit', 'fuck', 'toxic'];
        const SUSPICIOUS_KEYWORDS = ['bad', 'suspect', 'disappoint', 'delay', 'annoy'];

        const alerts: any[] = [];

        // 1. Process Reviews
        reviews.forEach((r: any) => {
            const commentText = (r.comment || '').toLowerCase();
            let score = 5; // Base toxicity index

            TOXIC_KEYWORDS.forEach(kw => {
                if (commentText.includes(kw)) score += 30;
            });
            SUSPICIOUS_KEYWORDS.forEach(kw => {
                if (commentText.includes(kw)) score += 15;
            });

            if (score > 100) score = 100;

            // Flag items with score >= 35% as suspicious/warnings, or let the admin view all rated by toxicity
            alerts.push({
                _id: r._id,
                type: 'REVIEW',
                author: r.userName || 'Unknown Traveler',
                avatar: r.userAvatar,
                content: r.comment,
                toxicity: score,
                timestamp: r.createdAt || new Date(),
                status: score >= 60 ? 'QUARANTINE' : score >= 35 ? 'SUSPICIOUS' : 'SECURE'
            });
        });

        // 2. Process Comments
        comments.forEach((c: any) => {
            const commentText = (c.content || '').toLowerCase();
            let score = 5;

            TOXIC_KEYWORDS.forEach(kw => {
                if (commentText.includes(kw)) score += 30;
            });
            SUSPICIOUS_KEYWORDS.forEach(kw => {
                if (commentText.includes(kw)) score += 15;
            });

            if (score > 100) score = 100;

            alerts.push({
                _id: c._id,
                type: 'COMMENT',
                author: c.userId?.username || 'traveler',
                avatar: c.userId?.profilepicture,
                content: c.content,
                toxicity: score,
                timestamp: c.createdAt || new Date(),
                status: score >= 60 ? 'QUARANTINE' : score >= 35 ? 'SUSPICIOUS' : 'SECURE'
            });
        });

        // Sort by highest toxicity score
        alerts.sort((a, b) => b.toxicity - a.toxicity);

        res.status(StatusCodes.OK).json({
            success: true,
            data: alerts
        });
    } catch (error: any) {
        logger.error('Error fetching toxicity moderation alerts:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

/**
 * ── RESOLVE ECOSYSTEM TOXICITY MODERATION ALERTS ──
 */
import { trackAdminEvent } from '../../../shared/utils/adminEventTracker';

export const resolveModerationAlert = async (req: Request, res: Response) => {
    try {
        const { id, type, action } = req.body; // action: 'approve' | 'expunge'

        if (action === 'expunge') {
            if (type === 'REVIEW') {
                const deleted = await Review.findByIdAndDelete(id);
                if (deleted) {
                    await trackAdminEvent({
                        firebaseUid: 'admin123',
                        activityType: 'comment_added', // Re-use generic audit log trigger safely
                        targetId: id,
                        details: `Moderator purged toxic testimonial review: "${(deleted as any).comment.substring(0, 30)}..."`,
                        username: 'security_radar'
                    });
                }
            } else {
                const deleted = await CommunityComment.findByIdAndDelete(id);
                if (deleted) {
                    await trackAdminEvent({
                        firebaseUid: 'admin123',
                        activityType: 'comment_added',
                        targetId: id,
                        details: `Moderator purged toxic community comment: "${(deleted as any).content.substring(0, 30)}..."`,
                        username: 'security_radar'
                    });
                }
            }
        } else {
            // Approve - mark as safe or log verification approval
            await trackAdminEvent({
                firebaseUid: 'admin123',
                activityType: 'comment_added',
                targetId: id,
                details: `Moderator cleared content flags for ${type} node id: ${id}`,
                username: 'security_radar'
            });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: `Content marked as ${action === 'expunge' ? 'purged' : 'approved'}`
        });
    } catch (error: any) {
        logger.error('Error resolving content moderation alert:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' });
    }
};

