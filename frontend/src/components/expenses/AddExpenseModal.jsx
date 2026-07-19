import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle, Sparkles, Check, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function AddExpenseModal({ isOpen, onClose, members, onAddExpense, onUpdateExpense, editingExpense = null }) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [splitType, setSplitType] = useState('equal');
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [customAmounts, setCustomAmounts] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset or pre-fill form when modal state changes
    useEffect(() => {
        if (isOpen) {
            if (editingExpense) {
                setDescription(editingExpense.description || '');
                setAmount(editingExpense.amount ? editingExpense.amount.toString() : '');
                setPaidBy(editingExpense.paidBy?._id || editingExpense.paidBy || '');
                setSplitType(editingExpense.splitType || 'equal');
                
                const participantIds = editingExpense.splitDetails?.map(d => d.userId?._id || d.userId) || [];
                setSelectedParticipants(participantIds);
                
                const amountsObj = {};
                editingExpense.splitDetails?.forEach(d => {
                    const uId = d.userId?._id || d.userId;
                    if (uId) {
                        amountsObj[uId] = d.amount ? d.amount.toString() : '';
                    }
                });
                setCustomAmounts(amountsObj);
            } else {
                setDescription('');
                setAmount('');
                if (members && members.length > 0) {
                    const firstMemberId = members[0]._id || members[0];
                    setPaidBy(firstMemberId);
                    setSelectedParticipants(members.map(m => m._id || m));
                }
                setSplitType('equal');
                setCustomAmounts({});
            }
        }
    }, [isOpen, members, editingExpense]);

    const handleParticipantToggle = (userId) => {
        if (selectedParticipants.includes(userId)) {
            // Keep at least one participant
            if (selectedParticipants.length > 1) {
                setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
            }
        } else {
            setSelectedParticipants([...selectedParticipants, userId]);
        }
    };

    const handleCustomAmountChange = (userId, value) => {
        setCustomAmounts(prev => ({
            ...prev,
            [userId]: value
        }));
    };

    // Calculate total custom split sum
    const customSum = selectedParticipants.reduce((sum, userId) => {
        const val = parseFloat(customAmounts[userId]) || 0;
        return sum + val;
    }, 0);

    const difference = parseFloat((parseFloat(amount) || 0) - customSum).toFixed(2);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numAmount = parseFloat(amount);
        if (!description.trim()) {
            return toast.error('Please enter a description');
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            return toast.error('Please enter a valid amount');
        }
        if (!paidBy) {
            return toast.error('Please select who paid');
        }
        if (selectedParticipants.length === 0) {
            return toast.error('Please select at least one participant');
        }

        let splitDetails = [];

        if (splitType === 'custom') {
            if (Math.abs(numAmount - customSum) > 0.02) {
                return toast.error(`Split amounts must equal total amount exactly (Difference: ${difference})`);
            }
            splitDetails = selectedParticipants.map(userId => ({
                userId,
                amount: parseFloat(parseFloat(customAmounts[userId]).toFixed(2)) || 0
            }));
        }

        setIsSubmitting(true);
        try {
            if (editingExpense) {
                await onUpdateExpense(editingExpense._id, {
                    paidBy,
                    amount: numAmount,
                    description: description.trim(),
                    splitType,
                    participants: selectedParticipants,
                    splitDetails
                });
                toast.success('Expense updated successfully!');
            } else {
                await onAddExpense({
                    paidBy,
                    amount: numAmount,
                    description: description.trim(),
                    splitType,
                    participants: selectedParticipants,
                    splitDetails
                });
            }
            onClose();
        } catch (error) {
            console.error('Failed to submit expense:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-white/10 w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-muted-foreground hover:text-foreground hover:bg-white/10 p-2 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black">{editingExpense ? 'Edit Trip Expense' : 'Add Trip Expense'}</h2>
                        <p className="text-xs text-muted-foreground">{editingExpense ? 'Modify this expense item and recalculate splits.' : 'Log expenses and let AdventureNexus auto-split them.'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs uppercase tracking-widest font-black text-muted-foreground block mb-2">Description</label>
                        <Input
                            required
                            placeholder="e.g. Sushi dinner, Taxi ride, Museum ticket"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-white/5 border-white/10 rounded-2xl h-12 text-sm font-medium focus-visible:ring-primary text-foreground"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs uppercase tracking-widest font-black text-muted-foreground block mb-2">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-sm">$</span>
                                <Input
                                    required
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-white/5 border-white/10 rounded-2xl h-12 pl-8 text-sm font-medium focus-visible:ring-primary text-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-widest font-black text-muted-foreground block mb-2">Paid By</label>
                            <select
                                value={paidBy}
                                onChange={(e) => setPaidBy(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-sm font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                            >
                                {members.map((member) => (
                                    <option key={member._id || member} value={member._id || member} className="bg-card text-foreground">
                                        {member.fullname || member.username || 'Group Member'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-widest font-black text-muted-foreground block mb-2">Split Type</label>
                        <div className="grid grid-cols-2 bg-white/5 rounded-2xl p-1 border border-white/5">
                            <button
                                type="button"
                                onClick={() => setSplitType('equal')}
                                className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                    splitType === 'equal'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Split Equally
                            </button>
                            <button
                                type="button"
                                onClick={() => setSplitType('custom')}
                                className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                    splitType === 'custom'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Custom Split
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-widest font-black text-muted-foreground block mb-2">Split Participants</label>
                        <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                            {members.map((member) => {
                                const mId = member._id || member;
                                const isChecked = selectedParticipants.includes(mId);
                                return (
                                    <div key={mId} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
                                        <button
                                            type="button"
                                            onClick={() => handleParticipantToggle(mId)}
                                            className="flex items-center gap-3 text-left focus:outline-none flex-1"
                                        >
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                                isChecked
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'border-white/20 hover:border-white/40'
                                            }`}>
                                                {isChecked && <Check size={12} strokeWidth={3} />}
                                            </div>
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                                <img src={member.profilepicture || 'https://via.placeholder.com/150'} alt="Avatar" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold block">{member.fullname || member.username}</span>
                                                <span className="text-[10px] text-muted-foreground">@{member.username}</span>
                                            </div>
                                        </button>

                                        {splitType === 'custom' && isChecked && (
                                            <div className="relative w-24">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-black">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={customAmounts[mId] || ''}
                                                    onChange={(e) => handleCustomAmountChange(mId, e.target.value)}
                                                    className="bg-white/5 border-white/10 rounded-lg h-8 pl-6 text-xs text-right font-medium text-foreground w-full focus-visible:ring-primary"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {splitType === 'custom' && (
                        <div className={`flex items-center justify-between p-3 rounded-xl border text-xs font-black uppercase tracking-wider ${
                            Math.abs(parseFloat(difference)) === 0
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                        }`}>
                            <span className="flex items-center gap-1.5">
                                <AlertCircle size={14} />
                                {Math.abs(parseFloat(difference)) === 0 ? 'Splits match total amount!' : `Remaining Split Balance`}
                            </span>
                            <span>${difference}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting || (splitType === 'custom' && Math.abs(parseFloat(difference)) > 0.02)}
                        className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all"
                    >
                        {isSubmitting ? (editingExpense ? 'Saving Changes...' : 'Adding Expense...') : (editingExpense ? 'Save Changes' : 'Add Expense')}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
