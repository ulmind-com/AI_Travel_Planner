import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware to restrict banned users from creating content (posts, comments, reviews, plans, stories).
 * Allows banned users to log in and read public data or notifications but restricts all mutations.
 */
export const checkBanned = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && (req as any).user.isBanned) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: `Your account has been restricted/banned. Reason: ${(req as any).user.banReason || 'Violation of community guidelines'}. You are restricted from posting, commenting, or writing content.`
        });
    }
    next();
};

export default checkBanned;
