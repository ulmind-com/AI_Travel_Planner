import React, { useEffect, useState } from 'react';
import { trustService } from '../../services/trustService';
import TrustBadge from './TrustBadge';
import { Shield, ShieldAlert, Sparkles, CheckCircle2, AlertOctagon, HelpCircle, Loader2 } from 'lucide-react';

const UserTrustCard = ({ userId, token, initialData = null }) => {
    const [profile, setProfile] = useState(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!initialData && userId) {
            setLoading(true);
            trustService.getUserTrustProfile(userId, token)
                .then(res => {
                    if (res.success) {
                        setProfile(res.data);
                    } else {
                        setError('Failed to load trust scores.');
                    }
                })
                .catch(err => {
                    console.error('Trust Score Fetch error:', err);
                    setError('Unable to fetch trust verification details.');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [userId, token, initialData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-6 border rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[200px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="mt-2 text-sm text-zinc-500 font-outfit">Retrieving Trust Metrics...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="p-6 text-center border rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[200px] flex flex-col justify-center items-center">
                <AlertOctagon className="w-8 h-8 text-rose-500 mb-2" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-outfit">Trust Assessment Unavailable</p>
                <p className="text-xs text-zinc-500 mt-1">{error || 'No active profile found'}</p>
            </div>
        );
    }

    const {
        trustScore = 100,
        toxicityScore = 0,
        spamScore = 0,
        reportCount = 0,
        fakeReviewScore = 0
    } = profile;

    // Helper to get status description
    const getStatusDesc = (score) => {
        if (score >= 80) return { title: 'Excellent Status', color: 'text-emerald-500', desc: 'Highly trusted traveler. Digital Twin recommendations prioritize this profile.' };
        if (score >= 50) return { title: 'Standard Status', color: 'text-blue-500', desc: 'Normal community standing. Keep sharing high quality reviews to upgrade.' };
        return { title: 'High Risk Alert', color: 'text-rose-500', desc: 'Flagged for moderation checks. Posting rates and recommendations are constrained.' };
    };

    const status = getStatusDesc(trustScore);

    return (
        <div className="relative overflow-hidden p-6 border rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-6 -mt-6"></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 font-outfit">Traveler Trust Score</h3>
                    <p className="text-xs text-zinc-400 font-sans mt-0.5">Verified by AdventureNexus AI Guard</p>
                </div>
                <TrustBadge score={trustScore} />
            </div>

            {/* Overall Score Circle & Visual */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-zinc-100 dark:border-zinc-800 shadow-inner">
                    <span className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 font-outfit">{trustScore}</span>
                    {/* Ring coloration */}
                    <svg className="absolute top-[-4px] left-[-4px] w-[88px] h-[88px] -rotate-90">
                        <circle
                            cx="44"
                            cy="44"
                            r="40"
                            stroke={trustScore >= 80 ? '#10b981' : trustScore >= 50 ? '#3b82f6' : '#f43f5e'}
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - trustScore / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                <div className="flex-1">
                    <h4 className={`text-sm font-bold ${status.color} font-outfit`}>{status.title}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed font-sans">{status.desc}</p>
                </div>
            </div>

            {/* Granular Breakdown */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-outfit mb-2">Safety Vectors</h4>
                
                {/* Toxicity */}
                <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 font-outfit">
                        <span className="text-zinc-600 dark:text-zinc-300">Toxicity Index</span>
                        <span className={toxicityScore > 0.3 ? 'text-rose-500' : 'text-zinc-400'}>{Math.round(toxicityScore * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-rose-500 transition-all duration-500" 
                            style={{ width: `${Math.round(toxicityScore * 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Spam */}
                <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 font-outfit">
                        <span className="text-zinc-600 dark:text-zinc-300">Spam Frequency</span>
                        <span className={spamScore > 0.4 ? 'text-amber-500' : 'text-zinc-400'}>{Math.round(spamScore * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-amber-500 transition-all duration-500" 
                            style={{ width: `${Math.round(spamScore * 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Fake Reviews */}
                <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 font-outfit">
                        <span className="text-zinc-600 dark:text-zinc-300">Review Anomalies</span>
                        <span className={fakeReviewScore > 0.3 ? 'text-purple-500' : 'text-zinc-400'}>{Math.round(fakeReviewScore * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-purple-500 transition-all duration-500" 
                            style={{ width: `${Math.round(fakeReviewScore * 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Reports */}
                <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-zinc-100 dark:border-zinc-800 font-outfit">
                    <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                        Community Flags
                        <HelpCircle size={12} className="text-zinc-400 cursor-pointer" title="Flags or reports received from other community members." />
                    </span>
                    <span className={reportCount > 0 ? 'text-rose-500' : 'text-emerald-500'}>{reportCount} flags</span>
                </div>
            </div>
        </div>
    );
};

export default UserTrustCard;
