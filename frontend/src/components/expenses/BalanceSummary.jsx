import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Smile } from 'lucide-react';

export default function BalanceSummary({ balances }) {
    if (!balances || balances.length === 0) {
        return (
            <div className="text-center py-8 bg-card/35 rounded-2xl border border-white/5 p-4">
                <p className="text-xs text-muted-foreground">No balance summary available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 font-semibold">User Balances</h3>
            <div className="space-y-3">
                {balances.map((item) => {
                    const traveler = item.userId;
                    const name = traveler?.fullname || traveler?.username || 'Group Traveler';
                    const pic = traveler?.profilepicture || 'https://via.placeholder.com/150';
                    const net = item.netBalance;

                    let statusClass = 'text-muted-foreground border-white/5';
                    let amountText = `$0.00`;
                    let statusLabel = 'Settled Up';
                    let Icon = Smile;

                    if (net > 0.01) {
                        statusClass = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
                        amountText = `+$${net.toFixed(2)}`;
                        statusLabel = 'Is owed';
                        Icon = ArrowUpRight;
                    } else if (net < -0.01) {
                        statusClass = 'text-pink-400 border-pink-500/20 bg-pink-500/5';
                        amountText = `-$${Math.abs(net).toFixed(2)}`;
                        statusLabel = 'Owes';
                        Icon = ArrowDownLeft;
                    }

                    return (
                        <div
                            key={traveler?._id || traveler}
                            className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all duration-300 hover:scale-[1.01] ${statusClass}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0">
                                    <img src={pic} alt={name} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-xs font-bold text-foreground block truncate">{name}</span>
                                    <span className="text-[10px] text-muted-foreground/80 font-black uppercase tracking-widest">{statusLabel}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black">{amountText}</span>
                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                                    <Icon size={12} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
