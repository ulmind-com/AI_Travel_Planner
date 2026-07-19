import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getTwinSuggestions, getUserProfile } from '../../../shared/services/digitalTwinEngine';

/**
 * Fetch travel twin suggestions.
 */
export const getSuggestions = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.firebaseUid;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized: Missing user authentication token.'
            });
        }

        const data = await getTwinSuggestions(userId);
        res.status(StatusCodes.OK).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Fetch the user's computed AI twin profile preferences.
 */
export const getTwinProfile = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.firebaseUid;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized: Missing user authentication token.'
            });
        }

        const profile = await getUserProfile(userId);
        res.status(StatusCodes.OK).json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
};
