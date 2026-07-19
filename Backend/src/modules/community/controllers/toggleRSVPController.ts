import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import CommunityEvent from '../../../shared/database/models/communityEventModel';
import logger from '../../../shared/utils/logger';

/**
 * Controller to toggle RSVP for an event.
 */
export const toggleRSVP = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.body;
        const firebaseUid = (req as any).user?.firebaseUid;

        if (!firebaseUid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const event = await CommunityEvent.findById(eventId);
        if (!event) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Event not found'
            });
        }

        const rsvpIndex = event.attendees.indexOf(firebaseUid);
        if (rsvpIndex > -1) {
            // Cancel RSVP
            event.attendees.splice(rsvpIndex, 1);
        } else {
            // RSVP
            event.attendees.push(firebaseUid);
        }

        await event.save();

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                attendees: event.attendees,
                isAttending: rsvpIndex === -1
            }
        });
    } catch (error: any) {
        logger.error(`Error toggling RSVP: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to process RSVP'
        });
    }
};
