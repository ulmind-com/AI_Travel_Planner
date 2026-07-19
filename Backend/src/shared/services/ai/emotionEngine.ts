import { groqGeneratedData } from '../groq.service';
import logger from '../../utils/logger';

export type EmotionType = 'stressed' | 'happy' | 'bored' | 'romantic' | 'tired' | 'neutral';

export interface IEmotionAnalysis {
    emotion: EmotionType;
    intensity: number;
    intent: string;
}

export interface IMoodMapping {
    travelType: string;
    tags: string[];
}

export const MOOD_MAPPINGS: Record<EmotionType, IMoodMapping> = {
    stressed: {
        travelType: 'relaxation',
        tags: ['spa', 'beach', 'low crowd', 'wellness', 'nature', 'quiet']
    },
    happy: {
        travelType: 'adventure',
        tags: ['trekking', 'theme parks', 'active', 'sports', 'camping', 'hiking']
    },
    bored: {
        travelType: 'exploration',
        tags: ['museums', 'cities', 'heritage', 'exploration', 'culture', 'shopping']
    },
    romantic: {
        travelType: 'romantic',
        tags: ['scenic', 'dining', 'cozy', 'couple destinations', 'sunset', 'resorts']
    },
    tired: {
        travelType: 'slow travel',
        tags: ['slow travel', 'wellness', 'nature', 'quiet', 'yoga', 'scenery']
    },
    neutral: {
        travelType: 'sightseeing',
        tags: ['sightseeing', 'balanced', 'popular', 'general']
    }
};

/**
 * Detect emotion from user input text (message, search, note) using GROQ AI
 */
export async function detectEmotion(text: string): Promise<IEmotionAnalysis> {
    if (!text || text.trim() === '') {
        return { emotion: 'neutral', intensity: 0.5, intent: 'general' };
    }

    try {
        const prompt = `Analyze the emotion of this user message:
"${text.replace(/"/g, '\\"')}"

Evaluate and classify it into one of these exact categories: ["stressed", "happy", "bored", "romantic", "tired", "neutral"].
Also provide an intensity score between 0.0 and 1.0, and a user intent (e.g. relaxation, adventure, sightseeing).

Return JSON ONLY in this exact schema:
{
  "emotion": "stressed" | "happy" | "bored" | "romantic" | "tired" | "neutral",
  "intensity": number,
  "intent": string
}`;

        const rawResponse = await groqGeneratedData(prompt);
        if (!rawResponse) {
            throw new Error('Empty response from GROQ');
        }

        const parsed = JSON.parse(rawResponse);
        const emotion = (parsed.emotion || 'neutral').toLowerCase() as EmotionType;
        
        const validEmotions: EmotionType[] = ['stressed', 'happy', 'bored', 'romantic', 'tired', 'neutral'];
        const finalEmotion = validEmotions.includes(emotion) ? emotion : 'neutral';
        const intensity = Math.max(0, Math.min(1, parsed.intensity ?? 0.5));
        const intent = parsed.intent || 'general';

        return {
            emotion: finalEmotion,
            intensity,
            intent
        };
    } catch (error) {
        logger.error('[AI Emotion Detection Engine] Failed to analyze emotion, using fallback:', error);
        
        // Simple regex fallback
        const lower = text.toLowerCase();
        if (lower.includes('stressed') || lower.includes('anxious') || lower.includes('worry') || lower.includes('busy') || lower.includes('overwhelm')) {
            return { emotion: 'stressed', intensity: 0.7, intent: 'relaxation' };
        }
        if (lower.includes('tired') || lower.includes('exhaust') || lower.includes('sleepy') || lower.includes('fatigue')) {
            return { emotion: 'tired', intensity: 0.8, intent: 'slow travel' };
        }
        if (lower.includes('happy') || lower.includes('excited') || lower.includes('thrill') || lower.includes('fun')) {
            return { emotion: 'happy', intensity: 0.7, intent: 'adventure' };
        }
        if (lower.includes('bored') || lower.includes('nothing to do') || lower.includes('monotonous')) {
            return { emotion: 'bored', intensity: 0.6, intent: 'exploration' };
        }
        if (lower.includes('romantic') || lower.includes('love') || lower.includes('date') || lower.includes('anniversary') || lower.includes('honeymoon')) {
            return { emotion: 'romantic', intensity: 0.8, intent: 'couple travel' };
        }

        return { emotion: 'neutral', intensity: 0.5, intent: 'general' };
    }
}
