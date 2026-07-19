import { Users, Search, ShoppingBag, Send } from 'lucide-react';

const CrowdIndicator = ({ crowd }) => {
    if (!crowd) return null;

    const { searches, bookings, posts, score, level } = crowd;

    const getLevelConfig = (lvl) => {
        switch (lvl) {
            case 'low':
                return { text: 'Low Density', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', fill: 'bg-emerald-500' };
            case 'medium':
                return { text: 'Moderate Crowd', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', fill: 'bg-amber-500' };
            case 'high':
            default:
                return { text: 'Heavy Density', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', fill: 'bg-rose-500' };
        }
    };

    const config = getLevelConfig(level);

    return (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                    👥 Crowd Levels
                </h4>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${config.color} ${config.bg}`}>
                    {config.text}
                </span>
            </div>

            {/* Score Radial Indicator */}
            <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="text-zinc-800"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className={config.color}
                            strokeWidth="3.5"
                            strokeDasharray={`${Math.min(100, (score / 30) * 100)}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-lg font-extrabold text-white font-outfit">{score}</span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Index</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-white font-bold text-sm">Real-time Traffic Index</p>
                    <p className="text-zinc-400 text-[11px] leading-normal">
                        Aggregated from active search behaviors, flight/hotel bookings, and community travel updates.
                    </p>
                </div>
            </div>

            {/* Detailed metrics bars */}
            <div className="space-y-3 pt-1">
                {/* Searches */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                        <span className="flex items-center gap-1"><Search size={12} /> Active Searches</span>
                        <span className="text-white font-bold">{searches}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div className={`h-full ${config.fill}`} style={{ width: `${Math.min(100, (searches / 30) * 100)}%` }}></div>
                    </div>
                </div>

                {/* Bookings */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                        <span className="flex items-center gap-1"><ShoppingBag size={12} /> Reserved Bookings</span>
                        <span className="text-white font-bold">{bookings}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div className={`h-full ${config.fill}`} style={{ width: `${Math.min(100, (bookings / 15) * 100)}%` }}></div>
                    </div>
                </div>

                {/* Community Posts */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                        <span className="flex items-center gap-1"><Send size={12} /> Community Stories</span>
                        <span className="text-white font-bold">{posts}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div className={`h-full ${config.fill}`} style={{ width: `${Math.min(100, (posts / 20) * 100)}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrowdIndicator;
