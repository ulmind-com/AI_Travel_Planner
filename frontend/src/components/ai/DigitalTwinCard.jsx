import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function DigitalTwinCard() {
    const { getToken, isSignedIn } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!isSignedIn) return;
            try {
                setLoading(true);
                const token = await getToken();
                const API_URL = import.meta.env.VITE_BACKEND_URL || '';
                const response = await axios.get(`${API_URL}/api/v1/ai/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data && response.data.success) {
                    setProfile(response.data.data);
                } else {
                    setError('Failed to load twin profile.');
                }
            } catch (err) {
                console.error('Error fetching digital twin profile:', err);
                setError('Unable to reach preference profile services.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [isSignedIn]);

    if (!isSignedIn) {
        return (
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                <p>Please log in to initialize your Travel Digital Twin.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-1/3 bg-slate-800 rounded mb-4"></div>
                <div className="h-4 w-full bg-slate-800 rounded mb-2"></div>
                <div className="h-4 w-5/6 bg-slate-800 rounded"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="bg-slate-900/60 backdrop-blur-md border border-red-900/30 rounded-2xl p-6 text-center text-slate-400">
                <p>{error || 'No profile found. Interact with the platform to let your twin learn your habits!'}</p>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-purple-950/20 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:border-purple-500/30">
            {/* Glow Accent */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                            <span className="text-purple-400 font-bold text-lg">🧬</span>
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-950 rounded-full animate-ping"></span>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-950 rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-100 text-base">Travel Digital Twin</h3>
                        <span className="text-xs text-purple-400/80 font-mono tracking-wider uppercase">Active Analyzer</span>
                    </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-mono">
                    LEARNING
                </div>
            </div>

            {/* AI Insights Description */}
            <div className="mb-6 bg-slate-900/55 border border-slate-800/40 rounded-xl p-4">
                <span className="text-xs text-slate-400 block mb-1">AI Prediction Insight</span>
                <p className="text-sm text-slate-200 leading-relaxed italic">
                    "{profile.aiPredictionText || 'AdventureNexus is analyzing your travel patterns to build a customized twin.'}"
                </p>
            </div>

            {/* Stats / Parameters */}
            <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                    <span className="text-slate-400 block mb-1">Preferred Style</span>
                    <div className="flex flex-wrap gap-1">
                        {profile.travelStyle && profile.travelStyle.length > 0 ? (
                            profile.travelStyle.map((style, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 capitalize">
                                    {style}
                                </span>
                            ))
                        ) : (
                            <span className="text-slate-500">Learning...</span>
                        )}
                    </div>
                </div>

                <div>
                    <span className="text-slate-400 block mb-1">Target Climate</span>
                    <div className="flex flex-wrap gap-1">
                        {profile.preferredClimate && profile.preferredClimate.length > 0 ? (
                            profile.preferredClimate.map((climate, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 capitalize">
                                    {climate}
                                </span>
                            ))
                        ) : (
                            <span className="text-slate-500">Learning...</span>
                        )}
                    </div>
                </div>

                <div className="col-span-2 border-t border-slate-800/50 pt-3">
                    <span className="text-slate-400 block mb-1">Estimated Budget Match</span>
                    <span className="text-sm font-semibold text-slate-200">
                        {profile.budgetRange && (profile.budgetRange.min || profile.budgetRange.max) ? (
                            `₹${profile.budgetRange.min.toLocaleString('en-IN')} - ₹${profile.budgetRange.max.toLocaleString('en-IN')}`
                        ) : (
                            'Calculating range...'
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
