import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getTravelIntelligence } from './travelIntelService';
import logger from '../../shared/utils/logger';

/**
 * GET /api/v1/travel/intel
 * Query parameters: ?location=Manali
 */
export const getTravelIntel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { location } = req.query;

        if (!location || typeof location !== 'string' || location.trim() === '') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'Failed',
                message: 'Bad Request: A valid location query parameter is required.'
            });
        }

        const data = await getTravelIntelligence(location);

        return res.status(StatusCodes.OK).json({
            weather: {
                temp: data.weather.temp,
                rain: data.weather.rain,
                wind: data.weather.wind,
                uv: data.weather.uv,
                humidity: data.weather.humidity,
                description: data.weather.description
            },
            crowdLevel: data.crowd.level,
            bestTimeToday: data.bestTime.timeWindow,
            riskLevel: data.risk.level,
            recommendations: data.recommendations,
            // Rich metadata extension for high-fidelity widgets and Map overlays
            coordinates: data.coordinates,
            crowdDetails: data.crowd,
            riskDetails: {
                level: data.risk.level,
                reasons: data.risk.reasons,
                alerts: data.risk.alerts
            },
            bestTimeDetails: data.bestTime,
            delayed: data.delayed,
            cached: data.cached
        });
        
    } catch (error: any) {
        logger.error(`[TravelIntelController] Error:`, error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: error.message || 'An internal error occurred while fetching travel intelligence.'
        });
    }
};
