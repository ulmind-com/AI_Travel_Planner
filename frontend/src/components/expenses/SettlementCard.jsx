import React, { useState } from 'react';
import { Send, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettlementCard({ settlements, onAddExpense, currentUser }) {
    const [settlingId, setSettlingId] = useState(null);

    const handleSettle = async (settlement, idx) => {
        setSettlingId(idx);
        try {
            // Settle is represented as a payment from the debtor to the creditor
            await onAddExpense({
                paidBy: settlement.from._id,
                amount: parseFloat(settlement.amount),
                description: `Debt Settlement: ${settlement.from.fullname} ➔ ${settlement.to.fullname}`,
                splitType: 'custom',
                participants: [settlement.to._id],
                splitDetails: [
                    { userId: settlement.to._id, amount: parseFloat(settlement.amount) }
                ]
            });
            toast.success(`Cleared debt suggestion successfully!`);
        } catch (err) {
            toast.error('Failed to clear debt suggestion');
        } finally {
            setSettlingId(null);
        }
    };

    if (!settlements || settlements.length === 0) {
        return (
            <div className="bg-card/40 backdrop-blur-xl border border-emerald-500/10 rounded-[2rem] p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <h4 className="font-black text-sm text-emerald-400">All Debts Settled!</h4>
                    <p className="text-xs text-muted-foreground mt-1">Excellent! No one owes anyone in this travel group.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 font-semibold flex items-center gap-1">
                <Sparkles size={12} className="text-primary animate-pulse" /> Settlement Paths
            </h3>
            <div className="space-y-3">
                {settlements.map((settlement, index) => {
                    const fromName = settlement.from.fullname || settlement.from.username;
                    const fromPic = settlement.from.profilepicture || 'https://via.placeholder.com/150';
                    const toName = settlement.to.fullname || settlement.to.username;
                    const toPic = settlement.to.profilepicture || 'https://via.placeholder.com/150';

                    // Check if current user is involved to highlight action
                    const isDebtor = currentUser && currentUser.id === settlement.from.firebaseUid;
                    const isCreditor = currentUser && currentUser.id === settlement.to.firebaseUid;

                    return (
                        <div
                            key={index}
                            className={`p-4 border rounded-[2rem] bg-card/30 backdrop-blur-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                isDebtor ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/5'
                            }`}
                        >
                            <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                                {/* Debtor */}
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                        <img src={fromPic} alt={fromName} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-xs font-bold truncate max-w-[90px]">{fromName}</span>
                                </div>

                                {/* Flow Indicator */}
                                <div className="flex flex-col items-center shrink-0 px-2 min-w-[50px]">
                                    <span className="text-[8px] font-black tracking-widest text-muted-foreground block uppercase mb-1">pays</span>
                                    <div className="relative w-10 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-[-50%] h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                                            style={{
                                                animation: 'flow-left-right 1.5s infinite linear'
                                            }}
                                        />
                                        <style>{`
                                            @keyframes flow-left-right {
                                                0% { left: -50%; }
                                                100% { left: 150%; }
                                            }
                                        `}</style>
                                    </div>
                                </div>

                                {/* Creditor */}
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                        <img src={toPic} alt={toName} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-xs font-bold truncate max-w-[90px]">{toName}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t border-white/5 sm:border-t-0">
                                <span className="text-sm font-black text-foreground">${settlement.amount.toFixed(2)}</span>
                                <button
                                    disabled={settlingId !== null}
                                    onClick={() => handleSettle(settlement, index)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                                        isDebtor
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.03]'
                                            : 'bg-white/5 hover:bg-white/10 text-foreground/80 hover:text-foreground hover:scale-[1.02]'
                                    }`}
                                >
                                    {settlingId === index ? 'Clearing...' : 'Clear Debt'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
