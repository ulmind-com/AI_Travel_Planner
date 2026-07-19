import React, { useEffect, useState, useRef } from 'react';
import api from '../services/adminApi';
import { 
    Mail, Send, Trash, Search, RefreshCw, AlertTriangle, CheckCircle, 
    Clock, Sparkles, User, Users, History, Eye, X, TrendingUp, Info, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subscriber {
    _id: string;
    userMail: string;
    createdAt: string;
}

interface EmailLog {
    _id: string;
    to: string;
    subject: string;
    html: string;
    status: 'sent' | 'pending' | 'failed' | 'draft' | 'delivered';
    sentAt: string;
    createdAt: string;
}

interface GroupedCampaign {
    subject: string;
    html: string;
    sentAt: string;
    recipients: string[];
    successCount: number;
    failedCount: number;
}

const MailPage: React.FC = () => {
    // Tabs state: 'compose' or 'history'
    const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
    
    // Core Data States
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [campaigns, setCampaigns] = useState<GroupedCampaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<GroupedCampaign | null>(null);
    
    // Loading & Operation States
    const [loadingSubscribers, setLoadingSubscribers] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [generatingAi, setGeneratingAi] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    
    // Search & Inputs
    const [subscriberSearch, setSubscriberSearch] = useState('');
    const [aiTopic, setAiTopic] = useState('');
    const [campaignSubject, setCampaignSubject] = useState('');
    const [campaignHtml, setCampaignHtml] = useState('');
    const [composerView, setComposerView] = useState<'edit' | 'preview'>('edit');
    
    // Feedback alerts
    const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Fetch Subscribers
    const fetchSubscribers = async () => {
        try {
            setLoadingSubscribers(true);
            const res = await api.get('/subscribers');
            setSubscribers(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch subscribers', error);
            showAlert('error', 'Failed to retrieve subscriber directory.');
        } finally {
            setLoadingSubscribers(false);
        }
    };

    // Fetch Broadcast Email Logs & group them into Campaigns
    const fetchBroadcastHistory = async () => {
        try {
            setLoadingLogs(true);
            // Fetch sent email logs of category 'Marketing'
            const res = await api.get('/mail', { params: { category: 'Marketing', limit: 200 } });
            const logs: EmailLog[] = Array.isArray(res.data.data) 
                ? res.data.data 
                : (res.data.data?.emails || []);
            
            setEmailLogs(logs);

            // Group email logs by unique subject line to form Campaign records
            const grouped: GroupedCampaign[] = [];
            logs.forEach(log => {
                let camp = grouped.find(c => c.subject.trim() === log.subject.trim());
                if (!camp) {
                    camp = {
                        subject: log.subject,
                        html: log.html,
                        sentAt: log.sentAt || log.createdAt,
                        recipients: [],
                        successCount: 0,
                        failedCount: 0
                    };
                    grouped.push(camp);
                }
                if (!camp.recipients.includes(log.to)) {
                    camp.recipients.push(log.to);
                }
                if (log.status === 'sent' || log.status === 'delivered') {
                    camp.successCount++;
                } else if (log.status === 'failed') {
                    camp.failedCount++;
                }
            });
            setCampaigns(grouped);
        } catch (error) {
            console.error('Failed to fetch broadcast logs', error);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
        fetchBroadcastHistory();
    }, []);

    // Helper to display temp alert notifications
    const showAlert = (type: 'success' | 'error' | 'info', text: string) => {
        setAlertMsg({ type, text });
        setTimeout(() => setAlertMsg(null), 5000);
    };

    // Delete a subscriber
    const handleDeleteSubscriber = async (id: string, email: string) => {
        if (!window.confirm(`Are you sure you want to remove ${email} from the newsletter?`)) return;
        try {
            await api.delete(`/subscribers/${id}`);
            setSubscribers(prev => prev.filter(s => s._id !== id));
            showAlert('success', `${email} unsubscribed successfully.`);
        } catch (error) {
            console.error('Failed to delete subscriber', error);
            showAlert('error', 'Failed to remove subscriber.');
        }
    };

    // Generate Newsletter with AI
    const handleGenerateAi = async () => {
        if (generatingAi) return;
        setGeneratingAi(true);
        setAlertMsg(null);
        try {
            const res = await api.post('/mail/generate-ai', { topic: aiTopic });
            const { subject, html } = res.data.data;
            setCampaignSubject(subject);
            setCampaignHtml(html);
            showAlert('success', 'AI successfully composed the newsletter campaign!');
            setComposerView('preview');
        } catch (error: any) {
            console.error('AI Generation failed', error);
            showAlert('error', error.response?.data?.message || 'AI content generation failed. Please try again.');
        } finally {
            setGeneratingAi(false);
        }
    };

    // Broadcast Campaign to all Subscribers
    const handleBroadcast = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }

        console.log('Initiating newsletter broadcast...', {
            subject: campaignSubject,
            htmlLength: campaignHtml?.length,
            subscribers: subscribers.length
        });

        if (!campaignSubject || !campaignHtml) {
            showAlert('error', 'Please ensure both subject and newsletter content are provided.');
            return;
        }

        if (subscribers.length === 0) {
            showAlert('error', 'Cannot broadcast: subscriber count is 0.');
            return;
        }

        const confirmMsg = `Confirm Action:\n\nBroadcast this campaign to all ${subscribers.length} active newsletter subscribers?`;
        if (!window.confirm(confirmMsg)) {
            console.log('Broadcast cancelled by administrator confirmation dialog.');
            return;
        }

        setBroadcasting(true);
        setAlertMsg(null);
        try {
            console.log('Sending broadcast POST request to backend...');
            const res = await api.post('/mail/broadcast', {
                subject: campaignSubject,
                html: campaignHtml
            });
            console.log('Broadcast request response:', res.data);
            showAlert('success', res.data.message || 'Newsletter broadcast dispatched successfully!');
            // Reset composer fields
            setCampaignSubject('');
            setCampaignHtml('');
            setAiTopic('');
            setComposerView('edit');
            // Refresh counts and campaigns list
            fetchBroadcastHistory();
        } catch (error: any) {
            console.error('Broadcast failed:', error);
            showAlert('error', error.response?.data?.message || 'Broadcast execution failed.');
        } finally {
            setBroadcasting(false);
        }
    };

    // Filtered subscriber list based on search bar
    const filteredSubscribers = subscribers.filter(s => 
        s.userMail.toLowerCase().includes(subscriberSearch.toLowerCase())
    );

    // Initial avatar bubble gradient logic
    const getAvatarGradient = (emailStr: string) => {
        const colors = [
            'from-indigo-500 to-purple-600 border-indigo-500/20 text-indigo-300 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.15)]',
            'from-emerald-500 to-teal-600 border-emerald-500/20 text-emerald-300 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
            'from-pink-500 to-rose-600 border-pink-500/20 text-pink-300 bg-pink-500/10 shadow-[0_0_12px_rgba(236,72,153,0.15)]',
            'from-amber-500 to-orange-600 border-amber-500/20 text-amber-300 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
            'from-sky-500 to-blue-600 border-sky-500/20 text-sky-300 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
        ];
        let hash = 0;
        for (let i = 0; i < emailStr.length; i++) {
            hash = emailStr.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const getInitials = (emailStr: string) => {
        if (!emailStr) return '?';
        return emailStr.substring(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-6 pb-20 select-none font-sans text-gray-200">
            {/* Alert banner overlay */}
            <AnimatePresence>
                {alertMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl ${
                            alertMsg.type === 'success' 
                                ? 'bg-emerald-950/85 border-emerald-500/35 text-emerald-300' 
                                : alertMsg.type === 'error'
                                ? 'bg-rose-950/85 border-rose-500/35 text-rose-300'
                                : 'bg-indigo-950/85 border-indigo-500/35 text-indigo-300'
                        }`}
                    >
                        {alertMsg.type === 'success' && <CheckCircle className="w-5 h-5" />}
                        {alertMsg.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                        {alertMsg.type === 'info' && <Info className="w-5 h-5" />}
                        <span className="text-xs font-semibold tracking-wide">{alertMsg.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-b-white/5 pb-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
                            BROADCAST <span className="text-indigo-400">CENTER</span>
                        </h1>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        AI-powered newsletter composition and system-wide broadcast delivery spools
                    </p>
                </div>
                
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-1 rounded-full">
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                            activeTab === 'compose'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                        AI Broadcast
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('history');
                            fetchBroadcastHistory();
                        }}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                            activeTab === 'history'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <History className="w-3.5 h-3.5 inline mr-1.5" />
                        Sent Campaigns
                    </button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="backdrop-blur-md border border-indigo-500/10 hover:border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.02] to-indigo-500/[0.04] rounded-2xl p-4 flex items-center justify-between shadow-lg transition-all duration-300">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Total Subscribers</span>
                        <span className="text-2xl font-black text-white">{loadingSubscribers ? '...' : subscribers.length}</span>
                        <span className="text-[9px] text-gray-400 block font-medium">Active audience directory</span>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                <div className="backdrop-blur-md border border-emerald-500/10 hover:border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.02] to-emerald-500/[0.04] rounded-2xl p-4 flex items-center justify-between shadow-lg transition-all duration-300">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Broadcasts Sent</span>
                        <span className="text-2xl font-black text-white">{loadingLogs ? '...' : campaigns.length}</span>
                        <span className="text-[9px] text-gray-400 block font-medium">Distinct newsletter campaigns</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        <Send className="w-5 h-5" />
                    </div>
                </div>

                <div className="backdrop-blur-md border border-amber-500/10 hover:border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-amber-500/[0.04] rounded-2xl p-4 flex items-center justify-between shadow-lg transition-all duration-300">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Delivery Volume</span>
                        <span className="text-2xl font-black text-white">{loadingLogs ? '...' : emailLogs.length}</span>
                        <span className="text-[9px] text-gray-400 block font-medium">Total SMTP dispatches logged</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25">
                        <Mail className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                
                {/* Column 1: Subscribed Audience (col-span-4) */}
                <div className="lg:col-span-4 bg-[#0f0f11]/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[65vh] w-full">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500"></div>
                    
                    {/* Header info */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider block">Audience Directory</span>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Manage newsletter list</span>
                        </div>
                        <button 
                            onClick={fetchSubscribers}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Subscriber Search Bar */}
                    <div className="px-4 py-2 border-b border-white/5">
                        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2">
                            <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Search subscribers..."
                                value={subscriberSearch}
                                onChange={(e) => setSubscriberSearch(e.target.value)}
                                className="bg-transparent text-xs text-gray-200 focus:outline-none w-full placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    {/* Viewport list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {loadingSubscribers ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <span className="w-6 h-6 border-2 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Loading Directory...</span>
                            </div>
                        ) : filteredSubscribers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500 gap-2">
                                <Users className="w-5 h-5 text-gray-600" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">No subscribers match search</span>
                            </div>
                        ) : (
                            filteredSubscribers.map((sub) => (
                                <div
                                    key={sub._id}
                                    className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between gap-3 group hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarGradient(sub.userMail)} border flex items-center justify-center font-black text-[9px] tracking-wider shrink-0`}>
                                            {getInitials(sub.userMail)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-extrabold text-white truncate">{sub.userMail}</p>
                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                                Joined {new Date(sub.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSubscriber(sub._id, sub.userMail)}
                                        className="p-1.5 hover:bg-rose-500/10 rounded-lg text-gray-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Unsubscribe user"
                                    >
                                        <Trash className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Column 2: Interactive Composer (compose tab) or Campaign history (history tab) (col-span-8) */}
                <div className="lg:col-span-8 bg-[#0f0f11]/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[65vh] w-full relative">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                    {activeTab === 'compose' ? (
                        /* ================= COMPOSE TAB ================= */
                        <div className="flex flex-col h-full">
                            {/* Title & Preview Toggle */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider block">AI Broadcast Composer</span>
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Instruct AI, review markup, and send</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-xl p-1">
                                    <button
                                        onClick={() => setComposerView('edit')}
                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                                            composerView === 'edit'
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Edit Content
                                    </button>
                                    <button
                                        onClick={() => setComposerView('preview')}
                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                                            composerView === 'preview'
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Live Preview
                                    </button>
                                </div>
                            </div>

                            {/* Viewport editor content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {/* AI Instructions panel */}
                                <div className="space-y-2.5 bg-indigo-500/[0.01] border border-indigo-500/10 rounded-xl p-4 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
                                    <div className="flex items-center gap-1.5 text-indigo-400">
                                        <Sparkles className="w-4 h-4 animate-pulse" />
                                        <label className="text-[9px] font-black uppercase tracking-wider">AI Content Assistant (Groq Engine)</label>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            value={aiTopic}
                                            onChange={(e) => setAiTopic(e.target.value)}
                                            placeholder="Specify destination or newsletter theme (e.g. 'Backpacking in Japan')"
                                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                        />
                                        <button
                                            type="button"
                                            disabled={generatingAi}
                                            onClick={handleGenerateAi}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                        >
                                            {generatingAi ? (
                                                <>
                                                    <span className="w-3 h-3 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
                                                    Writing...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    Generate
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {composerView === 'edit' ? (
                                    /* Raw Edit Panel */
                                    <form onSubmit={handleBroadcast} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Broadcast Subject Line</label>
                                            <input
                                                type="text"
                                                value={campaignSubject}
                                                onChange={(e) => setCampaignSubject(e.target.value)}
                                                placeholder="Enter newsletter subject..."
                                                className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">HTML Content Spool</label>
                                            <textarea
                                                value={campaignHtml}
                                                onChange={(e) => setCampaignHtml(e.target.value)}
                                                placeholder="Write or edit HTML template markup here..."
                                                className="w-full h-48 bg-black border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 font-mono leading-relaxed"
                                                required
                                            />
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="submit"
                                                disabled={broadcasting || subscribers.length === 0}
                                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:scale-[1.01]"
                                            >
                                                {broadcasting ? (
                                                    <>
                                                        <span className="w-3.5 h-3.5 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
                                                        Broadcasting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-3.5 h-3.5" />
                                                        Broadcast to {subscribers.length} Subscribers
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* Live Preview Panel */
                                    <div className="space-y-4">
                                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Subject Preview</span>
                                            <span className="text-xs font-extrabold text-white mt-0.5 block">{campaignSubject || '(No Subject Provided)'}</span>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Newsletter Mock Envelope Renders</span>
                                            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 text-sm leading-relaxed overflow-x-auto text-gray-200 min-h-[200px] max-h-[30vh] overflow-y-auto custom-scrollbar relative">
                                                <style>{`
                                                    .email-preview-wrap,
                                                    .email-preview-wrap * {
                                                        background-color: transparent !important;
                                                        background: transparent !important;
                                                    }
                                                    .email-preview-wrap > div {
                                                        background: transparent !important;
                                                        border: none !important;
                                                        box-shadow: none !important;
                                                    }
                                                    .email-preview-wrap h1, .email-preview-wrap h2, .email-preview-wrap h3 {
                                                        color: #ffffff !important;
                                                        font-size: 1.25rem !important;
                                                        font-weight: 800 !important;
                                                        margin-top: 1rem !important;
                                                        margin-bottom: 0.5rem !important;
                                                        border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                                                        padding-bottom: 0.25rem !important;
                                                    }
                                                    .email-preview-wrap h4, .email-preview-wrap h5, .email-preview-wrap h6 {
                                                        color: #e5e7eb !important;
                                                        font-weight: 700 !important;
                                                    }
                                                    .email-preview-wrap p, .email-preview-wrap span, .email-preview-wrap td, .email-preview-wrap th {
                                                        color: #d1d5db !important;
                                                        margin-bottom: 0.75rem !important;
                                                        line-height: 1.6 !important;
                                                    }
                                                    .email-preview-wrap ul, .email-preview-wrap ol {
                                                        margin-left: 1.25rem !important;
                                                        margin-bottom: 0.75rem !important;
                                                        color: #d1d5db !important;
                                                    }
                                                    .email-preview-wrap li {
                                                        margin-bottom: 0.25rem !important;
                                                        color: #d1d5db !important;
                                                    }
                                                    .email-preview-wrap strong, .email-preview-wrap b {
                                                        color: #ffffff !important;
                                                        font-weight: 700 !important;
                                                    }
                                                    .email-preview-wrap a {
                                                        color: #818cf8 !important;
                                                        text-decoration: underline !important;
                                                    }
                                                    .email-preview-wrap a[style*="background"],
                                                    .email-preview-wrap a[style*="padding"] {
                                                        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
                                                        color: #ffffff !important;
                                                        text-decoration: none !important;
                                                        border-radius: 8px !important;
                                                        display: inline-block !important;
                                                        padding: 10px 24px !important;
                                                    }
                                                    .email-preview-wrap table {
                                                        border-color: rgba(255,255,255,0.1) !important;
                                                    }
                                                    .email-preview-wrap hr {
                                                        border-color: rgba(255,255,255,0.1) !important;
                                                    }
                                                    .email-preview-wrap img {
                                                        border-radius: 8px !important;
                                                        max-width: 100% !important;
                                                    }
                                                `}</style>
                                                {campaignHtml ? (
                                                    <div 
                                                        className="email-preview-wrap"
                                                        dangerouslySetInnerHTML={{ __html: campaignHtml }}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center gap-2">
                                                        <Eye className="w-5 h-5 text-gray-600" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Live Preview is empty</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[9px] text-gray-400 font-semibold flex items-center gap-1.5">
                                                <Info className="w-3.5 h-3.5 text-indigo-400" />
                                                Review HTML styling before blasting
                                            </span>
                                            <button
                                                onClick={handleBroadcast}
                                                disabled={broadcasting || !campaignSubject || !campaignHtml || subscribers.length === 0}
                                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:scale-[1.01]"
                                            >
                                                {broadcasting ? (
                                                    <>
                                                        <span className="w-3.5 h-3.5 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
                                                        Broadcasting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-3.5 h-3.5" />
                                                        Broadcast to {subscribers.length} Subscribers
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ================= HISTORY TAB ================= */
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider block">Sent Broadcast Campaigns</span>
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">History log archives</span>
                                </div>
                                <button
                                    onClick={fetchBroadcastHistory}
                                    className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                                {/* Campaign list selection */}
                                <div className="md:col-span-5 border-r border-white/5 overflow-y-auto custom-scrollbar p-3 space-y-2 h-full">
                                    {loadingLogs ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                                            <span className="w-5 h-5 border-2 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Loading History...</span>
                                        </div>
                                    ) : campaigns.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center gap-2">
                                            <History className="w-5 h-5 text-gray-600 animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 font-bold">No campaign history logged</span>
                                        </div>
                                    ) : (
                                        campaigns.map((camp, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedCampaign(camp)}
                                                className={`p-3 rounded-xl cursor-pointer transition-all border flex flex-col gap-2 ${
                                                    selectedCampaign?.subject === camp.subject
                                                        ? 'bg-indigo-600/[0.06] border-indigo-500/20 shadow-md'
                                                        : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="text-[10px] font-black text-white truncate flex-1 leading-snug">{camp.subject}</span>
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                                                </div>
                                                <div className="flex items-center justify-between text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                                    <span>{camp.recipients.length} Recipient(s)</span>
                                                    <span>{new Date(camp.sentAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Selected Campaign Inspector details */}
                                <div className="md:col-span-7 p-4 overflow-y-auto custom-scrollbar h-full space-y-4">
                                    {selectedCampaign ? (
                                        <div className="space-y-4">
                                            <div className="border-b border-white/5 pb-3 space-y-1">
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Selected Campaign</span>
                                                <h4 className="text-xs font-black text-white leading-relaxed">{selectedCampaign.subject}</h4>
                                                <div className="flex flex-wrap items-center gap-3 text-[8px] font-bold text-gray-400 uppercase tracking-widest pt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3 text-indigo-400" />
                                                        {selectedCampaign.recipients.length} Recipients
                                                    </span>
                                                    <span className="flex items-center gap-1 text-emerald-400">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {selectedCampaign.successCount} Sent
                                                    </span>
                                                    {selectedCampaign.failedCount > 0 && (
                                                        <span className="flex items-center gap-1 text-rose-400">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {selectedCampaign.failedCount} Failed
                                                        </span>
                                                    )}
                                                    <span className="text-[8px] text-gray-500 ml-auto font-bold uppercase tracking-widest">
                                                        {new Date(selectedCampaign.sentAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* HTML body preview box */}
                                            <div className="space-y-1.5">
                                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Delivered Template Payload</span>
                                                <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 text-xs leading-relaxed overflow-x-auto text-gray-300 max-h-[30vh] overflow-y-auto custom-scrollbar relative">
                                                    <style>{`
                                                        .campaign-preview-html,
                                                        .campaign-preview-html * {
                                                            background-color: transparent !important;
                                                            background: transparent !important;
                                                        }
                                                        .campaign-preview-html > div {
                                                            background: transparent !important;
                                                            border: none !important;
                                                            box-shadow: none !important;
                                                        }
                                                        .campaign-preview-html h1, .campaign-preview-html h2, .campaign-preview-html h3 {
                                                            color: #ffffff !important;
                                                            font-size: 1.15rem !important;
                                                            font-weight: 800 !important;
                                                            margin-top: 0.75rem !important;
                                                            margin-bottom: 0.5rem !important;
                                                            border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                                                            padding-bottom: 0.25rem !important;
                                                        }
                                                        .campaign-preview-html h4, .campaign-preview-html h5, .campaign-preview-html h6 {
                                                            color: #e5e7eb !important;
                                                            font-weight: 700 !important;
                                                        }
                                                        .campaign-preview-html p, .campaign-preview-html span, .campaign-preview-html td, .campaign-preview-html th {
                                                            color: #d1d5db !important;
                                                            margin-bottom: 0.5rem !important;
                                                            line-height: 1.5 !important;
                                                        }
                                                        .campaign-preview-html ul, .campaign-preview-html ol {
                                                            margin-left: 1rem !important;
                                                            margin-bottom: 0.5rem !important;
                                                            color: #d1d5db !important;
                                                        }
                                                        .campaign-preview-html li {
                                                            margin-bottom: 0.25rem !important;
                                                            color: #d1d5db !important;
                                                        }
                                                        .campaign-preview-html strong, .campaign-preview-html b {
                                                            color: #ffffff !important;
                                                            font-weight: 700 !important;
                                                        }
                                                        .campaign-preview-html a {
                                                            color: #818cf8 !important;
                                                            text-decoration: underline !important;
                                                        }
                                                        .campaign-preview-html a[style*="background"],
                                                        .campaign-preview-html a[style*="padding"] {
                                                            background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
                                                            color: #ffffff !important;
                                                            text-decoration: none !important;
                                                            border-radius: 8px !important;
                                                            display: inline-block !important;
                                                            padding: 10px 24px !important;
                                                        }
                                                        .campaign-preview-html table {
                                                            border-color: rgba(255,255,255,0.1) !important;
                                                        }
                                                        .campaign-preview-html hr {
                                                            border-color: rgba(255,255,255,0.1) !important;
                                                        }
                                                        .campaign-preview-html img {
                                                            border-radius: 8px !important;
                                                            max-width: 100% !important;
                                                        }
                                                    `}</style>
                                                    <div 
                                                        className="campaign-preview-html"
                                                        dangerouslySetInnerHTML={{ __html: selectedCampaign.html }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500 gap-2">
                                            <Eye className="w-5 h-5 text-gray-600 animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Select campaign to inspect stats</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MailPage;
