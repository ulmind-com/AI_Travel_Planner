import { NextFunction, Response } from 'express';
import Plan from '../../../shared/database/models/planModel';
import User from '../../../shared/database/models/userModel';
import createError from 'http-errors';
import logger from '../../../shared/utils/logger';

/**
 * Controller to delete an activity (itinerary item) from a travel plan.
 */
export const deleteActivity = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { id, activityId } = req.params;

        const plan = await Plan.findById(id);
        if (!plan) {
            return next(createError(404, 'Plan not found'));
        }

        let targetPlan = plan;
        let isCloned = false;

        // Authorization check: only the owner can modify this plan
        if (plan.userId.toString() !== req.user._id.toString()) {
            // Clone the plan for the current user
            const clonedData = plan.toObject();
            delete clonedData._id;
            clonedData.userId = req.user._id;
            clonedData.firebaseUid = req.user.firebaseUid;
            clonedData.name = clonedData.name ? `${clonedData.name} (Copy)` : `Trip to ${clonedData.to}`;
            
            targetPlan = new Plan(clonedData);
            await targetPlan.save();

            // Add the cloned plan to the user's plans list
            await User.findByIdAndUpdate(req.user._id, {
                $push: { plans: targetPlan._id }
            });
            isCloned = true;
            logger.info(`Plan ${id} cloned to new plan ${targetPlan._id} for user ${req.user._id} during activity deletion`);
        }

        if (!targetPlan.itineraryItems) {
            return next(createError(404, 'No itinerary items found for this plan'));
        }

        const initialLength = targetPlan.itineraryItems.length;
        targetPlan.itineraryItems = targetPlan.itineraryItems.filter((item: any) => item.id !== activityId);

        if (targetPlan.itineraryItems.length === initialLength) {
            return next(createError(404, 'Activity not found'));
        }

        await targetPlan.save();

        return res.status(200).json({
            status: 'Success',
            message: 'Activity deleted successfully.',
            data: targetPlan.itineraryItems,
            clonedPlanId: isCloned ? targetPlan._id.toString() : undefined,
            plan: isCloned ? targetPlan : undefined
        });
    } catch (error) {
        logger.error('Error in deleteActivityController:', error);
        return next(createError(500, 'Internal Server Error'));
    }
};
