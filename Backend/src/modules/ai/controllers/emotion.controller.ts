import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { detectEmotion } from '../../../shared/services/ai/emotionEngine';
import { optimizeItinerary } from '../../../shared/services/ai/itineraryOptimizer';
import logger from '../../../shared/utils/logger';

/**
 * @desc Detect user emotion from text/chat
 * @route POST /api/v1/ai/emotion-detect
 */
export const detectUserEmotionController = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Text field is required for emotion detection.'
            });
        }

        const analysis = await detectEmotion(text);
        
        return res.status(StatusCodes.OK).json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('[Emotion Controller] Error detecting emotion:', error);
        next(error);
    }
};

/**
 * @desc Optimize itinerary dynamically based on destination, days, budget, emotion, and adjustments
 * @route POST /api/v1/ai/optimize-itinerary
 */
export const optimizeItineraryController = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { destination, days, budget, emotion, adjustments } = req.body;

        if (!destination || !days || !budget) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Destination, days, and budget are required fields.'
            });
        }

        const numericDays = parseInt(days, 10);
        const numericBudget = parseFloat(budget);

        if (isNaN(numericDays) || numericDays <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Days must be a valid positive integer.'
            });
        }

        if (isNaN(numericBudget) || numericBudget <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Budget must be a valid positive number.'
            });
        }

        const optimizedPlan = await optimizeItinerary(
            destination,
            numericDays,
            numericBudget,
            emotion || 'neutral',
            adjustments || []
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            data: optimizedPlan
        });
    } catch (error) {
        logger.error('[Itinerary Optimizer Controller] Error optimizing itinerary:', error);
        next(error);
    }
};
