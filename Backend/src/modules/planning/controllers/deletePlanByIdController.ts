import { NextFunction, Request, Response } from 'express';
import User from '../../../shared/database/models/userModel';
import Plan from '../../../shared/database/models/planModel';
import createError from 'http-errors';
import logger from '../../../shared/utils/logger';

export interface CustomRequestDeletePlan extends Request {
    user: {
        _id: string;
    };
}

/**
 * Controller to delete a Travel Plan by ID.
 * Ensures that plans can only be deleted by the user who owns them.
 *
 * @param req - Custom Request includes authenticated user ID and Plan ID params
 * @param res - Express Response object
 * @param next - Express Next function
 */
export const deletePlanById = async (
    req: CustomRequestDeletePlan,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const id: string = req.params.id; // Plan ID to be deleted
        const userId = (req as any).user._id; // Logged-in user's ID

        // 1. Check if the plan exists
        const plan = await Plan.findById(id);
        if (!plan) {
            return next(createError(404, 'Plan Not Found!'));
        }

        // 2. Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return next(createError(404, 'User not found!'));
        }

        // 3. Verify Ownership: Check if the plan belongs to the user
        // Check via: user.plans array, plan.userId, or plan.firebaseUid
        const isInUserPlans = user.plans.some(planId => planId.toString() == id);
        const isPlanOwnerById = plan.userId && plan.userId.toString() === userId.toString();
        const isPlanOwnerByFirebase = user.firebaseUid && plan.firebaseUid && plan.firebaseUid === user.firebaseUid;

        if (!isInUserPlans && !isPlanOwnerById && !isPlanOwnerByFirebase) {
            return next(
                createError(403, 'This plan does not belong to the user!')
            );
        }

        // 4. Update User's Plan List (Remove reference if it was there)
        if (isInUserPlans) {
            user.plans = user.plans.filter(planId => planId.toString() !== id);
            await user.save();
        }

        // 6. Delete the plan from the Plan collection
        await Plan.findByIdAndDelete(id);

        return res.status(200).json({
            status: 'Success',
            message: 'Plan deleted successfully.',
        });
    } catch (error) {
        logger.error(`Error in deletePlanByIdController: ${error}`);

        return next(createError(500, 'Internal Server Error!'));
    }
};
