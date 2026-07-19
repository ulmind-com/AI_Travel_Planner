import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Calendar, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function ExpenseList({ expenses, onEdit, onDelete }) {
    const [expandedExpense, setExpandedExpense] = useState(null);

    const toggleExpand = (id) => {
        setExpandedExpense(expandedExpense === id ? null : id);
    };

    if (!expenses || expenses.length === 0) {
        return (
            <div className="text-center py-12 bg-card/30 backdrop-blur-md rounded-[2rem] border border-white/5 p-6">
                <DollarSign className="mx-auto text-muted-foreground mb-3 opacity-30" size={36} />
                <p className="font-bold text-sm">No expenses logged yet</p>
                <p className="text-xs text-muted-foreground mt-1">Tap "+ Add Expense" to start tracking trip spending.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Payment Log</h3>
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {expenses.map((expense) => {
                    const isExpanded = expandedExpense === expense._id;
                    const paidByName = expense.paidBy?.fullname || expense.paidBy?.username || 'Unknown Traveler';
                    const paidByPic = expense.paidBy?.profilepicture || 'https://via.placeholder.com/150';
                    const formattedDate = expense.createdAt
                        ? new Date(expense.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Today';

                    return (
                        <div
                            key={expense._id}
                            className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-card/50"
                        >
                            <div
                                onClick={() => toggleExpand(expense._id)}
                                className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                                        <img src={paidByPic} alt={paidByName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-foreground truncate">{expense.description}</h4>
                                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                            <span>Paid by {paidByName}</span>
                                            <span>•</span>
                                            <Calendar size={10} />
                                            <span>{formattedDate}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-sm font-black text-foreground">${expense.amount.toFixed(2)}</div>
                                        <div className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-black uppercase tracking-widest inline-block mt-0.5">
                                            {expense.splitType}
                                        </div>
                                    </div>
                                    <button className="text-muted-foreground hover:text-foreground">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden bg-black/10 border-t border-white/5"
                                    >
                                        <div className="p-4 space-y-3">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                                <Info size={10} /> Split breakdown details
                                            </div>
                                            <div className="grid gap-2">
                                                {expense.splitDetails.map((detail) => {
                                                    const participant = detail.userId;
                                                    const partName = participant?.fullname || participant?.username || 'Group Member';
                                                    const partPic = participant?.profilepicture || 'https://via.placeholder.com/150';

                                                    return (
                                                        <div key={participant?._id || participant} className="flex items-center justify-between gap-2 p-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 shrink-0">
                                                                    <img src={partPic} alt={partName} className="w-full h-full object-cover" />
                                                                </div>
                                                                <span className="text-xs font-semibold">{partName}</span>
                                                            </div>
                                                            <span className="text-xs font-black text-foreground/80">${detail.amount.toFixed(2)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            {/* Action Buttons: Edit and Delete */}
                                            {onEdit && onDelete && (
                                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5 mt-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(expense);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm("Are you sure you want to delete this expense? This will recalculate all group balances.")) {
                                                                onDelete(expense._id);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-xs font-black uppercase tracking-wider text-pink-400 hover:text-pink-300 transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
