import express from 'express';
import { adminLogin } from '../controllers/adminAuth.controller';
import {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    toggleBanUser,
    getAllPlans,
    getPlansAnalytics,
    promotePlan,
    flagPlan,
    deletePlan,
    getAllReviews,
    deleteReview,
    getSystemHealth,
    getAuditLogs,
    getGrowthStats,
    getApiAnalytics,
    getDashboardMetrics,
    getDashboardTimeSeries,
    getDashboardActivityLogs,
    getSimulatorStatus,
    toggleSimulator,
    getModerationAlerts,
    resolveModerationAlert
} from '../controllers/adminDashboard.controller';
import {
    runAiModeration,
    getModerationReports,
    resolveModerationReport
} from '../controllers/adminModeration.controller';
import { broadcastMessage } from '../controllers/adminCommunication.controller';
import {
    getSystemSettings,
    updateSystemSetting,
    getSubscribers,
    deleteSubscriber
} from '../controllers/adminSettings.controller';
import {
    getEmailLogs,
    sendAdminEmail,
    toggleStarEmail,
    toggleImportantEmail,
    toggleTrashEmail,
    deleteEmailLogPermanent,
    getEmailStats,
    generateAiMailContent,
    sendBroadcastMail
} from '../controllers/adminMail.controller';
import {
    getFlaggedContent,
    adminBanUser,
    adminReduceTrustScore,
    adminDeleteContent,
    getRiskyUsers
} from '../../trust/controllers/trustController';
import { protectAdmin } from '../../../shared/middleware/adminAuthMiddleware';

const router = express.Router();

// Public Admin Route
router.post('/login', adminLogin);

// Protected Admin Routes
router.use(protectAdmin);

router.get('/metrics', getDashboardMetrics);
router.get('/timeseries', getDashboardTimeSeries);
router.get('/activity', getDashboardActivityLogs);

router.get('/stats', getDashboardStats);

router.get('/users', getAllUsers);
router.post('/users/:id/ban', toggleBanUser);
router.delete('/users/:id', deleteUser);

router.get('/plans/analytics', getPlansAnalytics);
router.get('/plans', getAllPlans);
router.post('/plans/:id/promote', promotePlan);
router.post('/plans/:id/flag', flagPlan);
router.delete('/plans/:id', deletePlan);

router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

// Phase 4 Routes
router.get('/health', getSystemHealth);
router.get('/growth', getGrowthStats);
router.get('/analytics', getApiAnalytics);
router.get('/audit-logs', getAuditLogs);
router.post('/broadcast', broadcastMessage);

// Admin Mail System Center
router.get('/mail', getEmailLogs);
router.get('/mail/stats', getEmailStats);
router.post('/mail/send', sendAdminEmail);
router.post('/mail/generate-ai', generateAiMailContent);
router.post('/mail/broadcast', sendBroadcastMail);
router.patch('/mail/:id/star', toggleStarEmail);
router.patch('/mail/:id/important', toggleImportantEmail);
router.patch('/mail/:id/trash', toggleTrashEmail);
router.delete('/mail/:id', deleteEmailLogPermanent);

// Tactical System Controls
router.get('/settings', getSystemSettings);
router.patch('/settings', updateSystemSetting);

// Newsletter Management
router.get('/subscribers', getSubscribers);
router.delete('/subscribers/:id', deleteSubscriber);

// Dynamic Traffic Simulator Control Center
router.get('/simulator/status', getSimulatorStatus);
router.post('/simulator/toggle', toggleSimulator);

// Content Toxicity Moderation Shield
router.get('/moderation', getModerationAlerts);
router.post('/moderation/resolve', resolveModerationAlert);

// Deep AI Content Moderation Shield
router.post('/moderation/ai/run', runAiModeration);
router.get('/moderation/ai/reports', getModerationReports);
router.post('/moderation/ai/resolve', resolveModerationReport);

// Social Trust Score + Fraud Moderation Shield
router.get('/flagged-content', getFlaggedContent);
router.get('/risky-users', getRiskyUsers);
router.post('/ban-user/:id', adminBanUser);
router.post('/reduce-trust/:userId', adminReduceTrustScore);
router.delete('/content/:logId', adminDeleteContent);

export default router;
