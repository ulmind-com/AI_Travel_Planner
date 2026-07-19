export interface IBestTimeRecommendation {
    timeWindow: string;
    explanation: string;
}

/**
 * Recommends the best time to visit today based on weather, temperature, and crowd level.
 */
export const calculateBestTimeToVisit = (
    weather: { temp: number; rain: number; wind: number; uv: number },
    crowdLevel: 'low' | 'medium' | 'high'
): IBestTimeRecommendation => {
    // 1. Extreme weather override
    if (weather.rain > 5) {
        return {
            timeWindow: '2:00 PM - 4:00 PM',
            explanation: 'Indoor visiting recommended today due to active rainfall.'
        };
    }

    // 2. High temperatures
    if (weather.temp > 32) {
        return {
            timeWindow: '6:00 PM - 8:00 PM',
            explanation: 'Late evening recommended to avoid peak heat index.'
        };
    }

    // 3. Cold temperatures
    if (weather.temp < 10) {
        return {
            timeWindow: '12:00 PM - 2:30 PM',
            explanation: 'Mid-day recommended to make use of peak afternoon warmth.'
        };
    }

    // 4. Heavy crowds but good weather
    if (crowdLevel === 'high') {
        return {
            timeWindow: '7:00 AM - 9:00 AM',
            explanation: 'Early morning sunrise hour recommended to bypass peak crowds.'
        };
    }

    // 5. Low crowds & excellent weather
    if (crowdLevel === 'low' && weather.rain === 0) {
        return {
            timeWindow: '5:30 PM - 7:00 PM',
            explanation: 'Sunset hour is ideal; conditions are calm with minimal crowd traffic.'
        };
    }

    // Default recommendation: moderate conditions
    return {
        timeWindow: '4:00 PM - 6:00 PM',
        explanation: 'Mild evening hours with comfortable temperatures and average crowd presence.'
    };
};
