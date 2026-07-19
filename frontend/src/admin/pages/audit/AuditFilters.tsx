import React from 'react';
import { Search, Filter, Calendar, RotateCcw, ShieldAlert, Cpu } from 'lucide-react';

interface AuditFiltersProps {
    search: string;
    setSearch: (val: string) => void;
    module: string;
    setModule: (val: string) => void;
    severity: string;
    setSeverity: (val: string) => void;
    status: string;
    setStatus: (val: string) => void;
    dateFrom: string;
    setDateFrom: (val: string) => void;
    dateTo: string;
    setDateTo: (val: string) => void;
    limit: number;
    setLimit: (val: number) => void;
    onReset: () => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({
    search,
    setSearch,
    module,
    setModule,
    severity,
    setSeverity,
    status,
    setStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    limit,
    setLimit,
    onReset
}) => {
    return (
        <div className="bg-[#0c0c14]/70 backdrop-blur-xl border border-white/5 p-6 rounded-2xl space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden font-mono">
            {/* Ambient subtle glow bar */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400/80">SIEM LOGS EXPANDED PARSING PARAMS</span>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-cyan-400 transition-colors bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 px-3 py-1 rounded-lg transition-all"
                >
                    <RotateCcw className="w-3 h-3" />
                    Flush Matrix
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search query input */}
                <div className="relative col-span-1 md:col-span-2 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH OPERATIONAL PAYLOADS OR LOG CONTEXT..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#060609] border border-white/5 focus:border-cyan-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none transition-all uppercase font-bold tracking-tight shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                    />
                </div>

                {/* Module selection list */}
                <div className="relative group">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                        value={module}
                        onChange={(e) => setModule(e.target.value)}
                        className="w-full bg-[#060609] border border-white/5 focus:border-cyan-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-300 focus:outline-none transition-all cursor-pointer font-bold appearance-none uppercase"
                    >
                        <option value="all">ALL SYSTEM MODULES</option>
                        <option value="SYSTEM">SYSTEM CONCENT</option>
                        <option value="EXPEDITIONS">EXPEDITIONS CORE</option>
                        <option value="TESTIMONIALS">TESTIMONIALS MOD</option>
                        <option value="COMMUNITY">COMMUNITY HUB</option>
                        <option value="AUTH">AUTH PORTAL</option>
                        <option value="CHAT">CHAT ROUTING</option>
                    </select>
                </div>

                {/* Severity Selection list */}
                <div className="relative group">
                    <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className="w-full bg-[#060609] border border-white/5 focus:border-cyan-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-300 focus:outline-none transition-all cursor-pointer font-bold appearance-none uppercase"
                    >
                        <option value="all">ALL SEVERITY MATRIX</option>
                        <option value="info">INFO DATASETS</option>
                        <option value="warning">WARNING STAGE</option>
                        <option value="critical">CRITICAL SHIELDS</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                {/* Status Selection list */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-[#060609] border border-white/5 focus:border-cyan-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-300 focus:outline-none transition-all cursor-pointer font-bold appearance-none uppercase"
                    >
                        <option value="all">ALL OPERATIONS</option>
                        <option value="success">SUCCESS LOGS</option>
                        <option value="failed">FAILED STREAMS</option>
                    </select>
                </div>

                {/* Calendar Range From */}
                <div className="relative group">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full bg-[#060609] border border-white/5 focus:border-cyan-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-300 focus:outline-none transition-all cursor-pointer font-bold uppercase"
                    />
                </div>

                {/* Calendar Range To */}
                <div className="relative group">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full bg-[#060609] border border-white/5 focus:border-cyan-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-300 focus:outline-none transition-all cursor-pointer font-bold uppercase"
                    />
                </div>

                {/* Page limit selection */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="w-full bg-[#060609] border border-white/5 focus:border-cyan-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-300 focus:outline-none transition-all cursor-pointer font-bold appearance-none uppercase"
                    >
                        <option value={10}>10 STREAM LIMIT</option>
                        <option value={20}>20 STREAM LIMIT</option>
                        <option value={50}>50 STREAM LIMIT</option>
                        <option value={100}>100 STREAM LIMIT</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
