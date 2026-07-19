import { NextFunction, Response } from 'express';
import Plan from '../../../shared/database/models/planModel';
import User from '../../../shared/database/models/userModel';
import createError from 'http-errors';
import logger from '../../../shared/utils/logger';

/**
 * Controller to add a new activity (itinerary item) to a travel plan.
 */
export const addActivity = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { day, time, type, title, description, location, duration, cost, status } = req.body;

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
            logger.info(`Plan ${id} cloned to new plan ${targetPlan._id} for user ${req.user._id}`);
        }

        const newActivity = {
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            day: Number(day) || 1,
            time: time || '00:00',
            type: type || 'activity',
            title: title || 'New Activity',
            description: description || '',
            location: location || '',
            duration: duration || '',
            cost: Number(cost) || 0,
            status: status || 'confirmed'
        };

        if (!targetPlan.itineraryItems) {
            targetPlan.itineraryItems = [];
        }

        targetPlan.itineraryItems.push(newActivity);
        await targetPlan.save();

        return res.status(200).json({
            status: 'Success',
            message: 'Activity added successfully.',
            data: targetPlan.itineraryItems,
            clonedPlanId: isCloned ? targetPlan._id.toString() : undefined,
            plan: isCloned ? targetPlan : undefined
        });
    } catch (error) {
        logger.error('Error in addActivityController:', error);
        return next(createError(500, 'Internal Server Error'));
    }
};
