import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign,
    Sparkles,
    Plus,
    Activity,
    Brain,
    HelpCircle,
    TrendingUp,
    RefreshCw,
    Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/context/AuthContext';
import { useSocket } from '@/context/appContext';
import { expenseService } from '@/services/expenseService';
import AddExpenseModal from './AddExpenseModal';
import ExpenseList from './ExpenseList';
import BalanceSummary from './BalanceSummary';
import SettlementCard from './SettlementCard';
import toast from 'react-hot-toast';
import ExpenseGraph from './ExpenseGraph';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts';

export default function ExpenseDashboard({ groupId, members }) {
    const { getToken } = useAuth();
    const { user: currentUser } = useUser();
    const { socket } = useSocket();

    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState({
        totalGroupSpend: 0,
        balances: [],
        settlements: [],
        aiInsights: []
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [vizMode, setVizMode] = useState('graph');
    const [token, setToken] = useState(null);

    const handleSendEmailReport = async () => {
        if (expenses.length === 0) {
            toast.error("No expenses logged yet. Add some expenses first!");
            return;
        }

        try {
            setIsSendingEmail(true);
            const token = await getToken();
            const res = await expenseService.sendExpenseReportEmail(groupId, token);

            if (res.status === 'Success') {
                toast.success('Expense report successfully emailed to all group members!');
            } else {
                toast.error(res.message || 'Failed to send expense report email.');
            }
        } catch (error) {
            console.error('Error sending expense email:', error);
            toast.error(error.response?.data?.message || 'Failed to send email. Check your configurations.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    // Fetch initial expenses and summary details
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const activeToken = await getToken();
            setToken(activeToken);
            const expensesRes = await expenseService.getGroupExpenses(groupId, activeToken);
            const summaryRes = await expenseService.getExpenseSummary(groupId, activeToken);

            if (expensesRes.status === 'Success') {
                setExpenses(expensesRes.data);
            }
            if (summaryRes.status === 'Success') {
                setSummary(summaryRes.data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Failed to load expenses');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchData();
        }
    }, [groupId]);

    // Setup Socket.io Listeners for Real-time synchrony
    useEffect(() => {
        if (socket && groupId) {
            // Join group room
            socket.emit('group:join', groupId);

            // Expense Added Event
            const handleExpenseAdded = (newExpense) => {
                setExpenses(prev => {
                    if (prev.some(e => e._id === newExpense._id)) return prev;
                    return [newExpense, ...prev];
                });
                fetchData();
            };

            // Expense Updated Event
            const handleExpenseUpdated = (updatedExpense) => {
                setExpenses(prev => prev.map(e => e._id === updatedExpense._id ? updatedExpense : e));
                fetchData();
            };

            // Expense Deleted Event
            const handleExpenseDeleted = (deletedId) => {
                setExpenses(prev => prev.filter(e => e._id !== deletedId));
                fetchData();
            };

            // Balance Updated Event
            const handleBalanceUpdated = (data) => {
                setSummary(prev => ({
                    ...prev,
                    balances: data.balances,
                    settlements: data.settlements
                }));
            };

            socket.on('expense:added', handleExpenseAdded);
            socket.on('expense:updated', handleExpenseUpdated);
            socket.on('expense:deleted', handleExpenseDeleted);
            socket.on('balance:updated', handleBalanceUpdated);

            return () => {
                socket.off('expense:added', handleExpenseAdded);
                socket.off('expense:updated', handleExpenseUpdated);
                socket.off('expense:deleted', handleExpenseDeleted);
                socket.off('balance:updated', handleBalanceUpdated);
            };
        }
    }, [socket, groupId]);

    const handleAddExpenseSubmit = async (expensePayload) => {
        try {
            const token = await getToken();
            const res = await expenseService.addExpense({
                groupId,
                ...expensePayload
            }, token);

            if (res.status === 'Success') {
                toast.success('Expense item added successfully!');
                // Update local states immediately
                setExpenses(prev => [res.data.expenseItem, ...prev]);
                setSummary(prev => ({
                    ...prev,
                    totalGroupSpend: prev.totalGroupSpend + expensePayload.amount,
                    balances: res.data.balances,
                    settlements: res.data.settlements
                }));
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error(error.response?.data?.message || 'Failed to add expense');
            throw error;
        }
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleUpdateExpenseSubmit = async (expenseId, expensePayload) => {
        try {
            const token = await getToken();
            const res = await expenseService.updateExpense(expenseId, expensePayload, token);

            if (res.status === 'Success') {
                setExpenses(prev => prev.map(e => e._id === expenseId ? res.data : e));
                const summaryRes = await expenseService.getExpenseSummary(groupId, token);
                if (summaryRes.status === 'Success') {
                    setSummary(summaryRes.data);
                }
            }
        } catch (error) {
            console.error('Error updating expense:', error);
            toast.error(error.response?.data?.message || 'Failed to update expense');
            throw error;
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        try {
            const token = await getToken();
            const res = await expenseService.deleteExpense(expenseId, token);

            if (res.status === 'Success') {
                toast.success('Expense deleted successfully!');
                setExpenses(prev => prev.filter(e => e._id !== expenseId));
                const summaryRes = await expenseService.getExpenseSummary(groupId, token);
                if (summaryRes.status === 'Success') {
                    setSummary(summaryRes.data);
                }
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error(error.response?.data?.message || 'Failed to delete expense');
        }
    };

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    // Calculate own status
    const getOwnBalanceStatus = () => {
        if (!currentUser || !summary.balances.length) return { text: '$0.00', label: 'Settled Up', color: 'text-muted-foreground' };
        
        const own = summary.balances.find(b => {
            const bUid = b.userId?.firebaseUid || b.userId;
            return bUid === currentUser.id;
        });

        if (!own) return { text: '$0.00', label: 'Settled Up', color: 'text-muted-foreground' };

        if (own.netBalance > 0.01) {
            return {
                text: `+$${own.netBalance.toFixed(2)}`,
                label: 'You are owed',
                color: 'text-emerald-400'
            };
        } else if (own.netBalance < -0.01) {
            return {
                text: `-$${Math.abs(own.netBalance).toFixed(2)}`,
                label: 'You owe',
                color: 'text-pink-400'
            };
        }

        return { text: '$0.00', label: 'Settled Up', color: 'text-muted-foreground' };
    };

    const ownStatus = getOwnBalanceStatus();

    // Chart Data calculations
    // 1. Pie Chart Data (Share of payments per member)
    const paidByTotals = {};
    expenses.forEach(e => {
        const name = e.paidBy?.fullname || e.paidBy?.username || 'Unknown';
        paidByTotals[name] = (paidByTotals[name] || 0) + e.amount;
    });

    const pieData = Object.entries(paidByTotals).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
    }));

    // 2. Bar Chart Data (Net balances)
    const barData = summary.balances.map(b => ({
        name: b.userId?.username || 'Traveler',
        balance: parseFloat(b.netBalance.toFixed(2))
    }));

    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-xs text-muted-foreground">Loading expense sheets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Dashboard Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black flex items-center gap-1.5">
                        Budget Dashboard
                    </h2>
                    <p className="text-xs text-muted-foreground">Track lodging, dinner, activities splits and settlements in real time.</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto overflow-x-auto scrollbar-hide py-1">
                    <Button
                        onClick={handleManualRefresh}
                        className="h-10 w-10 shrink-0 p-0 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    </Button>
                    <Button
                        onClick={handleSendEmailReport}
                        disabled={isSendingEmail || expenses.length === 0}
                        className="h-10 px-4 shrink-0 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    >
                        <Mail size={14} className={isSendingEmail ? 'animate-pulse' : ''} />
                        {isSendingEmail ? 'Sending...' : 'Email Report'}
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="h-10 px-4 shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-transform"
                    >
                        <Plus size={14} /> Add Expense
                    </Button>
                </div>
            </div>

            {/* Dashboard Metric Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-5 rounded-[2rem] flex items-center gap-4 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black block">Total Group Spend</span>
                        <span className="text-xl font-black">${summary.totalGroupSpend.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-5 rounded-[2rem] flex items-center gap-4 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black block">{ownStatus.label}</span>
                        <span className={`text-xl font-black ${ownStatus.color}`}>{ownStatus.text}</span>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-5 rounded-[2rem] flex items-center gap-4 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                        <Brain size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black block">Pending Settlements</span>
                        <span className="text-xl font-black">{summary.settlements.length} Suggestions</span>
                    </div>
                </div>
            </div>

            {/* Two Column Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left panel: Visualizations & Log List */}
                <div className="lg:col-span-8 space-y-6 min-w-0">
                    {/* Visualizations Toggle */}
                    {expenses.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center bg-card/25 border border-white/5 p-1 rounded-2xl max-w-[260px] mx-auto sm:mx-0">
                                <button
                                    onClick={() => setVizMode('graph')}
                                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                        vizMode === 'graph'
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Debt Nexus
                                </button>
                                <button
                                    onClick={() => setVizMode('charts')}
                                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                        vizMode === 'charts'
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Spend Charts
                                </button>
                            </div>

                            {vizMode === 'graph' ? (
                                <ExpenseGraph
                                    groupId={groupId}
                                    token={token}
                                    refreshTrigger={expenses}
                                    currentUser={currentUser}
                                    onAddExpense={handleAddExpenseSubmit}
                                />
                            ) : (
                                <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-xl space-y-6">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                                            <TrendingUp size={12} /> Spend Insights
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground">Who paid what and current net standings.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Pie Chart: Distribution of payments */}
                                        {pieData.length > 0 && (
                                            <div className="space-y-2 bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Payment Distribution</h4>
                                                <div className="h-48">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={pieData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={40}
                                                                outerRadius={65}
                                                                paddingAngle={3}
                                                                dataKey="value"
                                                            >
                                                                {pieData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: '#121214',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                    borderRadius: '12px'
                                                                }}
                                                            />
                                                            <Legend wrapperStyle={{ fontSize: '9px' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bar Chart: Net Balances */}
                                        {barData.length > 0 && (
                                            <div className="space-y-2 bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Net Balance Standings</h4>
                                                <div className="h-48">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                                                            <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                                                            <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: '#121214',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                    borderRadius: '12px'
                                                                }}
                                                            />
                                                            <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                                                                {barData.map((entry, index) => {
                                                                    const color = entry.balance >= 0 ? '#10b981' : '#ec4899';
                                                                    return <Cell key={`cell-${index}`} fill={color} />;
                                                                })}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <ExpenseList 
                        expenses={expenses} 
                        onEdit={handleEditExpense} 
                        onDelete={handleDeleteExpense} 
                    />
                </div>

                {/* Right panel: AI Insights & Standings */}
                <div className="lg:col-span-4 space-y-6">
                    {/* AI Insights Card */}
                    {summary.aiInsights && summary.aiInsights.length > 0 && (
                        <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-5 rounded-[2rem] shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[30px] pointer-events-none" />
                            <div className="flex items-center gap-2 mb-3">
                                <Brain size={16} className="text-primary animate-pulse" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-primary">Nexus AI Insights</h3>
                            </div>
                            <ul className="space-y-2">
                                {summary.aiInsights.map((insight, index) => (
                                    <li key={index} className="text-xs font-medium text-muted-foreground leading-relaxed flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Settlements suggestions */}
                    <SettlementCard
                        settlements={summary.settlements}
                        onAddExpense={handleAddExpenseSubmit}
                        currentUser={currentUser}
                    />

                    {/* User Balances list */}
                    <BalanceSummary balances={summary.balances} />
                </div>
            </div>

            {/* Add Expense Modal */}
            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                }}
                members={members}
                onAddExpense={handleAddExpenseSubmit}
                onUpdateExpense={handleUpdateExpenseSubmit}
                editingExpense={editingExpense}
            />
        </div>
    );
}
