import { groqGeneratedData } from '../groq.service';
import logger from '../../utils/logger';
import { EmotionType, MOOD_MAPPINGS } from './emotionEngine';

export interface IOptimizedItinerary {
    name: string;
    to: string;
    days: number;
    budget: number;
    travel_style: string;
    destination_overview: string;
    perfect_for: string[];
    budget_breakdown: {
        flights: number;
        accommodation: number;
        activities: number;
        food: number;
        total: number;
        currency: string;
    };
    suggested_itinerary: {
        day: number;
        title: string;
        description: string;
        morning: string;
        afternoon: string;
        evening: string;
        activities: {
            name: string;
            cost: string;
            time: string;
            description: string;
        }[];
    }[];
    trip_highlights: {
        name: string;
        description: string;
        match_reason: string;
    }[];
    how_to_reach: {
        best_way: string;
        modes: {
            type: string;
            description: string;
            estimated_cost: string;
            duration: string;
        }[];
        arrival_tips: string[];
    };
    local_tips: string[];
    metrics: {
        distanceEfficiency: number;
        costEfficiency: number;
        emotionMatch: number;
        timeUtilization: number;
        score: number;
    };
    explanation: string;
}

/**
 * Optimize an itinerary based on location, days, budget, user emotion, and adjustments
 */
export async function optimizeItinerary(
    destination: string,
    days: number,
    budget: number,
    emotion: EmotionType = 'neutral',
    adjustments: string[] = []
): Promise<IOptimizedItinerary> {
    const moodDetails = MOOD_MAPPINGS[emotion] || MOOD_MAPPINGS.neutral;
    const travelStyle = moodDetails.travelType;
    const tags = moodDetails.tags;
    
    // Process adjustments to guide the AI
    const adjustmentDirectives = adjustments.map(adj => {
        if (adj.toLowerCase().includes('cheap')) {
            return "Minimize accommodation and flight costs. Prioritize free or public attractions.";
        }
        if (adj.toLowerCase().includes('relax')) {
            return "Ensure spacing is slow-paced. Avoid overlapping heavy travel. Add spa, wellness, or beach relaxation sessions.";
        }
        if (adj.toLowerCase().includes('adventure')) {
            return "Include high-energy activities like trekking, watersports, or exploration tours.";
        }
        return adj;
    }).join(' ');

    const prompt = `
You are an elite travel architect. Optimize a custom itinerary for:
- Destination: ${destination}
- Number of Days: ${days}
- Budget (INR): ${budget}
- Target Emotion/Mood: ${emotion} (${travelStyle} travel style focusing on ${tags.join(', ')})
- Dynamic Adjustments requested: ${adjustmentDirectives || 'None'}

Please construct a comprehensive travel plan that is optimized for:
1. Distance efficiency (attractions on the same day must be geographically close to minimize travel time).
2. Cost efficiency (total cost of flights, hotels, food, and activities should stay within the ${budget} INR budget).
3. Emotion match (activities must align with the user's emotional state, e.g., low-stress/relaxing activities for 'stressed').
4. Time utilization (balance pacing; slow/relaxed for 'stressed' or 'tired', energetic for 'happy' or 'adventure').

Return a JSON object containing the complete itinerary and metadata.
You must also include your internal evaluation metrics (scores from 0.0 to 1.0) and an explanation explaining "Why this suggestion?".

Return ONLY a valid JSON object matching this exact TypeScript schema:
{
  "name": "string (e.g., Cozy Retreat to Manali)",
  "to": "string (destination name)",
  "days": number,
  "budget": number,
  "travel_style": "string (e.g., Relaxation, Adventure, Slow Travel)",
  "destination_overview": "string (1-2 sentences overview of destination)",
  "perfect_for": ["string"],
  "budget_breakdown": {
    "flights": number,
    "accommodation": number,
    "activities": number,
    "food": number,
    "total": number,
    "currency": "INR"
  },
  "suggested_itinerary": [
    {
      "day": number,
      "title": "string (e.g., Tranquil Forest Walk)",
      "description": "string (overview of the day's pacing and vibe)",
      "morning": "string",
      "afternoon": "string",
      "evening": "string",
      "activities": [
        {
          "name": "string",
          "cost": "string (e.g., Free, 500 INR)",
          "time": "string (e.g., 09:00 AM - 11:30 AM)",
          "description": "string"
        }
      ]
    }
  ],
  "trip_highlights": [
    {
      "name": "string",
      "description": "string",
      "match_reason": "string (how it matches the mood of the traveler)"
    }
  ],
  "how_to_reach": {
    "best_way": "string",
    "modes": [
      {
        "type": "string (e.g., Flight, Train, Cab)",
        "description": "string",
        "estimated_cost": "string",
        "duration": "string"
      }
    ],
    "arrival_tips": ["string"]
  },
  "local_tips": ["string"],
  "metrics": {
    "distanceEfficiency": number (0.0 to 1.0),
    "costEfficiency": number (0.0 to 1.0),
    "emotionMatch": number (0.0 to 1.0),
    "timeUtilization": number (0.0 to 1.0)
  },
  "explanation": "string (Explanation of why this plan was selected, mentioning their emotion and how the pacing, budget, and activities were altered to suit them)"
}
`;

    try {
        const rawResponse = await groqGeneratedData(prompt);
        if (!rawResponse) {
            throw new Error('Empty response from GROQ');
        }

        const parsed = JSON.parse(rawResponse) as IOptimizedItinerary;
        
        // Calculate optimization score using the formula:
        // score(plan) = distanceEfficiency * 0.3 + costEfficiency * 0.2 + emotionMatch * 0.3 + timeUtilization * 0.2
        const m = parsed.metrics || { distanceEfficiency: 0.8, costEfficiency: 0.8, emotionMatch: 0.8, timeUtilization: 0.8 };
        const score = (m.distanceEfficiency * 0.3) + (m.costEfficiency * 0.2) + (m.emotionMatch * 0.3) + (m.timeUtilization * 0.2);
        
        parsed.metrics = {
            distanceEfficiency: parseFloat(m.distanceEfficiency.toFixed(2)),
            costEfficiency: parseFloat(m.costEfficiency.toFixed(2)),
            emotionMatch: parseFloat(m.emotionMatch.toFixed(2)),
            timeUtilization: parseFloat(m.timeUtilization.toFixed(2)),
            score: parseFloat(score.toFixed(2))
        };

        return parsed;

    } catch (error) {
        logger.error('[AI Itinerary Optimizer] Optimization failed, generating fallback:', error);
        
        // Fallback optimized itinerary
        const fallbackExplanation = `We built a ${travelStyle} focused fallback itinerary for ${destination} because of your '${emotion}' mood state, prioritizing emotional comfort and budgeting.`;
        
        return {
            name: `Optimized Vibe Trip to ${destination}`,
            to: destination,
            days,
            budget,
            travel_style: travelStyle.toUpperCase(),
            destination_overview: `A serene journey to ${destination} customized for a ${emotion} state of mind.`,
            perfect_for: [emotion, 'relaxation', 'rejuvenation'],
            budget_breakdown: {
                flights: Math.round(budget * 0.35),
                accommodation: Math.round(budget * 0.35),
                activities: Math.round(budget * 0.15),
                food: Math.round(budget * 0.15),
                total: budget,
                currency: 'INR'
            },
            suggested_itinerary: Array.from({ length: days }).map((_, i) => ({
                day: i + 1,
                title: `Day ${i + 1}: ${emotion === 'stressed' || emotion === 'tired' ? 'Unwinding & Serenity' : 'Exploration & Joy'}`,
                description: `Paced perfectly to help you recover from feeling ${emotion}.`,
                morning: emotion === 'stressed' || emotion === 'tired' ? 'Relaxed local breakfast and light nature walk' : 'Exciting sightseeing at main city hotspots',
                afternoon: emotion === 'stressed' || emotion === 'tired' ? 'Spa/wellness treatment or quiet reading time' : 'Guided local cuisine tasting and local tours',
                evening: 'Sunset viewpoint and cozy dinner',
                activities: [
                    {
                        name: emotion === 'stressed' || emotion === 'tired' ? 'Serene Spa Session' : 'Adventure Excursion',
                        cost: '1500 INR',
                        time: '02:00 PM - 04:00 PM',
                        description: `A relaxing session specifically selected to target feeling ${emotion}.`
                    }
                ]
            })),
            trip_highlights: [
                {
                    name: 'Custom Vibe Comfort',
                    description: 'Specially paced activities to match your energy level.',
                    match_reason: `Tailored specifically for someone feeling ${emotion}.`
                }
            ],
            how_to_reach: {
                best_way: 'Flight followed by airport taxi transfer.',
                modes: [
                    {
                        type: 'Flight',
                        description: 'Direct flight to the nearest airport.',
                        estimated_cost: `${Math.round(budget * 0.35)} INR`,
                        duration: '2 hours'
                    }
                ],
                arrival_tips: ['Keep a digital copy of your itinerary.', 'Book taxi through prepaid counters.']
            },
            local_tips: ['Stay hydrated.', 'Follow local guidelines.'],
            metrics: {
                distanceEfficiency: 0.85,
                costEfficiency: 0.9,
                emotionMatch: 0.95,
                timeUtilization: 0.8,
                score: 0.88
            },
            explanation: fallbackExplanation
        };
    }
}
