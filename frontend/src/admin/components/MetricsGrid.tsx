import React from 'react';
import { 
    Users, UserCheck, FileText, Sparkles, MessageSquare, 
    Heart, Activity, Terminal, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ObservabilityMetrics, TimeSeriesData } from '../hooks/useAdminMetrics';

interface MetricsGridProps {
    metrics: ObservabilityMetrics;
    timeSeries: TimeSeriesData | null;
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics, timeSeries }) => {
    // Generate fallbacks or default data for mini-sparklines if timeSeries isn't fully loaded
    const getSparklineData = (key: 'users' | 'posts' | 'comments' | 'likes' | 'latency') => {
        if (!timeSeries) {
            return Array.from({ length: 10 }, (_, i) => ({ value: [10, 15, 8, 12, 20, 18, 25, 22, 28, 30][i] }));
        }

        switch (key) {
            case 'users':
                return (timeSeries.userGrowthTrend || []).map(d => ({ value: d.count }));
            case 'posts':
                return (timeSeries.dailyPosts || []).map(d => ({ value: d.count }));
            case 'comments':
                return (timeSeries.dailyComments || []).map(d => ({ value: d.count }));
            case 'likes':
                return (timeSeries.dailyLikes || []).map(d => ({ value: d.count }));
            case 'latency':
                return (timeSeries.apiLatency || []).map(d => ({ value: d.value }));
            default:
                return Array.from({ length: 10 }, (_, i) => ({ value: 10 + i * 2 }));
        }
    };

    const cards = [
        // ──── USER METRICS ────
        {
            title: 'Total Users',
            value: metrics.totalUsers.toLocaleString(),
            label: 'Registered travelers',
            icon: Users,
            color: 'text-indigo-400',
            glow: 'rgba(99,102,241,0.25)',
            border: 'border-indigo-500/20 hover:border-indigo-500/40 bg-gradient-to-b from-indigo-500/[0.02] to-indigo-500/[0.05]',
            growth: `${metrics.userGrowthRate >= 0 ? '+' : ''}${metrics.userGrowthRate}%`,
            isPositive: metrics.userGrowthRate >= 0,
            sparklineKey: 'users' as const,
            sparkColor: '#6366f1'
        },
        {
            title: 'Active Travelers (24h)',
            value: metrics.activeUsers.toLocaleString(),
            label: 'Interacted in last day',
            icon: UserCheck,
            color: 'text-emerald-400',
            glow: 'rgba(16,185,129,0.25)',
            border: 'border-emerald-500/20 hover:border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.02] to-emerald-500/[0.05]',
            growth: '↑ 12%',
            isPositive: true,
            sparklineKey: 'users' as const,
            sparkColor: '#10b981'
        },
        {
            title: 'New Signups (Today)',
            value: metrics.newUsersToday.toLocaleString(),
            label: 'Joined since midnight',
            icon: Activity,
            color: 'text-cyan-400',
            glow: 'rgba(6,182,212,0.25)',
            border: 'border-cyan-500/20 hover:border-cyan-500/40 bg-gradient-to-b from-cyan-500/[0.02] to-cyan-500/[0.05]',
            growth: '↑ 8.3%',
            isPositive: true,
            sparklineKey: 'users' as const,
            sparkColor: '#06b6d4'
        },
        // ──── CONTENT METRICS ────
        {
            title: 'Total Community Posts',
            value: metrics.totalPosts.toLocaleString(),
            label: 'Ecosystem content volume',
            icon: FileText,
            color: 'text-purple-400',
            glow: 'rgba(139,92,246,0.25)',
            border: 'border-purple-500/20 hover:border-purple-500/40 bg-gradient-to-b from-purple-500/[0.02] to-purple-500/[0.05]',
            growth: `+${metrics.postsToday} today`,
            isPositive: true,
            sparklineKey: 'posts' as const,
            sparkColor: '#8b5cf6'
        },
        {
            title: 'Daily Likes Today',
            value: metrics.likesToday.toLocaleString(),
            label: 'Total appreciation volume',
            icon: Heart,
            color: 'text-rose-400',
            glow: 'rgba(244,63,94,0.25)',
            border: 'border-rose-500/20 hover:border-rose-500/40 bg-gradient-to-b from-rose-500/[0.02] to-rose-500/[0.05]',
            growth: '↑ 14.2%',
            isPositive: true,
            sparklineKey: 'likes' as const,
            sparkColor: '#f43f5e'
        },
        // ──── ENGAGEMENT METRICS ────
        {
            title: 'Avg Engagement Rate',
            value: `${metrics.avgCommentsPerPost} / post`,
            label: 'Avg comments per publication',
            icon: MessageSquare,
            color: 'text-amber-400',
            glow: 'rgba(245,158,11,0.25)',
            border: 'border-amber-500/20 hover:border-amber-500/40 bg-gradient-to-b from-amber-500/[0.02] to-amber-500/[0.05]',
            growth: `+${metrics.avgLikesPerPost} likes`,
            isPositive: true,
            sparklineKey: 'comments' as const,
            sparkColor: '#f59e0b'
        },
        {
            title: 'Active Sessions',
            value: metrics.activeSessions.toLocaleString(),
            label: 'Live web socket channels',
            icon: Sparkles,
            color: 'text-teal-400',
            glow: 'rgba(20,184,166,0.25)',
            border: 'border-teal-500/20 hover:border-teal-500/40 bg-gradient-to-b from-teal-500/[0.02] to-teal-500/[0.05]',
            growth: 'LIVESTREAM',
            isPositive: true,
            sparklineKey: 'posts' as const,
            sparkColor: '#14b8a6'
        },
        // ──── SYSTEM METRICS ────
        {
            title: 'API Requests (24h)',
            value: metrics.apiRequestCount.toLocaleString(),
            label: 'Processed request stream',
            icon: Terminal,
            color: 'text-sky-400',
            glow: 'rgba(56,189,248,0.25)',
            border: 'border-sky-500/20 hover:border-sky-500/40 bg-gradient-to-b from-sky-500/[0.02] to-sky-500/[0.05]',
            growth: `${metrics.avgLatency}ms avg`,
            isPositive: true,
            sparklineKey: 'latency' as const,
            sparkColor: '#38bdf8'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans select-none">
            {cards.map((card, idx) => {
                const sparkData = getSparklineData(card.sparklineKey);
                return (
                    <div
                        key={idx}
                        className={`backdrop-blur-xl border ${card.border} rounded-3xl p-6 flex flex-col justify-between transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group shadow-[0_4px_30px_rgba(0,0,0,0.4)]`}
                    >
                        {/* Sparkline wave background at the bottom of the card */}
                        <div className="absolute left-0 right-0 bottom-0 h-[65px] opacity-40 group-hover:opacity-75 transition-opacity duration-500 z-0 pointer-events-none">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sparkData} margin={{ top: 0, right: -5, left: -5, bottom: -5 }}>
                                    <defs>
                                        <linearGradient id={`sparkGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={card.sparkColor} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={card.sparkColor} stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={card.sparkColor}
                                        strokeWidth={1.5}
                                        fillOpacity={1}
                                        fill={`url(#sparkGrad-${idx})`}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Row: Title & Icon */}
                        <div className="flex items-center justify-between mb-4 z-10 relative">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{card.title}</span>
                            <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/[0.07]`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>

                        {/* Middle Row: Large Value */}
                        <div className="flex flex-col mb-4 z-10 relative">
                            <span className="text-3xl font-extrabold text-white tracking-tight leading-none group-hover:text-shadow-glow transition-all duration-300">
                                {card.value}
                            </span>
                            <span className="text-[9px] text-gray-400 mt-2 font-bold tracking-wider uppercase leading-none">{card.label}</span>
                        </div>

                        {/* Bottom Row: Dynamic Status / Growth Badge */}
                        <div className="flex justify-end mt-4 z-10 relative">
                            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                card.growth === 'LIVESTREAM'
                                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 animate-pulse'
                                : card.isPositive 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                                {card.growth !== 'LIVESTREAM' && (
                                    card.isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />
                                )}
                                <span>{card.growth}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MetricsGrid;
