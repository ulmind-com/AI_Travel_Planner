import SafetyAlert from '../../shared/database/models/safetyAlertModel';

export interface IRiskAnalysis {
    level: 'safe' | 'caution' | 'danger';
    reasons: string[];
    alerts: Array<{
        type: string;
        severity: string;
        message: string;
    }>;
}

/**
 * Analyzes weather conditions, crowd levels, and database alerts to evaluate risk.
 */
export const analyzeTravelRisk = async (
    location: string,
    weather: { temp: number; rain: number; wind: number; uv: number },
    crowdLevel: 'low' | 'medium' | 'high'
): Promise<IRiskAnalysis> => {
    const reasons: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' = 'low';

    // 1. Weather Checks
    if (weather.rain > 10) {
        reasons.push('Heavy downpour/storms detected.');
        maxSeverity = 'high';
    } else if (weather.rain > 3) {
        reasons.push('Moderate rain showers active.');
        if (maxSeverity !== 'high') maxSeverity = 'medium';
    }

    if (weather.wind > 40) {
        reasons.push('Hazardous wind speeds active.');
        maxSeverity = 'high';
    } else if (weather.wind > 25) {
        reasons.push('Gusty winds; caution advised for outdoor activities.');
        if (maxSeverity !== 'high') maxSeverity = 'medium';
    }

    if (weather.uv > 8) {
        reasons.push('Extremely high UV index; high sunburn risk.');
        if (maxSeverity !== 'high') maxSeverity = 'medium';
    }

    // 2. Crowd Checks
    if (crowdLevel === 'high') {
        reasons.push('High crowd density; expectations of traffic and delay.');
        if (maxSeverity !== 'high') maxSeverity = 'medium';
    }

    // 3. Database Safety Alerts
    const dbAlerts = await SafetyAlert.find({
        location: { $regex: new RegExp(location, 'i') }
    });

    const formattedAlerts = dbAlerts.map(alert => {
        if (alert.severity === 'high') maxSeverity = 'high';
        else if (alert.severity === 'medium' && maxSeverity !== 'high') maxSeverity = 'medium';
        return {
            type: alert.type,
            severity: alert.severity,
            message: alert.message
        };
    });

    // 4. Map overall risk level
    let level: 'safe' | 'caution' | 'danger' = 'safe';
    if (maxSeverity === 'high') {
        level = 'danger';
    } else if (maxSeverity === 'medium') {
        level = 'caution';
    }

    if (reasons.length === 0 && formattedAlerts.length === 0) {
        reasons.push('Clear weather and comfortable crowd levels.');
    }

    return {
        level,
        reasons,
        alerts: formattedAlerts
    };
};
