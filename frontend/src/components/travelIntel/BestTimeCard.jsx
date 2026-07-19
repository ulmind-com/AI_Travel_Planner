import { Clock, HelpCircle, Sun, CloudRain } from 'lucide-react';

const BestTimeCard = ({ bestTime, weather }) => {
    if (!bestTime) return null;

    const { timeWindow, explanation } = bestTime;

    return (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                    🕐 Visited Windows
                </h4>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                    Optimized
                </span>
            </div>

            {/* Time windows banner */}
            <div className="p-4 bg-gradient-to-tr from-zinc-950 to-zinc-900 border border-zinc-800/60 rounded-xl flex gap-3.5 items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                    <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                        RECOMMENDED TODAY
                    </div>
                    <div className="text-lg font-extrabold text-white font-outfit">
                        {timeWindow}
                    </div>
                </div>
            </div>

            {/* Justification details */}
            <div className="space-y-3 pt-1">
                <div className="flex gap-2 items-start">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-white font-semibold">Why this window?</p>
                        <p className="text-zinc-400 text-[11px] leading-relaxed mt-0.5">{explanation}</p>
                    </div>
                </div>

                {/* Day status indicators */}
                <div className="border-t border-zinc-800/40 pt-3 flex justify-between text-[11px] text-zinc-500 font-semibold">
                    <span className="flex items-center gap-1">
                        <Sun size={12} className="text-amber-500" />
                        Sunrise: 5:45 AM
                    </span>
                    <span className="flex items-center gap-1">
                        <CloudRain size={12} className="text-sky-400" />
                        Sunset: 6:40 PM
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BestTimeCard;
