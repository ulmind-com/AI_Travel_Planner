import { AlertTriangle, CheckCircle, ShieldAlert, AlertCircle } from 'lucide-react';

const RiskAlert = ({ risk }) => {
    if (!risk) return null;

    const { level, reasons, alerts } = risk;

    const getLevelConfig = (lvl) => {
        switch (lvl) {
            case 'safe':
                return {
                    text: 'Safe Environment',
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-500/10 border-emerald-500/20',
                    icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                };
            case 'caution':
                return {
                    text: 'Caution Advised',
                    color: 'text-amber-400',
                    bg: 'bg-amber-500/10 border-amber-500/20',
                    icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                };
            case 'danger':
            default:
                return {
                    text: 'Extreme Hazard',
                    color: 'text-rose-400',
                    bg: 'bg-rose-500/10 border-rose-500/20',
                    icon: <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                };
        }
    };

    const config = getLevelConfig(level);

    return (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                    ⚠️ Safety & Risk Intel
                </h4>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${config.color} ${config.bg}`}>
                    {level.toUpperCase()}
                </span>
            </div>

            {/* Risk banner */}
            <div className={`p-4 rounded-xl border flex gap-3 items-start ${config.bg}`}>
                {config.icon}
                <div className="space-y-1">
                    <p className={`font-bold text-sm ${config.color}`}>{config.text}</p>
                    <div className="text-xs text-zinc-300 space-y-1">
                        {reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-zinc-400 rounded-full shrink-0"></span>
                                <span>{reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Safety Alerts Lists */}
            {alerts && alerts.length > 0 && (
                <div className="space-y-2 pt-1">
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        Active Database Advisories
                    </h5>
                    <div className="space-y-2">
                        {alerts.map((alert, idx) => {
                            const isHigh = alert.severity === 'high';
                            return (
                                <div key={idx} className={`p-3 border rounded-xl flex gap-2.5 items-start ${
                                    isHigh ? 'bg-rose-950/20 border-rose-900/30 text-rose-300' : 'bg-amber-950/20 border-amber-900/30 text-amber-300'
                                }`}>
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                    <div className="text-[11px] leading-relaxed">
                                        <span className="font-bold uppercase block text-[9px] mb-0.5">
                                            {alert.type} Alert ({alert.severity})
                                        </span>
                                        {alert.message}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskAlert;
