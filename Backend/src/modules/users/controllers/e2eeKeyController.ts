import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../../../shared/database/models/userModel';
import logger from '../../../shared/utils/logger';

/**
 * Upload E2EE public key for the current user.
 * POST /api/v1/users/e2ee/public-key
 * 
 * The client generates an X25519 key pair locally:
 *   - secretKey → stored in IndexedDB (never sent to server)
 *   - publicKey → uploaded here → stored in User document
 * 
 * Other users fetch this public key to encrypt messages TO this user.
 */
export const uploadPublicKey = async (req: Request, res: Response) => {
    try {
        const firebaseUid = (req as any).user?.firebaseUid;
        const { publicKey } = req.body;

        if (!publicKey || typeof publicKey !== 'string') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Public key (base64 string) is required'
            });
        }

        // Validate base64 format and approximate key length (X25519 = 32 bytes = 44 base64 chars)
        if (publicKey.length < 40 || publicKey.length > 50) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid public key format'
            });
        }

        await User.findOneAndUpdate(
            { firebaseUid },
            { e2eePublicKey: publicKey },
            { new: true }
        );

        logger.info(`[E2EE] Public key uploaded for user ${firebaseUid}`);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'E2EE public key stored successfully'
        });
    } catch (error: any) {
        logger.error(`[E2EE] Error uploading public key: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to store public key'
        });
    }
};

/**
 * Fetch a user's E2EE public key.
 * GET /api/v1/users/e2ee/public-key/:firebaseUid
 * 
 * Used by senders to encrypt messages for this recipient.
 */
export const getPublicKey = async (req: Request, res: Response) => {
    try {
        const { firebaseUid } = req.params;

        const user = await User.findOne({ firebaseUid }).select('e2eePublicKey firebaseUid username');

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                firebaseUid: user.firebaseUid,
                username: user.username,
                e2eePublicKey: user.e2eePublicKey || null
            }
        });
    } catch (error: any) {
        logger.error(`[E2EE] Error fetching public key: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch public key'
        });
    }
};
