import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { processUserMessage, getHistoryMessages, clearChatHistory } from './chatService';
import Plan from '../../shared/database/models/planModel';
import User from '../../shared/database/models/userModel';
import Hotel from '../../shared/database/models/hotelModel';
import logger from '../../shared/utils/logger';

/**
 * Send message to AI travel assistant.
 */
export const sendChatMessage = async (req: any, res: Response, next: NextFunction) => {
    try {
        const firebaseUid = req.user?.firebaseUid;
        const { message } = req.body;

        if (!firebaseUid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized: User is not authenticated.'
            });
        }

        if (!message || message.trim() === '') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Bad Request: Message cannot be empty.'
            });
        }

        const data = await processUserMessage(firebaseUid, message);
        return res.status(StatusCodes.OK).json(data);
    } catch (error) {
        next(error);
    }
};

/**
 * Fetch chat history for the user.
 */
export const getChatHistory = async (req: any, res: Response, next: NextFunction) => {
    try {
        const firebaseUid = req.user?.firebaseUid;
        if (!firebaseUid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized: User is not authenticated.'
            });
        }

        const messages = await getHistoryMessages(firebaseUid);
        return res.status(StatusCodes.OK).json({
            success: true,
            data: messages
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Clear chat history.
 */
export const clearUserChatHistory = async (req: any, res: Response, next: NextFunction) => {
    try {
        const firebaseUid = req.user?.firebaseUid;
        if (!firebaseUid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized: User is not authenticated.'
            });
        }

        const result = await clearChatHistory(firebaseUid);
        return res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Convert chat response itinerary into a saved Plan document.
 */
export const convertChatToPlan = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const firebaseUid = req.user?.firebaseUid;

        if (!userId || !firebaseUid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized: User is not authenticated.'
            });
        }

        const {
            to,
            budget,
            days,
            itinerary,
            hotels
        } = req.body;

        if (!to) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Bad Request: Destination (to) is required.'
            });
        }

        // Format Itinerary to match suggested_itinerary schema in Plan model
        const formattedItinerary = (itinerary || []).map((item: any, idx: number) => ({
            day: item.day || idx + 1,
            title: item.title || `Day ${item.day || idx + 1}`,
            description: item.description || '',
            morning: item.activities?.[0] || 'Explore the city',
            afternoon: item.activities?.[1] || 'Local lunch & sightseeing',
            evening: item.activities?.[2] || 'Relaxing evening walk',
            activities: (item.activities || []).map((act: string) => ({
                name: act,
                cost: 'Included',
                time: 'Flexible',
                description: act
            }))
        }));

        // Robust parsing of hotels data from AI chat response
        let hotelList: any[] = [];
        if (hotels) {
            if (typeof hotels === 'string') {
                try {
                    const formattedString = hotels.trim();
                    try {
                        hotelList = JSON.parse(formattedString);
                    } catch (e) {
                        hotelList = new Function(`return ${formattedString}`)();
                    }
                } catch (err) {
                    logger.error(`[AIChat] Failed to parse hotels string:`, err);
                }
            } else if (Array.isArray(hotels)) {
                if (hotels.length === 1 && typeof hotels[0] === 'string' && (hotels[0].trim().startsWith('[') || hotels[0].trim().startsWith('{'))) {
                    try {
                        const formattedString = hotels[0].trim();
                        try {
                            hotelList = JSON.parse(formattedString);
                        } catch (e) {
                            hotelList = new Function(`return ${formattedString}`)();
                        }
                    } catch (err) {
                        logger.error(`[AIChat] Failed to parse single string element inside hotels array:`, err);
                        hotelList = hotels;
                    }
                } else {
                    hotelList = hotels;
                }
            }
        }

        if (hotelList && !Array.isArray(hotelList) && typeof hotelList === 'object') {
            hotelList = [hotelList];
        }

        // Lookup existing hotels or create new ones, then save their ObjectIds
        const hotelIds: any[] = [];
        if (Array.isArray(hotelList)) {
            for (let item of hotelList) {
                if (!item) continue;
                if (typeof item === 'string') {
                    try {
                        item = JSON.parse(item);
                    } catch (e) {
                        try {
                            item = new Function(`return ${item}`)();
                        } catch (err) {
                            item = { name: item };
                        }
                    }
                }
                if (typeof item === 'object') {
                    const hotelName = item.name || item.hotel_name || 'Recommended Hotel';
                    const description = item.description || `Recommended hotel: ${hotelName}`;
                    const cost = item.cost || 'Contact for pricing';
                    const category = item.category || 'AI Recommendation';

                    let existingHotel = await Hotel.findOne({ hotel_name: hotelName });
                    if (!existingHotel) {
                        existingHotel = await Hotel.create({
                            hotel_name: hotelName,
                            description: description,
                            category: category,
                            starRating: 4,
                            amenities: [cost],
                            images: []
                        });
                    }
                    hotelIds.push(existingHotel._id);
                }
            }
        }

        // Construct Plan
        const newPlan = new Plan({
            userId,
            firebaseUid,
            to,
            from: 'Your Location',
            date: new Date(),
            budget: budget || 50000,
            travelers: 1,
            name: `AI Chat Trip to ${to}`,
            days: days || formattedItinerary.length || 3,
            suggested_itinerary: formattedItinerary,
            budget_breakdown: {
                flights: Math.round((budget || 50000) * 0.4),
                accommodation: Math.round((budget || 50000) * 0.3),
                activities: Math.round((budget || 50000) * 0.15),
                food: Math.round((budget || 50000) * 0.15),
                total: budget || 50000
            },
            destination_overview: `AI generated plan matching your profile preferences for ${to}.`,
            travel_style: 'AI Custom',
            budget_range: 'Medium',
            hotels: hotelIds
        });

        await newPlan.save();

        // Link plan to User
        await User.findByIdAndUpdate(userId, {
            $push: { plans: newPlan._id }
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Trip plan created successfully from AI Chat!',
            data: newPlan
        });

    } catch (error) {
        logger.error(`[AIChat] Convert Chat to Plan failed:`, error);
        next(error);
    }
};
