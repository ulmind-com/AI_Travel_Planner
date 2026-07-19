import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function SmartSuggestions() {
    const { getToken, isSignedIn } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!isSignedIn) return;
            try {
                setLoading(true);
                const token = await getToken();
                const API_URL = import.meta.env.VITE_BACKEND_URL || '';
                const response = await axios.get(`${API_URL}/api/v1/ai/suggestions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data && response.data.success) {
                    setSuggestions(response.data.data.recommendations || []);
                    setReason(response.data.data.reason || '');
                } else {
                    setError('Unable to fetch recommendations.');
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err);
                setError('Failed to reach recommendation engine.');
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [isSignedIn]);

    if (!isSignedIn) return null;

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-6 w-48 bg-slate-800 rounded animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-40 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || suggestions.length === 0) return null;

    return (
        <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <span className="text-purple-400">✨</span> Smart AI Recommendations
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Tailored suggestions aligned directly with your Travel Twin footprint.
                    </p>
                </div>
                {reason && (
                    <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 max-w-md">
                        <strong>Insight:</strong> "{reason}"
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {suggestions.map((plan) => (
                    <div
                        key={plan.planId}
                        onClick={() => window.location.href = `/plan/public/${plan.planId}`}
                        className="group relative overflow-hidden bg-slate-950/80 border border-slate-800 rounded-2xl cursor-pointer transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] flex flex-col justify-between"
                    >
                        {/* Background Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10"></div>
                        
                        {/* Image banner */}
                        <div className="relative h-32 w-full overflow-hidden">
                            <img
                                src={plan.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000&auto=format&fit=crop'}
                                alt={plan.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Score Tag */}
                            <div className="absolute top-3 right-3 z-20 px-2 py-1 rounded bg-slate-950/90 border border-purple-500/40 text-[10px] text-purple-300 font-mono flex items-center gap-1 shadow-lg">
                                <span className="text-[8px] animate-ping w-1 h-1 bg-purple-400 rounded-full"></span>
                                Match: {(plan.score * 100).toFixed(0)}%
                            </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-4 relative z-20 space-y-3 flex-1 flex flex-col justify-between bg-slate-950/95">
                            <div>
                                <h3 className="font-semibold text-slate-100 group-hover:text-purple-400 transition-colors">
                                    {plan.name}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 capitalize">
                                    Destination: {plan.destination}
                                </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-xs">
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 capitalize">
                                    {plan.travelStyle} Style
                                </span>
                                <span className="font-semibold text-slate-200">
                                    ₹{plan.cost ? plan.cost.toLocaleString('en-IN') : 'Custom'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
