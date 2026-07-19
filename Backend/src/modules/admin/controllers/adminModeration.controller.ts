import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../../../shared/database/models/userModel';
import CommunityPost from '../../../shared/database/models/communityPostModel';
import CommunityComment from '../../../shared/database/models/communityCommentModel';
import Review from '../../../shared/database/models/reviewModel';
import ModerationReport, { ModerationType, ModerationSeverity } from '../../../shared/database/models/moderationReportModel';
import Notification from '../../../shared/database/models/notificationModel';
import { analyzeContent } from '../services/aiModerator';
import { getIO } from '../../../shared/socket/socket';
import logger from '../../../shared/utils/logger';
import { trackAdminEvent } from '../../../shared/utils/adminEventTracker';

/**
 * ── RUN DEEP AI CONTENT MODERATION SCAN ──
 * POST /api/v1/admin/moderation/run
 */
export const runAiModeration = async (req: Request, res: Response) => {
    try {
        // Send fast initial response to let client know the async scan has commenced
        res.status(StatusCodes.ACCEPTED).json({
            success: true,
            message: 'Deep content AI scanning job triggered successfully. Progress streamed over socket.'
        });

        const io = getIO();
        const emitProgress = (stage: string, current: number, total: number, message: string) => {
            if (io) {
                io.emit('moderation:progress', {
                    stage,
                    current,
                    total,
                    percentage: total > 0 ? Math.round((current / total) * 100) : 0,
                    message
                });
            }
        };

        // Clear previous pending reports to start fresh scan
        await ModerationReport.deleteMany({ status: 'pending' });

        // ── STAGE 1: FETCH AND SCAN USERS ──
        emitProgress('users', 0, 0, 'Fetching user directory for profile scanning...');
        const users = await User.find().lean();
        const totalUsers = users.length;
        
        for (let i = 0; i < totalUsers; i++) {
            const user = users[i];
            const contentToScan = `${user.fullname || ''} ${user.username || ''} ${user.bio || ''}`;
            
            if (contentToScan.trim()) {
                const analysis = await analyzeContent(contentToScan);
                if (analysis.isUnsafe) {
                    await ModerationReport.create({
                        type: ModerationType.USER,
                        entityId: user._id.toString(),
                        reason: `${analysis.category} - ${analysis.reason}`,
                        severity: analysis.severity as ModerationSeverity,
                        aiScore: analysis.aiScore,
                        flaggedContent: `@${user.username || 'username'}: ${user.fullname || 'Name'} (${user.bio || 'No Bio'})`,
                        status: 'pending'
                    });
                }
            }
            
            if (i % 5 === 0 || i === totalUsers - 1) {
                emitProgress('users', i + 1, totalUsers, `Scanned ${i + 1}/${totalUsers} travel accounts...`);
                // Sleep briefly to prevent GROQ API rate limit throttling
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // ── STAGE 2: FETCH AND SCAN POSTS ──
        emitProgress('posts', 0, 0, 'Fetching social feed directory for content scanning...');
        const posts = await CommunityPost.find().lean();
        const totalPosts = posts.length;

        for (let i = 0; i < totalPosts; i++) {
            const post = posts[i];
            const contentToScan = `${post.title || ''} ${post.content || ''}`;

            if (contentToScan.trim()) {
                const analysis = await analyzeContent(contentToScan);
                if (analysis.isUnsafe) {
                    await ModerationReport.create({
                        type: ModerationType.POST,
                        entityId: post._id.toString(),
                        reason: `${analysis.category} - ${analysis.reason}`,
                        severity: analysis.severity as ModerationSeverity,
                        aiScore: analysis.aiScore,
                        flaggedContent: `${post.title || 'Untitled Post'}: ${post.content || ''}`,
                        status: 'pending'
                    });
                }
            }

            if (i % 5 === 0 || i === totalPosts - 1) {
                emitProgress('posts', i + 1, totalPosts, `Scanned ${i + 1}/${totalPosts} community posts...`);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // ── STAGE 3: FETCH AND SCAN COMMENTS ──
        emitProgress('comments', 0, 0, 'Fetching comments directory for dialogue scanning...');
        const comments = await CommunityComment.find().lean();
        const totalComments = comments.length;

        for (let i = 0; i < totalComments; i++) {
            const comment = comments[i];
            const contentToScan = comment.content || '';

            if (contentToScan.trim()) {
                const analysis = await analyzeContent(contentToScan);
                if (analysis.isUnsafe) {
                    await ModerationReport.create({
                        type: ModerationType.COMMENT,
                        entityId: comment._id.toString(),
                        reason: `${analysis.category} - ${analysis.reason}`,
                        severity: analysis.severity as ModerationSeverity,
                        aiScore: analysis.aiScore,
                        flaggedContent: comment.content || '',
                        status: 'pending'
                    });
                }
            }

            if (i % 5 === 0 || i === totalComments - 1) {
                emitProgress('comments', i + 1, totalComments, `Scanned ${i + 1}/${totalComments} comments...`);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // ── STAGE 4: FETCH AND SCAN REVIEWS ──
        emitProgress('reviews', 0, 0, 'Fetching traveler reviews directory for safety scanning...');
        const reviews = await Review.find().lean();
        const totalReviews = reviews.length;

        for (let i = 0; i < totalReviews; i++) {
            const review = reviews[i];
            const contentToScan = review.comment || '';

            if (contentToScan.trim()) {
                const analysis = await analyzeContent(contentToScan);
                if (analysis.isUnsafe) {
                    await ModerationReport.create({
                        type: ModerationType.REVIEW,
                        entityId: review._id.toString(),
                        reason: `${analysis.category} - ${analysis.reason}`,
                        severity: analysis.severity as ModerationSeverity,
                        aiScore: analysis.aiScore,
                        flaggedContent: `@${review.userName || 'traveler'}: ${review.comment || ''}`,
                        status: 'pending'
                    });
                }
            }

            if (i % 5 === 0 || i === totalReviews - 1) {
                emitProgress('reviews', i + 1, totalReviews, `Scanned ${i + 1}/${totalReviews} reviews...`);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // Scan completion trigger
        if (io) {
            io.emit('moderation:complete', {
                success: true,
                message: 'Ecosystem-wide AI content analysis finished successfully.'
            });
        }
        
        logger.info('Ecosystem-wide AI content analysis scan completed successfully.');

    } catch (error: any) {
        logger.error(`Failed during AI Content Moderation scan: ${error.message}`);
    }
};

/**
 * ── GET MODERATION REPORTS ──
 * GET /api/v1/admin/moderation/reports
 */
export const getModerationReports = async (req: Request, res: Response) => {
    try {
        const reports = await ModerationReport.find()
            .sort({ severity: 1, aiScore: -1, createdAt: -1 });

        return res.status(StatusCodes.OK).json({
            success: true,
            data: reports
        });
    } catch (error: any) {
        logger.error(`Error fetching moderation reports: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch moderation reports'
        });
    }
};

/**
 * ── RESOLVE AI MODERATION REPORT ──
 * POST /api/v1/admin/moderation/resolve
 */
export const resolveModerationReport = async (req: Request, res: Response) => {
    try {
        const { reportId, action } = req.body; // action: 'approve' | 'delete'

        if (!reportId || !action) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Report ID and action ('approve' | 'delete') are required."
            });
        }

        const report = await ModerationReport.findById(reportId);
        if (!report) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Moderation report not found'
            });
        }

        if (action === 'delete') {
            // Delete actual database entity
            if (report.type === ModerationType.POST) {
                await CommunityPost.findByIdAndDelete(report.entityId);
                logger.info(`Moderator deleted post ID ${report.entityId} based on AI report ${reportId}`);
            } else if (report.type === ModerationType.COMMENT) {
                await CommunityComment.findByIdAndDelete(report.entityId);
                logger.info(`Moderator deleted comment ID ${report.entityId} based on AI report ${reportId}`);
            } else if (report.type === ModerationType.USER) {
                const userToBan = await User.findById(report.entityId);
                if (userToBan) {
                    userToBan.isBanned = true;
                    userToBan.banReason = report.reason || "Violation of community guidelines";
                    await userToBan.save();
                    logger.info(`Moderator successfully banned user ID ${report.entityId} based on AI report ${reportId}`);

                    // Send persistent notification to the banned user
                    try {
                        await Notification.create({
                            recipientFirebaseUid: userToBan.firebaseUid,
                            senderFirebaseUid: 'admin_security',
                            type: 'account_ban',
                            relatedId: reportId,
                            isRead: false
                        });

                        // Emit real-time notification socket event
                        const io = getIO();
                        if (io) {
                            io.to(userToBan.firebaseUid).emit('notification', {
                                type: 'account_ban',
                                reason: userToBan.banReason,
                                message: `Your account has been restricted: ${userToBan.banReason}`,
                                createdAt: new Date()
                            });
                        }
                    } catch (notifErr: any) {
                        logger.error(`Error sending ban notification: ${notifErr.message}`);
                    }
                }
            } else if (report.type === ModerationType.REVIEW) {
                await Review.findByIdAndDelete(report.entityId);
                logger.info(`Moderator deleted traveler review ID ${report.entityId} based on AI report ${reportId}`);
            }

            report.status = 'resolved_deleted';
            await report.save();

            await trackAdminEvent({
                firebaseUid: 'admin123',
                activityType: 'comment_added',
                targetId: report.entityId,
                details: `Moderator purged flagged ${report.type} node: "${report.flaggedContent.substring(0, 30)}..."`,
                username: 'security_radar'
            });
        } else if (action === 'approve') {
            report.status = 'resolved_approved';
            await report.save();

            await trackAdminEvent({
                firebaseUid: 'admin123',
                activityType: 'comment_added',
                targetId: report.entityId,
                details: `Moderator whitelisted flagged ${report.type} node: "${report.flaggedContent.substring(0, 30)}..."`,
                username: 'security_radar'
            });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `Report successfully resolved with action: ${action}`
        });

    } catch (error: any) {
        logger.error(`Error resolving AI moderation report: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to resolve moderation report'
        });
    }
};
