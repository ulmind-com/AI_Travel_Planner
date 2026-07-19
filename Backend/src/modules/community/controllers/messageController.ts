import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Message from '../../../shared/database/models/messageModel';
import logger from '../../../shared/utils/logger';

/**
 * Controller to fetch message history with a specific user.
 */
export const getMessageHistory = async (req: Request, res: Response) => {
    try {
        const { otherFirebaseUid } = req.params;
        const currentFirebaseUid = (req as any).user?.firebaseUid;

        const messages = await Message.find({
            $or: [
                { senderFirebaseUid: currentFirebaseUid, recipientFirebaseUid: otherFirebaseUid },
                { senderFirebaseUid: otherFirebaseUid, recipientFirebaseUid: currentFirebaseUid }
            ]
        }).sort({ createdAt: 1 });

        return res.status(StatusCodes.OK).json({
            success: true,
            data: messages
        });
    } catch (error: any) {
        logger.error(`Error fetching message history: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
};

/**
 * Controller to save a direct message (fallback for non-real-time or initial send).
 */
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { recipientFirebaseUid, content } = req.body;
        const senderFirebaseUid = (req as any).user?.firebaseUid;

        if (!recipientFirebaseUid || !content) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Recipient and content are required'
            });
        }

        const newMessage = await Message.create({
            senderFirebaseUid,
            recipientFirebaseUid,
            content
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            data: newMessage
        });
    } catch (error: any) {
        logger.error(`Error sending message: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};
