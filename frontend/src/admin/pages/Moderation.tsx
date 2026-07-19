import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldAlert, 
    Sparkles, 
    Play, 
    Trash2, 
    Check, 
    Users, 
    FileText, 
    MessageSquare, 
    AlertTriangle, 
    Activity, 
    RefreshCw,
    Star,
    ShieldCheck,
    UserMinus
} from 'lucide-react';
import api from '../services/adminApi';
import { useSocket } from '../context/AdminSocketContext';

export interface ModerationReport {
    _id: string;
    type: 'post' | 'comment' | 'user' | 'review';
    entityId: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
    aiScore: number;
    flaggedContent: string;
    status: 'pending' | 'resolved_deleted' | 'resolved_approved';
    createdAt: string;
}

interface ScanProgress {
    stage: 'users' | 'posts' | 'comments' | 'reviews' | 'idle';
    current: number;
    total: number;
    percentage: number;
    message: string;
}

const Moderation: React.FC = () => {
    const { socket } = useSocket();
    const [reports, setReports] = useState<ModerationReport[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'post' | 'comment' | 'user' | 'review' | 'trust'>('post');
    const [flaggedContent, setFlaggedContent] = useState<any[]>([]);
    const [riskyUsers, setRiskyUsers] = useState<any[]>([]);
    const [trustLoading, setTrustLoading] = useState<boolean>(false);
    const [penaltyModalUser, setPenaltyModalUser] = useState<string | null>(null);
    const [penaltyAmount, setPenaltyAmount] = useState<number>(10);
    const [penaltyReason, setPenaltyReason] = useState<string>('');

    const fetchTrustShieldData = async () => {
        try {
            setTrustLoading(true);
            const [flaggedRes, riskyRes] = await Promise.all([
                api.get('/flagged-content'),
                api.get('/risky-users')
            ]);
            if (flaggedRes.data.success) {
                setFlaggedContent(flaggedRes.data.data);
            }
            if (riskyRes.data.success) {
                setRiskyUsers(riskyRes.data.data);
            }
        } catch (err) {
            console.error('Failed to load trust shield data', err);
        } finally {
            setTrustLoading(false);
        }
    };

    const handleDeleteFlaggedContent = async (logId: string) => {
        try {
            const res = await api.delete('/content/' + logId);
            if (res.data.success) {
                setFlaggedContent(prev => prev.filter(c => c._id !== logId));
                fetchTrustShieldData();
            }
        } catch (err) {
            alert('Failed to delete flagged content');
        }
    };

    const handleBanUser = async (userId: string, isBanned: boolean, reason: string) => {
        try {
            const res = await api.post('/ban-user/' + userId, { isBanned, banReason: reason });
            if (res.data.success) {
                alert(`User has been ${isBanned ? 'banned' : 'unbanned'}`);
                fetchTrustShieldData();
            }
        } catch (err) {
            alert('Failed to update ban status');
        }
    };

    const handlePenalizeUser = async () => {
        if (!penaltyModalUser) return;
        try {
            const res = await api.post('/reduce-trust/' + penaltyModalUser, {
                penaltyAmount,
                reason: penaltyReason
            });
            if (res.data.success) {
                alert('Trust score reduced successfully');
                setPenaltyModalUser(null);
                setPenaltyAmount(10);
                setPenaltyReason('');
                fetchTrustShieldData();
            }
        } catch (err) {
            alert('Failed to penalize user');
        }
    };

    const [scanning, setScanning] = useState<boolean>(false);
    const [progress, setProgress] = useState<ScanProgress>({
        stage: 'idle',
        current: 0,
        total: 0,
        percentage: 0,
        message: 'AI Moderation scan engine idle.'
    });

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await api.get('/moderation/ai/reports');
            if (res.data.success) {
                setReports(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load moderation reports', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
        fetchTrustShieldData();
    }, []);

    useEffect(() => {
        if (activeTab === 'trust') {
            fetchTrustShieldData();
        }
    }, [activeTab]);

    // Socket.io listeners for real-time progress broadcasts
    useEffect(() => {
        if (!socket) return;

        socket.on('moderation:progress', (data: ScanProgress) => {
            setScanning(true);
            setProgress(data);
        });

        socket.on('moderation:complete', (data: { success: boolean; message: string }) => {
            setScanning(false);
            setProgress({
                stage: 'idle',
                current: 0,
                total: 0,
                percentage: 100,
                message: data.message || 'Deep scan completed successfully!'
            });
            fetchReports();
        });

        return () => {
            socket.off('moderation:progress');
            socket.off('moderation:complete');
        };
    }, [socket]);

    const handleRunAnalysis = async () => {
        try {
            setScanning(true);
            setProgress({
                stage: 'users',
                current: 0,
                total: 0,
                percentage: 0,
                message: 'Initializing AI Deep Contextual Scanners...'
            });
            await api.post('/moderation/ai/run');
        } catch (err) {
            console.error('Failed to start deep scan', err);
            setScanning(false);
        }
    };

    const handleResolve = async (reportId: string, action: 'approve' | 'delete') => {
        try {
            const res = await api.post('/moderation/ai/resolve', { reportId, action });
            if (res.data.success) {
                setReports((prev) =>
                    prev.map((rep) =>
                        rep._id === reportId
                            ? { ...rep, status: action === 'approve' ? 'resolved_approved' : 'resolved_deleted' }
                            : rep
                    )
                );
            }
        } catch (err) {
            alert('Failed to resolve moderation report');
        }
    };

    const filteredReports = reports.filter(
        (r) => r.type === activeTab && r.status === 'pending'
    );

    const getSeverityStyles = (sev: 'low' | 'medium' | 'high') => {
        switch (sev) {
            case 'high':
                return 'bg-red-500/10 text-red-400 border border-red-500/30';
            case 'medium':
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
            default:
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8 pb-20 select-none font-mono"
        >
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                            AI Content <span className="text-red-500">Moderation</span> Shield
                        </h1>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Hybrid LLM & rule-based threat and content validation panel
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRunAnalysis}
                        disabled={scanning}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                            scanning
                                ? 'bg-red-950/20 text-red-400 border border-red-500/30 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-[0.98]'
                        }`}
                    >
                        {scanning ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 fill-white" />
                        )}
                        RUN DEEP CONTENT ANALYSIS
                    </button>
                </div>
            </div>

            {/* PROGRESS STREAM INDICATOR PANEL */}
            {(scanning || progress.percentage > 0) && (
                <div className="bg-card/90 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase text-gray-200 tracking-wider">
                                    AI Scanning Phase: {progress.stage.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold tracking-wide mt-0.5">
                                    {progress.message}
                                </span>
                            </div>
                        </div>
                        <span className="text-xl font-black text-white font-mono">{progress.percentage}%</span>
                    </div>

                    {/* Aesthetic Glow Progress bar */}
                    <div className="w-full h-2.5 bg-white/5 border border-white/10 rounded-full overflow-hidden relative">
                        <motion.div
                            className="h-full bg-gradient-to-r from-red-500 to-amber-500 shadow-[0_0_10px_#ef4444]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percentage}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
            )}

            {/* TAB SELECTORS */}
            <div className="flex items-center border-b border-white/5 gap-2 overflow-x-auto custom-scrollbar">
                {[
                    { key: 'post', label: 'FLAGGED POSTS', icon: FileText, count: reports.filter((r) => r.type === 'post' && r.status === 'pending').length },
                    { key: 'comment', label: 'FLAGGED COMMENTS', icon: MessageSquare, count: reports.filter((r) => r.type === 'comment' && r.status === 'pending').length },
                    { key: 'review', label: 'FLAGGED REVIEWS', icon: Star, count: reports.filter((r) => r.type === 'review' && r.status === 'pending').length },
                    { key: 'trust', label: 'SOCIAL TRUST & RISK', icon: ShieldAlert, count: flaggedContent.length },
                    { key: 'user', label: 'FLAGGED ACCOUNTS', icon: Users, count: reports.filter((r) => r.type === 'user' && r.status === 'pending').length }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative shrink-0 ${
                            activeTab === tab.key
                                ? 'text-red-400 border-b-2 border-red-500 bg-red-500/[0.02]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        <span className="ml-1.5 text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* CONTENT GRID */}
            {activeTab === 'trust' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1 & 2: Risky Users Registry */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-red-500" />
                                Risky Users Registry (Trust &lt; 80)
                            </h3>
                            <button
                                onClick={fetchTrustShieldData}
                                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10"
                                title="Refresh Trust Registry"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${trustLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {trustLoading ? (
                            <div className="flex items-center justify-center py-10 text-gray-500">
                                <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                            </div>
                        ) : riskyUsers.length === 0 ? (
                            <div className="p-8 rounded-3xl bg-card/40 border border-white/5 text-center text-xs text-gray-500 font-bold uppercase">
                                No risky users detected! All travelers are verified and trusted.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {riskyUsers.map((user) => (
                                    <div
                                        key={user._id}
                                        className="bg-card/80 border border-white/10 rounded-3xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                                                    {user.profilepicture ? (
                                                        <img src={user.profilepicture} alt={user.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.username.slice(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{user.username}</h4>
                                                    <p className="text-[9px] text-gray-500 font-bold font-sans truncate max-w-[150px]">{user.email}</p>
                                                </div>
                                            </div>

                                            {/* Scores grid */}
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400 mb-1">
                                                        <span>Trust score</span>
                                                        <span className={user.trustScore < 50 ? 'text-red-400' : 'text-amber-400'}>
                                                            {user.trustScore} / 100
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${user.trustScore < 50 ? 'bg-red-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${user.trustScore}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-[8px] font-black uppercase text-gray-500">
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-1.5 flex flex-col">
                                                        <span>Toxicity</span>
                                                        <span className="text-[10px] text-red-400 mt-0.5">{(user.toxicityScore * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-1.5 flex flex-col">
                                                        <span>Spam rate</span>
                                                        <span className="text-[10px] text-amber-400 mt-0.5">{(user.spamScore * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-1.5 flex flex-col">
                                                        <span>Fake Reviews</span>
                                                        <span className="text-[10px] text-purple-400 mt-0.5">{(user.fakeReviewScore * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-1.5 flex flex-col">
                                                        <span>Reports</span>
                                                        <span className="text-[10px] text-white mt-0.5">{user.reportCount || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 mt-4 border-t border-white/5 pt-3">
                                            <button
                                                onClick={() => {
                                                    setPenaltyModalUser(user.userId);
                                                    setPenaltyReason(`Flagged for review - toxic/spam activity.`);
                                                }}
                                                className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                            >
                                                Penalize
                                            </button>
                                            <button
                                                onClick={() => handleBanUser(user.userId, !user.isBanned, 'Community safety enforcement.')}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                                                    user.isBanned
                                                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                                                        : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
                                                }`}
                                            >
                                                {user.isBanned ? 'Unban' : 'Ban User'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Column 3: AI Fraud Moderation Logs */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            AI Fraud Logs
                        </h3>

                        {trustLoading ? (
                            <div className="flex items-center justify-center py-10 text-gray-500">
                                <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                            </div>
                        ) : flaggedContent.length === 0 ? (
                            <div className="p-8 rounded-3xl bg-card/40 border border-white/5 text-center text-xs text-gray-500 font-bold uppercase">
                                No flagged nodes.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {flaggedContent.map((log) => (
                                    <div
                                        key={log._id}
                                        className="bg-card/60 border border-white/5 rounded-3xl p-5 hover:border-red-500/10 transition-all space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
                                                {log.type} Flag
                                            </span>
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                                                AI Match: {(log.aiScore * 100).toFixed(0)}%
                                            </span>
                                        </div>

                                        <p className="text-[10px] text-gray-300 font-sans line-clamp-3 bg-white/[0.01] p-3 border border-white/5 rounded-xl">
                                            "{log.contentSnippet}"
                                        </p>

                                        <div className="flex gap-1.5 flex-wrap">
                                            {log.flags.map((flag: string) => (
                                                <span key={flag} className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 rounded">
                                                    {flag}
                                                </span>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handleDeleteFlaggedContent(log._id)}
                                            className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                        >
                                            Purge Flagged Node
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-red-500/55" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Retrieving audit data...</span>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card/40 border border-white/5 rounded-3xl p-8 text-center max-w-xl mx-auto gap-4">
                    <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Check className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Ecosystem Completely Sanitized</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed max-w-sm">
                            Zero content nodes are currently flagged. The platform complies with community guidelines!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {filteredReports.map((report) => (
                            <motion.div
                                key={report._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="bg-card/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-red-500/30 transition-all shadow-[0_0_20px_transparent] hover:shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                            >
                                <div className="space-y-4">
                                    {/* Badge Headers */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${getSeverityStyles(report.severity)}`}>
                                                {report.severity} severity
                                            </span>
                                            <span className="text-[8px] font-black uppercase px-2.5 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-full">
                                                AI Match: {(report.aiScore * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    </div>

                                    {/* Flagged Content Preview */}
                                    <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 relative group overflow-hidden">
                                        <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest leading-none block">
                                            FLAGGED VALUE Preview:
                                        </span>
                                        <p className="text-xs text-gray-200 font-medium leading-relaxed font-sans max-h-[80px] overflow-y-auto custom-scrollbar">
                                            "{report.flaggedContent}"
                                        </p>
                                    </div>

                                    {/* AI Reasoning logs */}
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest block">
                                            CLASSIFIER REPORT REASONING:
                                        </span>
                                        <p className="text-[10px] text-red-400 font-bold leading-normal">
                                            {report.reason}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 mt-6 border-t border-white/5 pt-4">
                                    <button
                                        onClick={() => handleResolve(report._id, 'approve')}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-[#050505] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        Clear / Whitelist
                                    </button>
                                    <button
                                        onClick={() => handleResolve(report._id, 'delete')}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Purge Content
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Manual Trust Score Penalty Modal */}
            {penaltyModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-card border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6">
                        <div className="flex flex-col gap-1.5">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Penalize Trust Score
                            </h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                Reduce user trust score manually to limit suspicious activities.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-black uppercase text-gray-500">Penalty Amount (Points)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={penaltyAmount}
                                    onChange={(e) => setPenaltyAmount(parseInt(e.target.value) || 10)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white uppercase font-black focus:outline-none focus:border-amber-500 transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-black uppercase text-gray-500">Reason for Penalty</label>
                                <textarea
                                    rows={3}
                                    value={penaltyReason}
                                    onChange={(e) => setPenaltyReason(e.target.value)}
                                    placeholder="Brief explanation..."
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white uppercase font-black focus:outline-none focus:border-amber-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPenaltyModalUser(null)}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePenalizeUser}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-[#050505] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            >
                                Apply Penalty
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Moderation;
