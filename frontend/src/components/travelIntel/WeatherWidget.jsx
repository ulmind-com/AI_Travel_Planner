import { Sun, CloudRain, Wind, Compass, ShieldAlert } from 'lucide-react';

const WeatherWidget = ({ weather }) => {
    if (!weather) return null;

    const { temp, rain, wind, uv, humidity, description } = weather;

    const getUvLevel = (uvVal) => {
        if (uvVal <= 2) return { text: 'Low', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
        if (uvVal <= 5) return { text: 'Moderate', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
        if (uvVal <= 7) return { text: 'High', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
        return { text: 'Very High', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    };

    const uvRating = getUvLevel(uv);

    return (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                    🌤️ Weather Intel
                </h4>
                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-medium">
                    Today
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                    {rain > 2 ? <CloudRain className="w-10 h-10 animate-bounce" /> : <Sun className="w-10 h-10 animate-spin" style={{ animationDuration: '10s' }} />}
                </div>
                <div>
                    <div className="text-3xl font-extrabold text-white font-outfit">{temp}°C</div>
                    <div className="text-zinc-400 text-xs font-semibold">{description}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Wind Card */}
                <div className="p-3 bg-zinc-950/40 border border-zinc-800/40 rounded-xl flex items-center gap-2">
                    <Wind size={16} className="text-sky-400 shrink-0" />
                    <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Wind</div>
                        <div className="text-xs text-white font-semibold">{wind} km/h</div>
                    </div>
                </div>

                {/* Humidity Card */}
                <div className="p-3 bg-zinc-950/40 border border-zinc-800/40 rounded-xl flex items-center gap-2">
                    <Compass size={16} className="text-emerald-400 shrink-0" />
                    <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Humidity</div>
                        <div className="text-xs text-white font-semibold">{humidity}%</div>
                    </div>
                </div>

                {/* Rain Precip Card */}
                <div className="p-3 bg-zinc-950/40 border border-zinc-800/40 rounded-xl flex items-center gap-2">
                    <CloudRain size={16} className="text-indigo-400 shrink-0" />
                    <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Precip.</div>
                        <div className="text-xs text-white font-semibold">{rain} mm</div>
                    </div>
                </div>

                {/* UV Index Card */}
                <div className="p-3 bg-zinc-950/40 border border-zinc-800/40 rounded-xl flex items-center gap-2">
                    <ShieldAlert size={16} className="text-amber-400 shrink-0" />
                    <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">UV Index</div>
                        <div className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold inline-block ${uvRating.color}`}>
                            {uv} - {uvRating.text}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;
