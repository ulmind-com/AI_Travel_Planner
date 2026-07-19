import axios from 'axios';
import { estimateCrowdDensity } from './crowdEstimator';
import { analyzeTravelRisk } from './riskAnalyzer';
import { calculateBestTimeToVisit } from './bestTimeEngine';
import { groqGeneratedData } from '../../shared/services/groq.service';
import { cacheService } from '../../shared/utils/cacheService';
import logger from '../../shared/utils/logger';

// Preserved high-fidelity coordinates mapping for popular destinations
const PRESET_COORDINATES: Record<string, { lat: number; lon: number }> = {
    manali: { lat: 32.2396, lon: 77.1887 },
    shimla: { lat: 31.1048, lon: 77.1734 },
    delhi: { lat: 28.7041, lon: 77.1025 },
    mumbai: { lat: 19.0760, lon: 72.8777 },
    goa: { lat: 15.2993, lon: 74.1240 },
    leh: { lat: 34.1526, lon: 77.5771 },
    paris: { lat: 48.8566, lon: 2.3522 },
    tokyo: { lat: 35.6762, lon: 139.6503 },
    london: { lat: 51.5074, lon: -0.1278 },
    sydney: { lat: -33.8688, lon: 151.2093 },
    newyork: { lat: 40.7128, lon: -74.0060 }
};

export interface ITravelIntelResponse {
    location: string;
    coordinates: { lat: number; lon: number };
    weather: {
        temp: number;
        rain: number;
        wind: number;
        uv: number;
        humidity: number;
        description: string;
    };
    crowd: {
        searches: number;
        bookings: number;
        posts: number;
        score: number;
        level: 'low' | 'medium' | 'high';
    };
    bestTime: {
        timeWindow: string;
        explanation: string;
    };
    risk: {
        level: 'safe' | 'caution' | 'danger';
        reasons: string[];
        alerts: any[];
    };
    recommendations: string[];
    cached?: boolean;
    delayed?: boolean;
}

/**
 * Resolve location name into coordinates.
 */
const resolveCoordinates = async (location: string): Promise<{ lat: number; lon: number }> => {
    const cleanLoc = location.trim().toLowerCase().replace(/\s+/g, '');
    if (PRESET_COORDINATES[cleanLoc]) {
        return PRESET_COORDINATES[cleanLoc];
    }

    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': 'AdventureNexus/1.0.0 (contact: admin@samiransamanta.in)'
                },
                timeout: 3000
            }
        );

        if (response.data && response.data.length > 0) {
            return {
                lat: parseFloat(response.data[0].lat),
                lon: parseFloat(response.data[0].lon)
            };
        }
    } catch (e) {
        logger.warn(`[TravelIntel] Geocoding API failed for: ${location}. Falling back to hash estimation.`);
    }

    // Hash-based deterministic coordinates fallback
    let hash = 0;
    for (let i = 0; i < location.length; i++) {
        hash = location.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = 20 + Math.abs((hash % 30));
    const lon = 70 + Math.abs(((hash >> 3) % 20));
    return { lat, lon };
};

/**
 * Fetch weather from Open-Meteo API.
 */
const fetchWeather = async (lat: number, lon: number) => {
    try {
        const res = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,rain,wind_speed_10m,relative_humidity_2m&daily=uv_index_max&timezone=auto&forecast_days=1`,
            { timeout: 4000 }
        );

        const current = res.data?.current;
        const daily = res.data?.daily;

        const rain = current?.rain || 0;
        const wind = current?.wind_speed_10m || 0;
        let description = 'Clear Skies';
        if (rain > 10) description = 'Heavy Storms';
        else if (rain > 2) description = 'Rainy Conditions';
        else if (wind > 30) description = 'High Winds';
        else if (current?.temperature_2m > 30) description = 'Warm & Sunny';
        else if (current?.temperature_2m < 12) description = 'Cool Breeze';

        return {
            temp: Math.round(current?.temperature_2m ?? 22),
            rain: parseFloat((rain).toFixed(1)),
            wind: Math.round(wind),
            uv: Math.round(daily?.uv_index_max?.[0] ?? 4),
            humidity: Math.round(current?.relative_humidity_2m ?? 60),
            description
        };
    } catch (err) {
        logger.error('[TravelIntel] Weather API call failed. Returning mock parameters.', err);
        throw err;
    }
};

/**
 * Compile travel intelligence data for a location.
 */
export const getTravelIntelligence = async (location: string): Promise<ITravelIntelResponse> => {
    const cleanLocation = location.trim();
    const cacheKey = cleanLocation.toLowerCase().replace(/\s+/g, '_');

    // 1. Try Cache Get
    const cachedData = await cacheService.get<ITravelIntelResponse>('travelintel', cacheKey);
    if (cachedData) {
        return {
            ...cachedData,
            cached: true
        };
    }

    try {
        // 2. Geocode Location
        const coordinates = await resolveCoordinates(cleanLocation);

        // 3. Fetch Weather
        let weather;
        let delayed = false;
        try {
            weather = await fetchWeather(coordinates.lat, coordinates.lon);
        } catch (e) {
            // Weather API failed - generate static mock weather based on location hash
            delayed = true;
            let hash = 0;
            for (let i = 0; i < cleanLocation.length; i++) {
                hash = cleanLocation.charCodeAt(i) + ((hash << 5) - hash);
            }
            weather = {
                temp: 15 + Math.abs((hash % 18)),
                rain: Math.abs((hash >> 2) % 3) > 1.5 ? Math.abs((hash % 5)) : 0,
                wind: Math.abs((hash % 20)) + 5,
                uv: Math.abs((hash % 7)) + 1,
                humidity: 50 + Math.abs((hash % 30)),
                description: 'Partly Cloudy'
            };
        }

        // 4. Estimate Crowd Density
        const crowd = await estimateCrowdDensity(cleanLocation);

        // 5. Calculate Best Time
        const bestTime = calculateBestTimeToVisit(weather, crowd.level);

        // 6. Analyze Risks
        const risk = await analyzeTravelRisk(cleanLocation, weather, crowd.level);

        // 7. Request Smart Suggestions from GROQ
        let recommendations: string[] = [];
        try {
            const prompt = `Location: ${cleanLocation}
Weather: Temp ${weather.temp}°C, Rain ${weather.rain}mm, Wind ${weather.wind}km/h, UV Index ${weather.uv}
Crowd Level: ${crowd.level}
Risk Level: ${risk.level} (reasons: ${risk.reasons.join(', ')})

Based on these parameters, generate exactly 3 highly actionable, short, bulleted tips for a traveler visiting today. Keep them brief and travel-expert style.
Respond ONLY with a valid JSON array of strings, e.g. ["Tip 1", "Tip 2", "Tip 3"].`;

            const rawAiResponse = await groqGeneratedData(prompt);
            recommendations = JSON.parse(rawAiResponse);
        } catch (e) {
            // Fallback suggestions
            recommendations = [
                `Dress comfortably for ${weather.temp}°C temperatures.`,
                crowd.level === 'high' ? 'Visit early to bypass crowd peaks.' : 'Enjoy the relaxed visiting pace today.',
                risk.level === 'safe' ? 'Overall conditions are highly favorable for outdoor tourism.' : 'Stay alert; review weather precautions.'
            ];
        }

        const responseData: ITravelIntelResponse = {
            location: cleanLocation,
            coordinates,
            weather,
            crowd,
            bestTime,
            risk,
            recommendations,
            delayed
        };

        // Cache result for 10 minutes (600 seconds)
        await cacheService.set('travelintel', cacheKey, responseData, 600);

        return responseData;

    } catch (error) {
        logger.error(`[TravelIntel] Failed compiling travel intelligence for ${location}:`, error);
        throw error;
    }
};
