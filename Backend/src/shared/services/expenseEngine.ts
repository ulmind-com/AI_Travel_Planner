import GroupExpense from '../database/models/groupExpenseModel';
import ExpenseItem from '../database/models/expenseItemModel';
import UserBalance from '../database/models/userBalanceModel';
import User from '../database/models/userModel';
import mongoose from 'mongoose';
import logger from '../utils/logger';

export interface ISettlement {
    from: {
        _id: string;
        username: string;
        fullname: string;
        profilepicture: string;
    };
    to: {
        _id: string;
        username: string;
        fullname: string;
        profilepicture: string;
    };
    amount: number;
}

/**
 * Recalculate balances for all participants in a group
 */
export const recalculateGroupBalances = async (groupId: string): Promise<any> => {
    try {
        const groupExpenses = await GroupExpense.find({ groupId });
        const expenseIds = groupExpenses.map(ge => ge._id);

        // Fetch all expense items
        const expenseItems = await ExpenseItem.find({ expenseId: { $in: expenseIds } });

        // Fetch all group members/participants
        // To be safe, collect all user IDs involved in the group's expenses
        const userIdsSet = new Set<string>();
        
        // Also fetch the group itself to get its members list
        const Group = mongoose.model('Group');
        const group = await Group.findById(groupId);
        if (group && group.members) {
            group.members.forEach((mId: any) => userIdsSet.add(mId.toString()));
        }

        expenseItems.forEach(item => {
            if (item.paidBy) userIdsSet.add(item.paidBy.toString());
            item.splitDetails.forEach(detail => {
                if (detail.userId) userIdsSet.add(detail.userId.toString());
            });
        });

        const allUserIds = Array.from(userIdsSet);

        // Initialize user balances map
        const balancesMap: { [userId: string]: { paid: number; share: number } } = {};
        allUserIds.forEach(uId => {
            balancesMap[uId] = { paid: 0, share: 0 };
        });

        // Accumulate paid amounts and shares
        expenseItems.forEach(item => {
            const payerId = item.paidBy.toString();
            if (balancesMap[payerId]) {
                balancesMap[payerId].paid += item.amount;
            }

            item.splitDetails.forEach(detail => {
                const consumerId = detail.userId.toString();
                if (balancesMap[consumerId]) {
                    balancesMap[consumerId].share += detail.amount;
                }
            });
        });

        // Calculate netBalances and save UserBalance documents
        const updatedBalances = [];
        for (const uId of allUserIds) {
            const { paid, share } = balancesMap[uId];
            const netBalance = parseFloat((paid - share).toFixed(2));
            const owes = netBalance < 0 ? Math.abs(netBalance) : 0;
            const owed = netBalance > 0 ? netBalance : 0;

            const userBalance = await UserBalance.findOneAndUpdate(
                { groupId: new mongoose.Types.ObjectId(groupId), userId: new mongoose.Types.ObjectId(uId) },
                {
                    owes,
                    owed,
                    netBalance
                },
                { upsert: true, new: true }
            ).populate('userId', 'username fullname profilepicture');

            updatedBalances.push(userBalance);
        }

        return updatedBalances;
    } catch (error) {
        logger.error('[ExpenseEngine] Error recalculating balances:', error);
        throw error;
    }
};

/**
 * Greedy algorithm to find minimized transactions to settle all debts in the group
 */
export const calculateSettlements = async (groupId: string): Promise<ISettlement[]> => {
    try {
        const balances = await UserBalance.find({ groupId })
            .populate('userId', 'username fullname profilepicture')
            .lean();

        // Separate creditors and debtors
        const creditors = balances
            .filter((b: any) => b.netBalance > 0.01)
            .map((b: any) => ({
                user: b.userId,
                balance: b.netBalance
            }))
            .sort((a, b) => b.balance - a.balance); // Descending (largest owed first)

        const debtors = balances
            .filter((b: any) => b.netBalance < -0.01)
            .map((b: any) => ({
                user: b.userId,
                balance: Math.abs(b.netBalance)
            }))
            .sort((a, b) => b.balance - a.balance); // Descending (largest owes first)

        const settlements: ISettlement[] = [];

        let i = 0; // index for debtors
        let j = 0; // index for creditors

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const settleAmount = parseFloat(Math.min(debtor.balance, creditor.balance).toFixed(2));

            if (settleAmount > 0) {
                settlements.push({
                    from: {
                        _id: debtor.user._id.toString(),
                        username: debtor.user.username,
                        fullname: debtor.user.fullname,
                        profilepicture: debtor.user.profilepicture
                    },
                    to: {
                        _id: creditor.user._id.toString(),
                        username: creditor.user.username,
                        fullname: creditor.user.fullname,
                        profilepicture: creditor.user.profilepicture
                    },
                    amount: settleAmount
                });

                debtor.balance -= settleAmount;
                creditor.balance -= settleAmount;
            }

            if (debtor.balance < 0.01) {
                i++;
            }
            if (creditor.balance < 0.01) {
                j++;
            }
        }

        return settlements;
    } catch (error) {
        logger.error('[ExpenseEngine] Error calculating settlements:', error);
        throw error;
    }
};

/**
 * AI Insight to identify potential anomalies or split suggestions
 */
export const getAIExpenseInsights = (expenses: any[], balances: any[]): string[] => {
    const insights: string[] = [];
    if (expenses.length === 0) return insights;

    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Find highest spender
    const spenders: { [username: string]: number } = {};
    expenses.forEach(e => {
        const name = e.paidBy?.fullname || e.paidBy?.username || 'Unknown';
        spenders[name] = (spenders[name] || 0) + e.amount;
    });

    const sortedSpenders = Object.entries(spenders).sort((a, b) => b[1] - a[1]);
    if (sortedSpenders.length > 0) {
        const [topSpender, topSpenderAmount] = sortedSpenders[0];
        const ratio = topSpenderAmount / totalSpending;
        if (ratio > 0.6 && totalSpending > 500) {
            insights.push(`💡 AI insight: ${topSpender} paid for ${Math.round(ratio * 100)}% of all group expenses. Consider letting others pay for upcoming expenses to balance it out.`);
        }
    }

    // Check for heavy debtors
    balances.forEach((b: any) => {
        if (b.netBalance < -150) {
            const name = b.userId?.fullname || b.userId?.username || 'A group member';
            insights.push(`⚠️ ${name} owes a significant amount (₹${Math.abs(b.netBalance)}). We recommend settling up soon!`);
        }
    });

    return insights;
};
