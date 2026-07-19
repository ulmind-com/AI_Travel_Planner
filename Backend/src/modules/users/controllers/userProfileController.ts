import { NextFunction, Request, Response } from 'express';
import User, { IUser } from '../../../shared/database/models/userModel';
import createError from 'http-errors';
import logger from '../../../shared/utils/logger';

// Interface extending Express Request to include user ID from auth middleware
export interface CustomRequestUserProfileController<
    TParams = object,
    TQuery = object,
    TBody = object,
> extends Request<TParams, unknown, TBody, TQuery> {
    user: {
        _id: string;
        firebaseUid: string;
    };
}

/**
 * Controller to fetch User Profile.
 * Retrieves user data from MongoDB based on Firebase User ID.
 *
 * @param req - Custom Request object containing authenticated user info
 * @param res - Express Response object
 * @param next - Express Next function for error handling
 */
async function userProfile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> {
    try {
        // 1. Find user by Firebase UID (attached by protect middleware)
        let userData: IUser | null = await User.findOne({ firebaseUid: (req as any).user.firebaseUid });

        // 2. Handle User Not Found
        if (!userData) {
            return next(createError(404, 'User not found!'));
        } else {
            // 3. Send Success Response with filtered user data
            return res.status(200).send({
                status: 'Success',
                userData: {
                    _id: userData._id,
                    firebaseUid: userData.firebaseUid,
                    fullname: userData.fullname,
                    firstname: userData.firstName,
                    lastname: userData.lastName,
                    email: userData.email,
                    phonenumber: userData.phonenumber,
                    username: userData.username,
                    gender: userData.gender,
                    profilepicture: userData.profilepicture,
                    preference: userData.preferences,
                    country: userData.country,
                },
            });
        }
    } catch (error: unknown) {
        logger.error("Error fetching user profile:", error); // Log error for debugging
        return next(createError(500, 'Internal Server Error!'));
    }
}

export default userProfile;
