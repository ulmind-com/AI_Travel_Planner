import { NextFunction, Request, Response } from 'express';
import Plan from '../../../shared/database/models/planModel';
import createError from 'http-errors';
import logger from '../../../shared/utils/logger';

/**
 * Controller to get a specific Plan by ID.
 * Caching is handled at the route level via cacheMiddleware.
 */
export const getPlanById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const plan = await Plan.findById(id)
            .populate({
                path: 'hotels',
                populate: { path: 'rooms' }
            })
            .populate('flights');

        if (!plan) {
            return next(createError(404, 'Plan Not Found or The ID is Invalid.'));
        }

        return res.status(200).json({
            status: 'Success',
            data: plan,
        });

    } catch (err: any) {
        logger.error(`Error in getPlanByIdController: ${err.message || err}`);
        return next(createError(500, 'Internal Server Error!'));
    }
};
