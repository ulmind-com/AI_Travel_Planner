import { Request, Response } from 'express';
import Plan from '../../../shared/database/models/planModel';
import User from '../../../shared/database/models/userModel';
import { getIO } from '../../../shared/socket/socket';
import logger from '../../../shared/utils/logger';

/**
 * Controller to match other travelers for a specific travel plan
 */
export const matchTravelers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { planId } = req.params;
        const currentUserId = (req as any).user._id;

        // Fetch the reference plan
        const plan = await Plan.findById(planId);
        if (!plan) {
            res.status(404).json({ success: false, message: 'Plan not found' });
            return;
        }

        // Fetch other user plans
        const otherPlans = await Plan.find({
            _id: { $ne: plan._id },
            userId: { $ne: currentUserId },
            status: { $ne: 'inactive' }
        }).populate('userId', 'username fullname profilepicture firebaseUid');

        const matches = otherPlans.map(otherPlan => {
            let score = 0;

            // 1. Location match (+40)
            const loc1 = (plan.location || plan.to || '').toLowerCase().trim();
            const loc2 = (otherPlan.location || otherPlan.to || '').toLowerCase().trim();
            if (loc1 && loc2 && (loc1 === loc2 || loc1.includes(loc2) || loc2.includes(loc1))) {
                score += 40;
            }

            // 2. Date overlap (+30)
            const start1 = plan.startDate ? new Date(plan.startDate) : new Date(plan.date);
            const end1 = plan.endDate ? new Date(plan.endDate) : new Date(plan.date);
            const start2 = otherPlan.startDate ? new Date(otherPlan.startDate) : new Date(otherPlan.date);
            const end2 = otherPlan.endDate ? new Date(otherPlan.endDate) : new Date(otherPlan.date);

            const hasOverlap = Math.max(start1.getTime(), start2.getTime()) <= Math.min(end1.getTime(), end2.getTime());
            
            if (hasOverlap) {
                score += 30;
            } else {
                // Fallback: check closeness in days
                const diffTime = Math.abs(start1.getTime() - start2.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) {
                    score += 20; // partially close
                }
            }

            // 3. Budget similarity (+20)
            const br1 = (plan.budget_range || '').toLowerCase();
            const br2 = (otherPlan.budget_range || '').toLowerCase();
            if (br1 && br2 && br1 === br2) {
                score += 20;
            } else {
                const b1 = parseFloat(plan.budget) || plan.cost || 0;
                const b2 = parseFloat(otherPlan.budget) || otherPlan.cost || 0;
                if (b1 > 0 && b2 > 0) {
                    const pctDiff = Math.abs(b1 - b2) / Math.max(b1, b2);
                    if (pctDiff <= 0.3) {
                        score += 20;
                    }
                }
            }

            // 4. Travel style similarity (+10)
            const style1 = (plan.travel_style || '').toLowerCase();
            const style2 = (otherPlan.travel_style || '').toLowerCase();
            if (style1 && style2 && style1 === style2) {
                score += 10;
            } else {
                // Check activities overlap
                const act1 = plan.activities || [];
                const act2 = otherPlan.activities || [];
                const overlap = act1.filter(a => act2.includes(a));
                if (overlap.length > 0) {
                    score += 10;
                }
            }

            return {
                plan: otherPlan,
                score,
                user: otherPlan.userId
            };
        })
        .filter(m => m.score >= 30) // Only return matches with some base level of overlap
        .sort((a, b) => b.score - a.score);

        // Notify matched users if they are online via socket
        try {
            const io = getIO();
            if (io && matches.length > 0) {
                matches.forEach(match => {
                    const matchUser = match.user as any;
                    if (matchUser && matchUser.firebaseUid) {
                        io.emit('match:found', {
                            planId: plan._id,
                            matchPlanId: match.plan._id,
                            matchedUserId: matchUser._id,
                            matchedFirebaseUid: matchUser.firebaseUid,
                            score: match.score,
                            destination: plan.to
                        });
                    }
                });
            }
        } catch (socketErr) {
            // socket.io might not be initialized or active
            logger.warn('Socket emit match:found warning: ' + socketErr);
        }

        res.status(200).json({
            success: true,
            matches
        });
    } catch (error) {
        console.error('Error matching travelers:', error);
        res.status(500).json({ success: false, message: 'Server error matching travelers' });
    }
};
