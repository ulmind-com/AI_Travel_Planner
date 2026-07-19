import React, { useEffect, useState } from 'react';
import { X, Shield, Terminal, Fingerprint, Globe, Laptop, Key, Code } from 'lucide-react';
import api from '../../services/adminApi';

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
    metadata?: {
        ip?: string;
        device?: string;
        location?: string;
        userAgent?: string;
    };
    changes?: any;
}

interface AuditDetailsDrawerProps {
    logId: string | null;
    onClose: () => void;
}

export const AuditDetailsDrawer: React.FC<AuditDetailsDrawerProps> = ({ logId, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [detailData, setDetailData] = useState<{ log: AuditLog; entityDetails: any } | null>(null);

    useEffect(() => {
        if (!logId) return;

        const fetchDetails = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/audit/${logId}`);
                setDetailData(res.data.data);
            } catch (error) {
                console.error('Failed to fetch audit log detail payload', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [logId]);

    if (!logId) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] z-50 bg-[#07070b]/98 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col font-mono text-xs select-none overflow-hidden">
            {/* Holographic Glowing Scanner Top Bar */}
            <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 w-full animate-pulse"></div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">TELEMETRY DEEP SCANNER</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-500 hover:text-white transition-all"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-white gap-3">
                        <span className="w-8 h-8 border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">READING ENVELOPE HEADER...</span>
                    </div>
                ) : !detailData ? (
                    <div className="text-center py-20 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        ERROR: Link Failure
                    </div>
                ) : (
                    <>
                        {/* Event Badges */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                    detailData.log.severity === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/25 shadow-[0_0_8px_rgba(239,68,68,0.25)]' :
                                    detailData.log.severity === 'warning' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.25)]' :
                                    'text-cyan-400 bg-cyan-500/10 border-cyan-500/25 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                                }`}>
                                    {detailData.log.severity}
                                </span>
                                <span className="text-[8px] font-black tracking-widest text-indigo-400 bg-indigo-500/5 px-2.5 py-0.5 rounded border border-indigo-500/15 uppercase">
                                    {detailData.log.module}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                    detailData.log.status === 'success' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' : 'text-red-400 bg-red-500/5 border-red-500/20'
                                }`}>
                                    {detailData.log.status}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <h2 className="text-lg font-black text-white tracking-tight uppercase">
                                    {detailData.log.action.replace(/_/g, ' ')}
                                </h2>
                                <div className="bg-[#050508] border border-white/5 rounded-xl p-4 leading-relaxed text-gray-300 font-semibold shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                                    {detailData.log.message}
                                </div>
                            </div>
                        </div>

                        {/* Metadata grid cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Operator Details */}
                            <div className="bg-[#050508]/60 border border-white/5 rounded-xl p-4 space-y-2.5">
                                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                    <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Operator node</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest">IDENTIFICATION ID</span>
                                    <span className="text-white font-bold block select-all">@{detailData.log.performedBy}</span>
                                </div>
                            </div>

                            {/* Timestamp Details */}
                            <div className="bg-[#050508]/60 border border-white/5 rounded-xl p-4 space-y-2.5">
                                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>TIMESTAMP INDEX</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest">SERVER CALENDAR</span>
                                    <span className="text-white font-bold block">{new Date(detailData.log.timestamp).toLocaleString([], { hour12: false })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Network geography */}
                        <div className="bg-[#050508]/60 border border-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Network Metadata</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-gray-400">
                                <div>
                                    <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest">IP ADDRESS</span>
                                    <span className="text-white font-bold block select-all">{detailData.log.metadata?.ip || '127.0.0.1'}</span>
                                </div>
                                <div>
                                    <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest">ROUTING INDEX</span>
                                    <span className="text-white font-bold block">{detailData.log.metadata?.location || 'Local Server'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest">SYSTEM CLIENT</span>
                                    <span className="text-gray-300 font-semibold block truncate" title={detailData.log.metadata?.userAgent}>
                                        {detailData.log.metadata?.userAgent || 'System Process'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Entity bind resolvers */}
                        {detailData.log.entityId && (
                            <div className="bg-[#050508]/60 border border-white/5 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Entity Mapping Bind</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-gray-400">
                                        <div>
                                            <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest">TYPE TYPE</span>
                                            <span className="text-cyan-400 font-black">{detailData.log.entityType}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest">UNIQUE ID</span>
                                            <span className="text-white font-bold truncate block select-all">{detailData.log.entityId}</span>
                                        </div>
                                    </div>
                                    {detailData.entityDetails && (
                                        <div className="bg-[#020204]/90 border border-white/5 rounded-xl p-3 space-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                                            <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1.5">RESOLVED DB MODEL DETAILS</span>
                                            <pre className="text-[9px] text-emerald-400 font-bold overflow-x-auto max-h-48 leading-relaxed scrollbar-thin">
                                                {JSON.stringify(detailData.entityDetails, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Mutation logs diff changes */}
                        {detailData.log.changes && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Payload state Mutation diff</span>
                                </div>
                                <div className="bg-[#030305] border border-white/5 rounded-xl p-4 overflow-x-auto max-h-80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] scrollbar-thin">
                                    <pre className="text-[10px] text-emerald-400 leading-relaxed font-bold">
                                        {JSON.stringify(detailData.log.changes, null, 4)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
