import React from 'react';
import { Terminal, Shield, Fingerprint, Eye, Globe, Cpu, AlertTriangle } from 'lucide-react';

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

interface AuditTableProps {
    logs: AuditLog[];
    loading: boolean;
    onSelectLog: (log: AuditLog) => void;
    pagination: {
        total: number;
        page: number;
        pages: number;
        limit: number;
    };
    onPageChange: (page: number) => void;
}

export const AuditTable: React.FC<AuditTableProps> = ({
    logs,
    loading,
    onSelectLog,
    pagination,
    onPageChange
}) => {
    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.25)]';
            case 'warning':
                return 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.25)]';
            case 'info':
            default:
                return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.25)]';
        }
    };

    const getStatusStyles = (status: string) => {
        return status === 'success'
            ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
            : 'text-red-400 bg-red-500/5 border-red-500/20';
    };

    const getActionColor = (action: string) => {
        const act = action.toUpperCase();
        if (act.includes('DELETE') || act.includes('BAN') || act.includes('PURGE')) return 'text-red-400';
        if (act.includes('CREATE') || act.includes('ADD') || act.includes('UPLOAD')) return 'text-cyan-400';
        if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('TOGGLE')) return 'text-amber-400';
        return 'text-purple-400';
    };

    return (
        <div className="bg-[#0b0b11]/70 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.6)] font-mono">
            {/* Pulsing neon scan topborder */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>

            <div className="overflow-x-auto min-h-[420px] scrollbar-thin">
                <table className="w-full text-left">
                    <thead className="bg-[#08080c] border-b border-white/5">
                        <tr className="text-[10px] text-gray-500 uppercase tracking-widest font-black select-none">
                            <th className="px-6 py-4">TELEMETRY TIMESTAMP</th>
                            <th className="px-6 py-4">OPERATOR NODE</th>
                            <th className="px-6 py-4">MODULE</th>
                            <th className="px-6 py-4">ACTION VECTOR</th>
                            <th className="px-6 py-4">PAYLOAD ENVELOPE MESSAGE</th>
                            <th className="px-6 py-4 text-center">SEVERITY</th>
                            <th className="px-6 py-4 text-center">STATUS</th>
                            <th className="px-6 py-4 text-right">INSPECT</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px]">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, idx) => (
                                <tr key={idx} className="animate-pulse bg-white/[0.005]">
                                    <td className="px-6 py-5"><div className="h-3 bg-white/5 rounded w-32"></div></td>
                                    <td className="px-6 py-5"><div className="h-3 bg-white/5 rounded w-24"></div></td>
                                    <td className="px-6 py-5"><div className="h-4 bg-white/5 rounded w-16"></div></td>
                                    <td className="px-6 py-5"><div className="h-3 bg-white/5 rounded w-36"></div></td>
                                    <td className="px-6 py-5"><div className="h-3 bg-white/5 rounded w-56"></div></td>
                                    <td className="px-6 py-5 text-center"><div className="h-4 bg-white/5 rounded w-12 mx-auto"></div></td>
                                    <td className="px-6 py-5 text-center"><div className="h-4 bg-white/5 rounded w-14 mx-auto"></div></td>
                                    <td className="px-6 py-5 text-right"><div className="h-7 bg-white/5 rounded w-10 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <AlertTriangle className="w-8 h-8 text-gray-800 animate-pulse" />
                                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">
                                            No Telemetry Streams Indexed
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr
                                    key={log._id}
                                    onClick={() => onSelectLog(log)}
                                    className="hover:bg-white/[0.015] hover:shadow-[inset_4px_0_0_rgba(6,182,212,0.4)] transition-all cursor-pointer group border-b border-white/[0.01]"
                                >
                                    {/* Timestamp */}
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-bold group-hover:text-cyan-400 transition-colors">
                                        {new Date(log.timestamp).toLocaleString([], { hour12: false })}
                                    </td>

                                    {/* Operator */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[9px] font-black text-cyan-400">
                                                {log.performedBy.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-white font-bold">@{log.performedBy}</span>
                                        </div>
                                    </td>

                                    {/* Module */}
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-black tracking-widest text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/15 uppercase">
                                            {log.module}
                                        </span>
                                    </td>

                                    {/* Action */}
                                    <td className="px-6 py-4">
                                        <span className={`font-black uppercase tracking-tight ${getActionColor(log.action)}`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>

                                    {/* Message */}
                                    <td className="px-6 py-4 text-gray-400 font-semibold max-w-xs truncate group-hover:text-gray-200 transition-colors">
                                        {log.message}
                                    </td>

                                    {/* Severity */}
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getSeverityStyles(log.severity)}`}>
                                            {log.severity}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStatusStyles(log.status)}`}>
                                            {log.status}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => onSelectLog(log)}
                                            className="p-1.5 rounded-lg border border-white/5 hover:border-cyan-500/30 text-gray-500 hover:text-cyan-400 bg-white/[0.01] hover:bg-cyan-500/5 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
                <div className="bg-[#07070b] border-t border-white/5 px-6 py-4 flex items-center justify-between font-mono text-xs">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">
                        Telemetry logs index: <span className="text-cyan-400 font-black">{logs.length}</span> of <span className="text-white font-black">{pagination.total}</span> traces
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:opacity-20 transition-all bg-white/[0.01]"
                        >
                            PREV
                        </button>
                        {Array.from({ length: Math.min(5, pagination.pages) }).map((_, idx) => {
                            const pNum = idx + 1;
                            return (
                                <button
                                    key={pNum}
                                    onClick={() => onPageChange(pNum)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                                        pagination.page === pNum
                                            ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                                            : 'border border-white/5 text-gray-500 hover:text-white bg-white/[0.01]'
                                    }`}
                                >
                                    {pNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:opacity-20 transition-all bg-white/[0.01]"
                        >
                            NEXT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
