import React from 'react';
import { Smile, ShieldAlert, Heart, HelpCircle, AlertCircle, Compass, BedDouble } from 'lucide-react';

const EMOTION_THEMES = {
    stressed: {
        label: 'Stressed / Overwhelmed',
        icon: ShieldAlert,
        color: 'from-orange-500 to-red-600',
        bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        desc: 'Relaxation & Spa Travel recommended to unwind.',
        emoji: '🧘'
    },
    happy: {
        label: 'Happy / Energetic',
        icon: Smile,
        color: 'from-emerald-400 to-teal-600',
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        desc: 'Active & Adventure Travel recommended.',
        emoji: '🧗'
    },
    bored: {
        label: 'Bored / Curious',
        icon: Compass,
        color: 'from-sky-400 to-indigo-600',
        bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
        desc: 'Exploration & City Discoveries recommended.',
        emoji: '🧭'
    },
    romantic: {
        label: 'Romantic / Loving',
        icon: Heart,
        color: 'from-pink-500 to-rose-600',
        bg: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
        desc: 'Cozy & Couple Destinations recommended.',
        emoji: '💖'
    },
    tired: {
        label: 'Tired / Fatigued',
        icon: BedDouble,
        color: 'from-blue-500 to-indigo-700',
        bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        desc: 'Slow & Wellness Travel recommended.',
        emoji: '☕'
    },
    neutral: {
        label: 'Balanced / Neutral',
        icon: HelpCircle,
        color: 'from-slate-400 to-slate-600',
        bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
        desc: 'Balanced sightseeing and activities recommended.',
        emoji: '✈️'
    }
};

export default function EmotionIndicator({ emotion, intensity, intent }) {
    const theme = EMOTION_THEMES[emotion] || EMOTION_THEMES.neutral;
    const IconComponent = theme.icon;

    return (
        <div className={`flex flex-col md:flex-row items-center gap-4 p-5 rounded-2xl border backdrop-blur-md ${theme.bg} shadow-lg transition-all duration-300 hover:shadow-xl`}>
            {/* Vibe Avatar */}
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.color} text-white shadow-md animate-pulse`}>
                <span className="text-3xl">{theme.emoji}</span>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-white/80"></span>
                </span>
            </div>

            {/* Vibe Details */}
            <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-2">
                    <h3 className="text-lg font-bold tracking-wide text-white">
                        Detected Vibe: <span className="underline decoration-wavy decoration-emerald-500/50">{theme.label}</span>
                    </h3>
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white">
                        Intensity: {Math.round(intensity * 100)}%
                    </div>
                </div>
                <p className="mt-1 text-sm text-slate-300 font-medium">
                    {theme.desc}
                </p>
                {intent && (
                    <div className="mt-2 text-xs text-slate-400 font-mono">
                        Primary Intent: &ldquo;{intent}&rdquo;
                    </div>
                )}
            </div>

            {/* Intensity Progress Bar */}
            <div className="w-full md:w-32 flex flex-col gap-1">
                <div className="flex justify-between text-xs text-slate-400 font-semibold">
                    <span>Vibe Intensity</span>
                    <span>{Math.round(intensity * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full bg-gradient-to-r ${theme.color} rounded-full transition-all duration-500`}
                        style={{ width: `${intensity * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
