import { Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import GroupExpense from '../../../shared/database/models/groupExpenseModel';
import ExpenseItem from '../../../shared/database/models/expenseItemModel';
import UserBalance from '../../../shared/database/models/userBalanceModel';
import Group from '../../../shared/database/models/groupModel';
import {
    recalculateGroupBalances,
    calculateSettlements,
    getAIExpenseInsights
} from '../../../shared/services/expenseEngine';
import redis from '../../../shared/redis/client';
import { getIO } from '../../../shared/socket/socket';
import logger from '../../../shared/utils/logger';
import mongoose from 'mongoose';
import { generateExpensePDF } from '../../../shared/utils/pdfGenerator';
import { sendEmail } from '../../../shared/services/mailService';

/**
 * Helper to invalidate group expense cache
 */
const invalidateGroupExpenseCache = async (groupId: string) => {
    if (redis.status === 'ready') {
        const cacheKey = `expense:summary:${groupId}`;
        await redis.del(cacheKey);
        logger.info(`[Expense Cache] Invalidated summary cache for group: ${groupId}`);
    }
};

/**
 * Add a new expense item to a group
 */
export const addExpense = async (req: Request, res: Response) => {
    try {
        const {
            groupId,
            paidBy,
            amount,
            description,
            splitType,
            participants,
            splitDetails: inputSplitDetails
        } = req.body;

        const authUserId = (req as any).user?._id;

        // 1. Basic validation
        if (!groupId || !paidBy || !amount || !description || !splitType || !participants || !participants.length) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'Failed',
                message: 'Missing required fields: groupId, paidBy, amount, description, splitType, participants'
            });
        }

        // 2. Validate group membership
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Group not found'
            });
        }

        const isMember = group.members.some(mId => mId.toString() === authUserId);
        if (!isMember) {
            return res.status(StatusCodes.FORBIDDEN).json({
                status: 'Failed',
                message: 'Access denied. You are not a member of this travel group.'
            });
        }

        // 3. Process splits
        let finalSplitDetails = [];
        if (splitType === 'equal') {
            const participantCount = participants.length;
            const equalAmount = parseFloat((amount / participantCount).toFixed(2));
            
            // Handle precision residue to ensure total equals exact amount
            const residue = parseFloat((amount - (equalAmount * participantCount)).toFixed(2));

            finalSplitDetails = participants.map((pId: string, idx: number) => {
                const isLast = idx === participantCount - 1;
                return {
                    userId: new mongoose.Types.ObjectId(pId),
                    amount: isLast ? parseFloat((equalAmount + residue).toFixed(2)) : equalAmount
                };
            });
        } else if (splitType === 'custom') {
            if (!inputSplitDetails || !Array.isArray(inputSplitDetails) || inputSplitDetails.length === 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'Failed',
                    message: 'Split details are required for custom split type.'
                });
            }

            // Verify split details match total amount
            const sumOfSplits = inputSplitDetails.reduce((sum, item) => sum + (item.amount || 0), 0);
            if (Math.abs(sumOfSplits - amount) > 0.02) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'Failed',
                    message: `Sum of custom splits (${sumOfSplits}) must equal the total amount (${amount}).`
                });
            }

            finalSplitDetails = inputSplitDetails.map(item => ({
                userId: new mongoose.Types.ObjectId(item.userId),
                amount: parseFloat(Number(item.amount).toFixed(2))
            }));
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'Failed',
                message: 'Invalid splitType. Must be either "equal" or "custom".'
            });
        }

        // 4. Fetch or create GroupExpense container
        let groupExpense = await GroupExpense.findOne({ groupId });
        if (!groupExpense) {
            groupExpense = new GroupExpense({
                groupId: new mongoose.Types.ObjectId(groupId),
                title: `${group.name} Trip Expenses`,
                createdBy: new mongoose.Types.ObjectId(authUserId),
                totalAmount: 0,
                participants: []
            });
        }

        // Create the ExpenseItem
        const expenseItem = new ExpenseItem({
            expenseId: groupExpense._id,
            paidBy: new mongoose.Types.ObjectId(paidBy),
            amount: parseFloat(Number(amount).toFixed(2)),
            description,
            splitType,
            splitDetails: finalSplitDetails
        });

        await expenseItem.save();

        // Update GroupExpense container metadata
        groupExpense.totalAmount = parseFloat((groupExpense.totalAmount + amount).toFixed(2));
        
        // Add new participants to the set
        const currentParticipants = groupExpense.participants.map(p => p.toString());
        participants.forEach((pId: string) => {
            if (!currentParticipants.includes(pId)) {
                groupExpense?.participants.push(new mongoose.Types.ObjectId(pId));
            }
        });

        await groupExpense.save();

        // 5. Trigger recalculations (Debt engine)
        const updatedBalances = await recalculateGroupBalances(groupId);
        const settlements = await calculateSettlements(groupId);

        // Invalidate Redis cache
        await invalidateGroupExpenseCache(groupId);

        // Populate paidBy on response for neat UI
        const populatedExpense = await ExpenseItem.findById(expenseItem._id)
            .populate('paidBy', 'username fullname profilepicture')
            .populate('splitDetails.userId', 'username fullname profilepicture');

        // 6. Broadcast socket events
        try {
            const io = getIO();
            if (io) {
                io.to(`group:${groupId}`).emit('expense:added', populatedExpense);
                io.to(`group:${groupId}`).emit('balance:updated', {
                    balances: updatedBalances,
                    settlements
                });
            }
        } catch (socketError) {
            logger.warn('Socket broadcast skipped. Client might not be connected yet.');
        }

        return res.status(StatusCodes.CREATED).json({
            status: 'Success',
            message: 'Expense item added and group balances recalculated.',
            data: {
                expenseItem: populatedExpense,
                balances: updatedBalances,
                settlements
            }
        });

    } catch (error) {
        logger.error('[addExpense Error]:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        });
    }
};

/**
 * Fetch all expense items for a group
 */
export const getGroupExpenses = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const authUserId = (req as any).user?._id;

        // Verify membership
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Group not found'
            });
        }

        const isMember = group.members.some(mId => mId.toString() === authUserId);
        if (!isMember) {
            return res.status(StatusCodes.FORBIDDEN).json({
                status: 'Failed',
                message: 'Access denied. You are not a member of this travel group.'
            });
        }

        const groupExpense = await GroupExpense.findOne({ groupId });
        if (!groupExpense) {
            return res.status(StatusCodes.OK).json({
                status: 'Success',
                data: []
            });
        }

        const items = await ExpenseItem.find({ expenseId: groupExpense._id })
            .populate('paidBy', 'username fullname profilepicture')
            .populate('splitDetails.userId', 'username fullname profilepicture')
            .sort({ createdAt: -1 });

        return res.status(StatusCodes.OK).json({
            status: 'Success',
            data: items
        });
    } catch (error) {
        logger.error('[getGroupExpenses Error]:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        });
    }
};

/**
 * Fetch financial summary (balances, settlements, insights, totals) with caching support
 */
export const getExpenseSummary = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const authUserId = (req as any).user?._id;

        // Verify membership
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Group not found'
            });
        }

        const isMember = group.members.some(mId => mId.toString() === authUserId);
        if (!isMember) {
            return res.status(StatusCodes.FORBIDDEN).json({
                status: 'Failed',
                message: 'Access denied. You are not a member of this travel group.'
            });
        }

        // 1. Try Redis cache hit
        const cacheKey = `expense:summary:${groupId}`;
        if (redis.status === 'ready') {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                logger.info(`[Expense Cache] Summary cache hit for group: ${groupId}`);
                return res.status(StatusCodes.OK).json({
                    status: 'Success',
                    data: JSON.parse(cachedData)
                });
            }
        }

        // 2. Cache miss -> calculate on demand
        const groupExpense = await GroupExpense.findOne({ groupId });
        const totalGroupSpend = groupExpense ? groupExpense.totalAmount : 0;

        // Ensure balances exist in DB
        const balances = await recalculateGroupBalances(groupId);
        const settlements = await calculateSettlements(groupId);

        // Fetch items for spending insights
        const expenseIds = groupExpense ? [groupExpense._id] : [];
        const expenseItems = await ExpenseItem.find({ expenseId: { $in: expenseIds } }).populate('paidBy', 'fullname username');

        const aiInsights = getAIExpenseInsights(expenseItems, balances);

        const summary = {
            totalGroupSpend,
            balances,
            settlements,
            aiInsights
        };

        // 3. Cache the calculated summary for 5 minutes
        if (redis.status === 'ready') {
            await redis.setex(cacheKey, 300, JSON.stringify(summary));
            logger.info(`[Expense Cache] Created new summary cache for group: ${groupId}`);
        }

        return res.status(StatusCodes.OK).json({
            status: 'Success',
            data: summary
        });
    } catch (error) {
        logger.error('[getExpenseSummary Error]:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        });
    }
};

/**
 * Send expense split breakdown and PDF attachment to all group members
 */
export const sendExpenseReportEmail = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const authUserId = (req as any).user?._id;

        // 1. Verify membership and populate members to get their emails
        const group = await Group.findById(groupId).populate('members', 'email username fullname');
        if (!group) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Group not found'
            });
        }

        const isMember = group.members.some(m => (m as any)._id.toString() === authUserId.toString());
        if (!isMember) {
            return res.status(StatusCodes.FORBIDDEN).json({
                status: 'Failed',
                message: 'Access denied. You are not a member of this travel group.'
            });
        }

        // 2. Fetch or create GroupExpense container
        const groupExpense = await GroupExpense.findOne({ groupId });
        const totalSpend = groupExpense ? groupExpense.totalAmount : 0;

        // Ensure balances exist in DB
        const balances = await recalculateGroupBalances(groupId);
        const settlements = await calculateSettlements(groupId);

        // Fetch all expense items populated
        const expenseIds = groupExpense ? [groupExpense._id] : [];
        const expenses = await ExpenseItem.find({ expenseId: { $in: expenseIds } })
            .populate('paidBy', 'fullname username email')
            .populate('splitDetails.userId', 'fullname username email')
            .sort({ createdAt: -1 });

        // 3. Generate PDF
        const pdfBuffer = generateExpensePDF(group.name, totalSpend, expenses, settlements, balances);

        // 4. Construct Email Components
        // 4.1. Balance standings rows
        let balanceRows = '';
        for (const b of balances) {
            const name = (b.userId as any)?.fullname || (b.userId as any)?.username || 'Traveler';
            const bal = b.netBalance;
            let classColor = 'neutral';
            let textValue = `$${bal.toFixed(2)}`;
            if (bal > 0.01) {
                classColor = 'positive';
                textValue = `+$${bal.toFixed(2)}`;
            } else if (bal < -0.01) {
                classColor = 'negative';
                textValue = `-$${Math.abs(bal).toFixed(2)}`;
            } else {
                textValue = 'Settled Up';
            }
            balanceRows += `
                <tr>
                    <td>${name}</td>
                    <td class="text-right ${classColor}">${textValue}</td>
                </tr>
            `;
        }

        // 4.2. Settlements list
        let settlementDetails = '';
        if (settlements.length === 0) {
            settlementDetails = '<div class="settlement-item" style="border-left-color: #10b981; background-color: rgba(16,185,129,0.05);">All members are settled up! No transactions needed.</div>';
        } else {
            for (const s of settlements) {
                const fromName = (s.from as any)?.fullname || (s.from as any)?.username || 'Traveler';
                const toName = (s.to as any)?.fullname || (s.to as any)?.username || 'Traveler';
                settlementDetails += `
                    <div class="settlement-item">
                        <strong>${fromName}</strong> pays <strong>$${s.amount.toFixed(2)}</strong> to <strong>${toName}</strong>
                    </div>
                `;
            }
        }

        // 4.3. Compile HTML
        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0b0b0f; color: #e2e8f0; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #12121a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    .header { text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; background: linear-gradient(to right, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                    .title { color: #ffffff; font-size: 20px; margin-top: 15px; margin-bottom: 5px; font-weight: 800; }
                    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 0; }
                    .card { background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-top: 20px; }
                    .card-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #a855f7; font-weight: 800; margin-bottom: 10px; }
                    .stat-value { font-size: 28px; font-weight: bold; color: #ffffff; }
                    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    .table th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                    .table td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1; }
                    .text-right { text-align: right; }
                    .positive { color: #10b981; font-weight: bold; }
                    .negative { color: #f43f5e; font-weight: bold; }
                    .settlement-item { padding: 8px 12px; background-color: rgba(99,102,241,0.05); border-left: 3px solid #6366f1; border-radius: 4px; font-size: 13px; color: #e2e8f0; margin-bottom: 8px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">AdventureNexus</div>
                        <div class="title">Group Expense Report</div>
                        <div class="subtitle">Here is the final split breakdown for your trip: <strong>${group.name}</strong></div>
                    </div>
                    
                    <div class="card">
                        <div class="card-title">Total Group Spend</div>
                        <div class="stat-value">$${totalSpend.toFixed(2)}</div>
                    </div>
                    
                    <div class="card">
                        <div class="card-title">Net Balance Standings</div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th class="text-right">Net Standing</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${balanceRows}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="card">
                        <div class="card-title">Suggested Settlements</div>
                        ${settlementDetails}
                    </div>
                    
                    <p style="font-size: 13px; color: #94a3b8; margin-top: 25px; line-height: 1.5;">
                        We have attached a complete detailed PDF containing the full list of all expenses and split breakdown. Please review it and settle your payments!
                    </p>
                    
                    <div class="footer">
                        AdventureNexus &copy; 2026. Made with ❤️ for explorers.
                    </div>
                </div>
            </body>
            </html>
        `;

        // 5. Send email to all group members who have an email address configured
        const emails = group.members
            .map(m => (m as any).email)
            .filter(email => email && typeof email === 'string' && email.includes('@'));

        if (emails.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'Failed',
                message: 'No members with valid email addresses found in this group.'
            });
        }

        // Send to each email
        const mailPromises = emails.map(email => 
            sendEmail({
                to: email,
                subject: `AdventureNexus Group Expense Report - ${group.name}`,
                html: htmlBody,
                attachments: [
                    {
                        filename: `${group.name.replace(/\s+/g, '_')}_Expense_Report.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            })
        );

        await Promise.all(mailPromises);

        return res.status(StatusCodes.OK).json({
            status: 'Success',
            message: `Expense reports with PDF attachments successfully sent to ${emails.length} group members.`
        });

    } catch (error) {
        logger.error('[sendExpenseReportEmail Error]:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

/**
 * Fetch all expense items where the logged in user is either payer or participant
 */
export const getUserExpenses = async (req: Request, res: Response) => {
    try {
        const authUserId = (req as any).user?._id;
        
        const items = await ExpenseItem.find({
            $or: [
                { paidBy: authUserId },
                { 'splitDetails.userId': authUserId }
            ]
        })
        .populate('paidBy', 'username fullname profilepicture')
        .populate('splitDetails.userId', 'username fullname profilepicture')
        .sort({ createdAt: -1 });

        return res.status(StatusCodes.OK).json({
            status: 'Success',
            data: items
        });
    } catch (error) {
        logger.error('[getUserExpenses Error]:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        });
    }
};

/**
 * Update an existing expense item
 */
export const updateExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            amount,
            description,
            splitType,
            participants,
            splitDetails: inputSplitDetails
        } = req.body;
        
        const authUserId = (req as any).user?._id;

        const expenseItem = await ExpenseItem.findById(id);
        if (!expenseItem) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Expense item not found'
            });
        }

        const groupExpense = await GroupExpense.findById(expenseItem.expenseId);
        if (!groupExpense) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Associated Group Expense container not found'
            });
        }

        const groupId = groupExpense.groupId.toString();

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Group not found'
            });
        }

        const isMember = group.members.some(mId => mId.toString() === authUserId);
        if (!isMember) {
            return res.status(StatusCodes.FORBIDDEN).json({
                status: 'Failed',
                message: 'Access denied. You are not a member of this travel group.'
            });
        }

        const oldAmount = expenseItem.amount;
        let finalSplitDetails = expenseItem.splitDetails;
        let newAmount = expenseItem.amount;

        if (amount !== undefined) {
            newAmount = parseFloat(Number(amount).toFixed(2));
            expenseItem.amount = newAmount;
        }

        const currentSplitType = splitType || expenseItem.splitType;
        const currentParticipants = participants || expenseItem.splitDetails.map(d => d.userId.toString());

        if (splitType !== undefined) {
            expenseItem.splitType = splitType;
        }

        if (currentSplitType === 'equal') {
            const participantCount = currentParticipants.length;
            const equalAmount = parseFloat((newAmount / participantCount).toFixed(2));
            const residue = parseFloat((newAmount - (equalAmount * participantCount)).toFixed(2));

            finalSplitDetails = currentParticipants.map((pId: string, idx: number) => {
                const isLast = idx === participantCount - 1;
                return {
                    userId: new mongoose.Types.ObjectId(pId),
                    amount: isLast ? parseFloat((equalAmount + residue).toFixed(2)) : equalAmount
                };
            }) as any;
        } else if (currentSplitType === 'custom') {
            if (!inputSplitDetails || !Array.isArray(inputSplitDetails) || inputSplitDetails.length === 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'Failed',
                    message: 'Split details are required for custom split type.'
                });
            }

            const sumOfSplits = inputSplitDetails.reduce((sum, item) => sum + (item.amount || 0), 0);
            if (Math.abs(sumOfSplits - newAmount) > 0.02) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'Failed',
                    message: `Sum of custom splits (${sumOfSplits}) must equal the total amount (${newAmount}).`
                });
            }

            finalSplitDetails = inputSplitDetails.map(item => ({
                userId: new mongoose.Types.ObjectId(item.userId),
                amount: parseFloat(Number(item.amount).toFixed(2))
            })) as any;
        }

        expenseItem.splitDetails = finalSplitDetails;
        if (description !== undefined) {
            expenseItem.description = description;
        }

        await expenseItem.save();

        groupExpense.totalAmount = parseFloat((groupExpense.totalAmount - oldAmount + newAmount).toFixed(2));
        
        const currentParticipantsSet = groupExpense.participants.map(p => p.toString());
        currentParticipants.forEach((pId: string) => {
            if (!currentParticipantsSet.includes(pId)) {
                groupExpense?.participants.push(new mongoose.Types.ObjectId(pId));
            }
        });

        await groupExpense.save();

        await recalculateGroupBalances(groupId);
        const settlements = await calculateSettlements(groupId);
        await invalidateGroupExpenseCache(groupId);

        const populatedExpense = await ExpenseItem.findById(expenseItem._id)
            .populate('paidBy', 'username fullname profilepicture')
            .populate('splitDetails.userId', 'username fullname profilepicture');

        try {
            const io = getIO();
            if (io) {
                io.to(`group:${groupId}`).emit('expense:updated', populatedExpense);
            }
        } catch (socketError) {
            logger.warn('Socket broadcast skipped.');
        }

        return res.status(StatusCodes.OK).json({
            status: 'Success',
            message: 'Expense item updated and group balances recalculated.',
            data: populatedExpense
        });

    } catch (error) {
        logger.error('[updateExpense Error]:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        });
    }
};

/**
 * Delete an existing expense item
 */
export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const authUserId = (req as any).user?._id;

        const expenseItem = await ExpenseItem.findById(id);
        if (!expenseItem) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Expense item not found'
            });
        }

        const groupExpense = await GroupExpense.findById(expenseItem.expenseId);
        if (!groupExpense) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Associated Group Expense container not found'
            });
        }

        const groupId = groupExpense.groupId.toString();

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Group not found'
            });
        }

        const isMember = group.members.some(mId => mId.toString() === authUserId);
        if (!isMember) {
            return res.status(StatusCodes.FORBIDDEN).json({
                status: 'Failed',
                message: 'Access denied. You are not a member of this travel group.'
            });
        }

        const amount = expenseItem.amount;

        await ExpenseItem.findByIdAndDelete(id);

        groupExpense.totalAmount = Math.max(0, parseFloat((groupExpense.totalAmount - amount).toFixed(2)));
        await groupExpense.save();

        await recalculateGroupBalances(groupId);
        const settlements = await calculateSettlements(groupId);
        await invalidateGroupExpenseCache(groupId);

        try {
            const io = getIO();
            if (io) {
                io.to(`group:${groupId}`).emit('expense:deleted', id);
            }
        } catch (socketError) {
            logger.warn('Socket broadcast skipped.');
        }

        return res.status(StatusCodes.OK).json({
            status: 'Success',
            message: 'Expense item deleted and group balances recalculated.'
        });

    } catch (error) {
        logger.error('[deleteExpense Error]:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        });
    }
};

/**
 * Fetch expense splitting graph data for a group
 */
export const getExpenseGraph = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const authUserId = (req as any).user?._id;

        // Verify membership
        const group = await Group.findById(groupId).populate('members', 'username fullname profilepicture');
        if (!group) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'Failed',
                message: 'Group not found'
            });
        }

        const isMember = group.members.some((m: any) => m._id.toString() === authUserId.toString());
        if (!isMember) {
            return res.status(StatusCodes.FORBIDDEN).json({
                status: 'Failed',
                message: 'Access denied. You are not a member of this travel group.'
            });
        }

        // Recalculate balances to ensure freshness
        const balances = await recalculateGroupBalances(groupId);
        const settlements = await calculateSettlements(groupId);

        // Map nodes
        const nodesMap = new Map<string, any>();
        
        // Initialize nodes for all group members
        group.members.forEach((member: any) => {
            nodesMap.set(member._id.toString(), {
                id: member._id.toString(),
                name: member.fullname || member.username,
                username: member.username,
                profilepicture: member.profilepicture || 'https://via.placeholder.com/150',
                balance: 0
            });
        });

        // Update balances for members present in UserBalances
        balances.forEach((b: any) => {
            const userIdStr = b.userId?._id?.toString() || b.userId?.toString();
            if (nodesMap.has(userIdStr)) {
                const node = nodesMap.get(userIdStr);
                node.balance = b.netBalance;
            }
        });

        const nodes = Array.from(nodesMap.values());

        // Map edges
        const edges = settlements.map(s => ({
            from: s.from._id,
            to: s.to._id,
            amount: s.amount
        }));

        return res.status(StatusCodes.OK).json({
            status: 'Success',
            data: {
                nodes,
                edges
            }
        });

    } catch (error) {
        logger.error('[getExpenseGraph Error]:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        });
    }
};
