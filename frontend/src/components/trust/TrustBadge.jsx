import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { trustService } from '../../services/trustService';

const TrustBadge = ({ score: initialScore = null, userId, token, className = "", size = "md" }) => {
    const [score, setScore] = useState(initialScore);
    const [loading, setLoading] = useState(userId && initialScore === null);

    useEffect(() => {
        if (userId && initialScore === null) {
            setLoading(true);
            trustService.getUserTrustProfile(userId, token)
                .then(res => {
                    if (res.success && res.data) {
                        setScore(res.data.trustScore);
                    }
                })
                .catch(err => {
                    console.error('Trust Score Fetch error:', err);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else if (initialScore !== null) {
            setScore(initialScore);
            setLoading(false);
        }
    }, [userId, token, initialScore]);

    if (loading) {
        return (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border bg-zinc-950/20 border-white/5 text-zinc-500 ${className}`}>
                <Loader2 size={10} className="animate-spin flex-shrink-0" />
                <span className="font-outfit">Verifying...</span>
            </div>
        );
    }

    if (score === null) return null;

    // Determine status based on trustScore
    let level = 'Normal';
    let colorClass = 'text-blue-400 bg-blue-950/20 border-blue-900';
    let Icon = Shield;
    let label = 'Trusted Member';

    if (score >= 80) {
        level = 'Verified';
        colorClass = 'text-emerald-400 bg-emerald-950/20 border-emerald-900';
        Icon = ShieldCheck;
        label = 'Verified Traveler';
    } else if (score < 50) {
        level = 'Risk';
        colorClass = 'text-rose-400 bg-rose-950/20 border-rose-900 animate-pulse';
        Icon = AlertTriangle;
        label = 'Low Trust Score';
    }

    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
    const iconSize = size === 'sm' ? 12 : 14;

    return (
        <div className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-sm transition-all duration-300 hover:scale-105 ${colorClass} ${sizeClass} ${className}`}>
            <Icon size={iconSize} className="flex-shrink-0" />
            <span className="font-outfit">{label}</span>
            <span className="ml-1 opacity-75 font-mono">({score})</span>
        </div>
    );
};

export default TrustBadge;
