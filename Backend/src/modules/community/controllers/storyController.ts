import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import TravelStory from '../../../shared/database/models/travelStoryModel';
import logger from '../../../shared/utils/logger';

/**
 * Controller to create a new travel story.
 */
export const createStory = async (req: Request, res: Response) => {
    try {
        const { title, content, location, images, durationInMinutes } = req.body;
        const userId = req.user?._id;
        const firebaseUid = (req as any).user?.firebaseUid;

        if (!title || !content || !location) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Title, content, and location are required'
            });
        }

        const newStory = await TravelStory.create({
            userId,
            firebaseUid,
            title,
            content,
            location,
            images: images || [],
            expiresAt: new Date(Date.now() + (durationInMinutes || 1440) * 60 * 1000) // Default to 24 hours (1440 mins) if not provided
        });

        logger.info(`New travel story created: ${newStory._id} by ${firebaseUid}`);

        // Real-time broadcast
        import('../../../shared/socket/socket').then(({ broadcastRealtimeEvent }) => {
            broadcastRealtimeEvent('community:story', {
                story: newStory,
                firebaseUid
            });
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            data: newStory
        });
    } catch (error: any) {
        logger.error(`Error creating travel story: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create travel story'
        });
    }
};

/**
 * Controller to fetch all travel stories.
 */
export const getAllStories = async (req: Request, res: Response) => {
    try {
        const { search, location } = req.query;
        let query: any = {};

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const stories = await TravelStory.find(query)
            .sort({ createdAt: -1 })
            .populate('userId', 'username profilepicture fullname firebaseUid');

        return res.status(StatusCodes.OK).json({
            success: true,
            data: stories
        });
    } catch (error: any) {
        logger.error(`Error fetching travel stories: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch travel stories'
        });
    }
};

/**
 * Controller to toggle like on a travel story.
 */
export const toggleLikeStory = async (req: Request, res: Response) => {
    try {
        const { storyId } = req.params;
        const firebaseUid = (req as any).user?.firebaseUid;

        const story = await TravelStory.findById(storyId);

        if (!story) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Story not found'
            });
        }

        const isLiked = story.likes.includes(firebaseUid as string);

        if (isLiked) {
            story.likes = story.likes.filter(id => id !== firebaseUid);
        } else {
            story.likes.push(firebaseUid as string);
        }

        await story.save();

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                likesCount: story.likes.length,
                isLiked: !isLiked
            }
        });
    } catch (error: any) {
        logger.error(`Error toggling story like: ${error.message}`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to toggle like'
        });
    }
};
