import React from 'react';
import { Activity, ShieldAlert, Cpu, Database, AlertCircle } from 'lucide-react';

interface AuditChartsProps {
    analytics: {
        totalLogs: number;
        severityDistribution: {
            info: number;
            warning: number;
            critical: number;
        };
        moduleDistribution: Record<string, number>;
        topActions: Array<{ action: string; count: number }>;
        volumeOverTime: Array<{ date: string; count: number }>;
    } | null;
}

export const AuditCharts: React.FC<AuditChartsProps> = ({ analytics }) => {
    if (!analytics) return null;

    const { totalLogs, severityDistribution, moduleDistribution, volumeOverTime } = analytics;
    
    // Severity calculations
    const totalSeverity = (severityDistribution.info || 0) + (severityDistribution.warning || 0) + (severityDistribution.critical || 0) || 1;
    const infoPercent = ((severityDistribution.info || 0) / totalSeverity) * 100;
    const warningPercent = ((severityDistribution.warning || 0) / totalSeverity) * 100;
    const criticalPercent = ((severityDistribution.critical || 0) / totalSeverity) * 100;

    // SVG parameters
    const size = 110;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Stroke offsets
    const infoDashOffset = circumference - (infoPercent / 100) * circumference;
    const warningDashOffset = circumference - (warningPercent / 100) * circumference;
    const criticalDashOffset = circumference - (criticalPercent / 100) * circumference;

    // Simple custom area chart parsing for the last 7 items in volumeOverTime
    const chartWidth = 340;
    const chartHeight = 60;
    const maxVal = Math.max(...(volumeOverTime.map(d => d.count)), 1);
    
    // Generate custom SVG path points for the volumetric timeline
    const points = volumeOverTime.slice(-8).map((d, idx, arr) => {
        const x = arr.length > 1 ? (idx / (arr.length - 1)) * chartWidth : chartWidth / 2;
        const y = chartHeight - (d.count / maxVal) * (chartHeight - 10) - 5;
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = points 
        ? `0,${chartHeight} ${points} ${chartWidth},${chartHeight}` 
        : '';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            {/* VOLUMETRIC STREAM TELEMETRY PANEL */}
            <div className="bg-gradient-to-br from-[#0c0c14] to-[#050508] border border-cyan-500/10 rounded-2xl p-5 relative overflow-hidden group shadow-[0_0_30px_rgba(6,182,212,0.02)] transition-all hover:border-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] flex flex-col justify-between h-[230px]">
                {/* Cyber decorative grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/80">CORE TELEMETRY VOLUMES</span>
                    </div>
                    <span className="text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded uppercase font-black">
                        ONLINE
                    </span>
                </div>

                <div className="my-3 z-10">
                    <span className="text-5xl font-black font-sans tracking-tight text-white select-all drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        {totalLogs.toLocaleString()}
                    </span>
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        Active Telemetry Log Nodes Saved
                    </p>
                </div>

                {/* SVG Volumetric Trend Graph */}
                <div className="w-full h-[60px] relative mt-2 z-10 select-none">
                    {points && (
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="cyanAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            {/* Area projection */}
                            <polygon points={areaPoints} fill="url(#cyanAreaGrad)" />
                            {/* Trend line */}
                            <polyline
                                fill="transparent"
                                stroke="rgb(6, 182, 212)"
                                strokeWidth="2"
                                points={points}
                                className="drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]"
                            />
                        </svg>
                    )}
                </div>
            </div>

            {/* SEVERITY DOUGHNUT GAUGE PANEL */}
            <div className="bg-gradient-to-br from-[#0c0c14] to-[#050508] border border-white/5 rounded-2xl p-5 relative overflow-hidden group shadow-[0_0_30px_rgba(245,158,11,0.01)] transition-all hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] flex flex-col justify-between h-[230px]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/80">SEVERITY THREAT RATIOS</span>
                    </div>
                    <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-black">
                        SIEM MATRIX
                    </span>
                </div>

                <div className="flex items-center gap-6 my-2 z-10">
                    {/* Ring Diagram */}
                    <div className="relative w-[95px] h-[95px] flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="47.5" cy="47.5" r={radius} fill="transparent" stroke="#12121c" strokeWidth={strokeWidth} />
                            {/* Critical Ring */}
                            {severityDistribution.critical > 0 && (
                                <circle
                                    cx="47.5"
                                    cy="47.5"
                                    r={radius}
                                    fill="transparent"
                                    stroke="rgb(239, 68, 68)"
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={criticalDashOffset}
                                    strokeLinecap="round"
                                />
                            )}
                            {/* Warning Ring */}
                            {severityDistribution.warning > 0 && (
                                <circle
                                    cx="47.5"
                                    cy="47.5"
                                    r={radius}
                                    fill="transparent"
                                    stroke="rgb(245, 158, 11)"
                                    strokeWidth={strokeWidth - 2}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={warningDashOffset}
                                    strokeLinecap="round"
                                />
                            )}
                            {/* Info Ring */}
                            {severityDistribution.info > 0 && (
                                <circle
                                    cx="47.5"
                                    cy="47.5"
                                    r={radius}
                                    fill="transparent"
                                    stroke="rgb(6, 182, 212)"
                                    strokeWidth={strokeWidth - 4}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={infoDashOffset}
                                    strokeLinecap="round"
                                />
                            )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                            <span className="text-[8px] text-gray-600 font-black tracking-widest uppercase">ALERTS</span>
                            <span className="text-sm font-black text-white">
                                {((severityDistribution.warning || 0) + (severityDistribution.critical || 0))}
                            </span>
                        </div>
                    </div>

                    {/* Threat Legends */}
                    <div className="flex-1 space-y-1 text-[9px] font-bold">
                        <div className="flex items-center justify-between bg-red-500/5 border border-red-500/10 px-2 py-1 rounded">
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span className="text-red-400">CRIT</span>
                            </div>
                            <span className="text-white">{severityDistribution.critical || 0}</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 px-2 py-1 rounded">
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span className="text-amber-400">WARN</span>
                            </div>
                            <span className="text-white">{severityDistribution.warning || 0}</span>
                        </div>
                        <div className="flex items-center justify-between bg-cyan-500/5 border border-cyan-500/10 px-2 py-1 rounded">
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                                <span className="text-cyan-400">INFO</span>
                            </div>
                            <span className="text-white">{severityDistribution.info || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODULE VECTOR CONSOLE */}
            <div className="bg-gradient-to-br from-[#0c0c14] to-[#050508] border border-white/5 rounded-2xl p-5 relative overflow-hidden group shadow-[0_0_30px_rgba(139,92,246,0.01)] transition-all hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] flex flex-col justify-between h-[230px]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400/80">MODULE VECTORS</span>
                    </div>
                    <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded uppercase font-black">
                        DATABASES
                    </span>
                </div>

                <div className="space-y-2 my-2 z-10 flex-1 flex flex-col justify-center">
                    {Object.entries(moduleDistribution).slice(0, 3).map(([key, val]) => {
                        const total = Object.values(moduleDistribution).reduce((a, b) => a + b, 0) || 1;
                        const pct = (val / total) * 100;
                        return (
                            <div key={key} className="space-y-1">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                    <span className="text-gray-400">{key}</span>
                                    <span className="text-purple-400">{val} ({Math.round(pct)}%)</span>
                                </div>
                                <div className="h-2 bg-[#08080d] border border-white/5 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_8px_rgba(139,92,246,0.3)] transition-all duration-1000"
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(moduleDistribution).length === 0 && (
                        <div className="text-center py-6 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                            No Active Mappings
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
