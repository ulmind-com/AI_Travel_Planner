import React from 'react';
import { Compass, Info, Heart, CheckCircle2, ChevronRight, Activity, Smile, BedDouble, AlertTriangle } from 'lucide-react';

const MOODS_INFO = [
    {
        id: 'stressed',
        title: 'Stressed / Busy',
        travelStyle: 'Relaxation Trips',
        destinations: ['Goa Beaches', 'Sikkim Monasteries', 'Kerala Backwaters'],
        activities: ['Spa Resorts', 'Silent Meditation', 'Beach Lounging', 'Wellness Therapies'],
        vibe: '💆 Low-crowd, healing, slow pacing'
    },
    {
        id: 'happy',
        title: 'Happy / Excited',
        travelStyle: 'Adventure Trips',
        destinations: ['Leh Ladakh Trek', 'Rishikesh Rafting', 'Manali Skiing'],
        activities: ['Paragliding', 'Trekking', 'Whitewater Rafting', 'Camping under stars'],
        vibe: '🧗 High-energy, thrilling, active pacing'
    },
    {
        id: 'bored',
        title: 'Bored / Monotonous',
        travelStyle: 'Exploration Trips',
        destinations: ['Jaipur Forts', 'Hampi Ruins', 'Mumbai Heritage Walk'],
        activities: ['Museum Tours', 'Historical Scavenger Hunts', 'Street Food Tasting'],
        vibe: '🧭 Discovery-focused, historic, immersive'
    },
    {
        id: 'romantic',
        title: 'Romantic / Passionate',
        travelStyle: 'Couple Destinations',
        destinations: ['Udaipur Lake Palaces', 'Munnar Tea Gardens', 'Andaman Islands'],
        activities: ['Private Candlelit Dinner', 'Sunset Cruise', 'Couples Spa Day'],
        vibe: '💖 Cozy, private, scenic, luxurious'
    },
    {
        id: 'tired',
        title: 'Tired / Fatigued',
        travelStyle: 'Slow Travel',
        destinations: ['Dharamshala Retreats', 'Coorg Coffee Estates', 'Gokarna Shores'],
        activities: ['Morning Yoga', 'Nature Walk', 'Local Culture Immersion', 'Book Reading'],
        vibe: '☕ Mindfulness, peaceful nature, lazy pacing'
    }
];

export default function MoodSuggestionCard({ currentEmotion, explanation, onSelectMood }) {
    return (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-extrabold tracking-wide text-white">
                        AI Mood-Travel Mapping
                    </h3>
                    <p className="text-xs text-slate-400">Understanding how your state of mind refines your trip.</p>
                </div>
            </div>

            {/* AI Explanation System */}
            {explanation && (
                <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex gap-3 items-start">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5">
                        <Info className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                            Why this suggestion?
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            {explanation}
                        </p>
                    </div>
                </div>
            )}

            {/* Manual Mood Explorer / Selector */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Explore Vibe Types
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {MOODS_INFO.map((mood) => {
                    const isActive = currentEmotion === mood.id;
                    return (
                        <button
                            key={mood.id}
                            onClick={() => onSelectMood && onSelectMood(mood.id)}
                            className={`flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                isActive
                                    ? 'bg-gradient-to-b from-emerald-500/20 to-teal-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-extrabold text-sm text-white">{mood.title}</span>
                                {isActive && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                            </div>
                            <span className="text-xs text-slate-300 font-semibold mb-1">
                                {mood.travelStyle}
                            </span>
                            <span className="text-[10px] text-slate-400 leading-tight">
                                {mood.vibe}
                            </span>

                            {/* Hover info panel */}
                            <div className="mt-3 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 space-y-1">
                                <span className="block font-bold text-slate-400">Top Spots:</span>
                                <span className="block text-slate-300">{mood.destinations.join(', ')}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
            
            <div className="mt-5 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-[11px] text-yellow-500/80 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Our AI model respects safety limitations. Feel free to adjust your preferred travel vibe manually if desired.</span>
            </div>
        </div>
    );
}
