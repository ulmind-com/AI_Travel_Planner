import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Shield, Fingerprint, RefreshCw, Radio, Server, ShieldCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/adminApi';
import { useSocket } from '../../context/AdminSocketContext';

// Components
import { AuditFilters } from './AuditFilters';
import { AuditCharts } from './AuditCharts';
import { AuditTable } from './AuditTable';
import { AuditDetailsDrawer } from './AuditDetailsDrawer';

interface AuditLog {
    _id: string;
    action: string;
    module: string;
    entityId?: string;
    entityType?: string;
    performedBy: string;
    severity: 'info' | 'warning' | 'critical';
    status: 'success' | 'failed';
    message: string;
    timestamp: string;
}

interface AuditAnalytics {
    totalLogs: number;
    severityDistribution: {
        info: number;
        warning: number;
        critical: number;
    };
    moduleDistribution: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    volumeOverTime: Array<{ date: string; count: number }>;
}

export const AuditPage: React.FC = () => {
    // Socket
    const { socket } = useSocket();

    // States
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [analytics, setAnalytics] = useState<AuditAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [liveTickerEvents, setLiveTickerEvents] = useState<string[]>(['[SIEM INITIALIZED] Listening to channel stream...']);

    // Filters
    const [search, setSearch] = useState('');
    const [module, setModule] = useState('all');
    const [severity, setSeverity] = useState('all');
    const [status, setStatus] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        pages: 1,
        limit: 10
    });

    // Fetch Logs and Telemetry Analytics
    const fetchAuditTelemetry = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            if (search) queryParams.append('search', search);
            if (module !== 'all') queryParams.append('module', module);
            if (severity !== 'all') queryParams.append('severity', severity);
            if (status !== 'all') queryParams.append('status', status);
            if (dateFrom) queryParams.append('dateFrom', dateFrom);
            if (dateTo) queryParams.append('dateTo', dateTo);

            const res = await api.get(`/audit?${queryParams.toString()}`);
            const payload = res.data.data;

            setLogs(payload.logs);
            setPagination(payload.pagination);
            setAnalytics(payload.analytics);
        } catch (error) {
            console.error('Failed to pull SIEM audit telemetries:', error);
            toast.error('Observability Link Failure: Could not load logs index');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Load on parameter changes
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAuditTelemetry();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, module, severity, status, dateFrom, dateTo, limit, page]);

    // Handle Socket real-time push events
    useEffect(() => {
        if (!socket) return;

        const handleNewAuditLog = (newLog: AuditLog) => {
            console.log('[DEBUG] Real-time SIEM log packet parsed:', newLog);

            // Add ticker line
            const timeStr = new Date(newLog.timestamp).toLocaleTimeString([], { hour12: false });
            const tickerText = `[${timeStr}] ALERT: Operator @${newLog.performedBy} executed [${newLog.action}] on module [${newLog.module}] severity=[${newLog.severity}]`;
            setLiveTickerEvents(prev => [tickerText, ...prev.slice(0, 10)]);

            // 1. Show notification toast
            toast.custom((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-[#08080c]/95 border border-white/10 backdrop-blur-3xl shadow-[0_0_40px_rgba(6,182,212,0.2)] rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 font-mono select-none border-l-4 border-l-cyan-500`}
                >
                    <div className="flex-1 w-0">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                        newLog.severity === 'critical' ? 'bg-red-400' : newLog.severity === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'
                                    }`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                        newLog.severity === 'critical' ? 'bg-red-500' : newLog.severity === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
                                    }`}></span>
                                </span>
                            </div>
                            <div className="ml-3 flex-1 text-left">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                    LIVE TELEMETRY: {newLog.action.replace(/_/g, ' ')}
                                </p>
                                <p className="mt-1 text-[11px] text-gray-400 leading-tight font-bold">
                                    {newLog.message}
                                </p>
                                <p className="mt-1.5 text-[9px] text-gray-500 font-black">
                                    Operator: @{newLog.performedBy} • Module: {newLog.module}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 4000 });

            // 2. Prepend log if it passes current filter bounds
            setLogs((prevLogs) => {
                const matchesModule = module === 'all' || newLog.module === module;
                const matchesSeverity = severity === 'all' || newLog.severity === severity;
                const matchesStatus = status === 'all' || newLog.status === status;
                
                if (matchesModule && matchesSeverity && matchesStatus) {
                    return [newLog, ...prevLogs.slice(0, limit - 1)];
                }
                return prevLogs;
            });

            // 3. Update charts live state values
            setAnalytics((prevAnalytics) => {
                if (!prevAnalytics) return null;

                const severityDist = { ...prevAnalytics.severityDistribution };
                if (newLog.severity in severityDist) {
                    severityDist[newLog.severity] = (severityDist[newLog.severity] || 0) + 1;
                }

                const moduleDist = { ...prevAnalytics.moduleDistribution };
                moduleDist[newLog.module] = (moduleDist[newLog.module] || 0) + 1;

                return {
                    ...prevAnalytics,
                    totalLogs: prevAnalytics.totalLogs + 1,
                    severityDistribution: severityDist,
                    moduleDistribution: moduleDist
                };
            });
        };

        socket.on('audit:new', handleNewAuditLog);

        return () => {
            socket.off('audit:new', handleNewAuditLog);
        };
    }, [socket, module, severity, status, limit]);

    const handleReset = () => {
        setSearch('');
        setModule('all');
        setSeverity('all');
        setStatus('all');
        setDateFrom('');
        setDateTo('');
        setPage(1);
        toast.success('SIEM Parameters Flushed');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 pb-24 select-none font-mono"
        >
            {/* Header section with live HUD metrics */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-cyan-400" />
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                            SIEM Audit <span className="text-cyan-400">Observability</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2.5 mt-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                            Global Telemetry Broker Stream Active • 127.0.0.1:5173
                        </p>
                    </div>
                </div>

                {/* Server Status Panels */}
                <div className="flex flex-wrap items-center gap-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2 bg-[#0c0c14] border border-white/5 px-4 py-2 rounded-xl">
                        <Server className="w-3.5 h-3.5 text-cyan-400" />
                        <div>
                            <span className="block text-gray-600 text-[8px]">CORE NODES</span>
                            <span className="text-white font-black">NEXUS_MAIN_SHIELD</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#0c0c14] border border-white/5 px-4 py-2 rounded-xl">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <div>
                            <span className="block text-gray-600 text-[8px]">ROUTING FIREWALL</span>
                            <span className="text-white font-black">SECURE_TUNNEL</span>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchAuditTelemetry()}
                        className="flex items-center gap-2 px-4 py-3 border border-white/5 hover:border-cyan-500/20 rounded-xl text-[9px] font-black text-gray-400 hover:text-cyan-400 bg-[#0c0c14] hover:bg-cyan-500/5 transition-all uppercase tracking-widest shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Sync Registry
                    </button>
                </div>
            </div>

            {/* Visual Analytics telemetry */}
            <AuditCharts analytics={analytics} />

            {/* Terminal Live Stream Ticker Panel */}
            <div className="bg-[#050509] border border-white/5 p-4 rounded-xl relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] h-32 flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-2 z-10 flex items-center gap-1.5 text-[8px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded font-black tracking-widest">
                    <Activity className="w-2.5 h-2.5 animate-pulse" />
                    LIVE TELEMETRY TICKER
                </div>
                <div className="space-y-1 overflow-y-auto scrollbar-none flex-1 mt-4">
                    {liveTickerEvents.map((t, idx) => (
                        <div key={idx} className="text-[10px] text-emerald-400 font-bold tracking-tight select-all truncate opacity-90 hover:opacity-100 transition-opacity">
                            {t}
                        </div>
                    ))}
                </div>
            </div>

            {/* Matrix Filters */}
            <AuditFilters
                search={search}
                setSearch={setSearch}
                module={module}
                setModule={setModule}
                severity={severity}
                setSeverity={setSeverity}
                status={status}
                setStatus={setStatus}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                limit={limit}
                setLimit={setLimit}
                onReset={handleReset}
            />

            {/* Stream list table */}
            <AuditTable
                logs={logs}
                loading={loading}
                onSelectLog={(log) => setSelectedLogId(log._id)}
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
            />

            {/* Dynamic drawer detail inspector */}
            <AnimatePresence>
                {selectedLogId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLogId(null)}
                            className="fixed inset-0 bg-black/80 z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 z-50"
                        >
                            <AuditDetailsDrawer
                                logId={selectedLogId}
                                onClose={() => setSelectedLogId(null)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
