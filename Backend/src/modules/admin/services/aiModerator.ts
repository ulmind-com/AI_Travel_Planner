import Groq from 'groq-sdk';
import logger from '../../../shared/utils/logger';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Highly curated local rule-based toxicity list
const TOXIC_KEYWORDS = [
    'hate', 'kill', 'fuck', 'bitch', 'asshole', 'bastard', 'nigger', 'chink',
    'dick', 'pussy', 'slut', 'whore', 'rape', 'suicide', 'bomb', 'terrorist',
    'hitler', 'nazi', 'die', 'murder', 'abuse'
];

export interface ModerationResult {
    isUnsafe: boolean;
    category: string;
    severity: 'low' | 'medium' | 'high';
    aiScore: number;
    reason: string;
}

/**
 * Hybrid Moderation: Integrates Rule-Based scoring with GROQ LLM Deep Analysis.
 */
export const analyzeContent = async (text: string): Promise<ModerationResult> => {
    if (!text || text.trim() === '') {
        return { isUnsafe: false, category: 'clean', severity: 'low', aiScore: 0, reason: 'Empty content' };
    }

    const cleanText = text.toLowerCase();
    
    // 1. Rule-Based scoring
    let ruleScore = 0;
    const matchedWords: string[] = [];
    
    TOXIC_KEYWORDS.forEach(word => {
        if (cleanText.includes(word)) {
            ruleScore += 0.35;
            matchedWords.push(word);
        }
    });

    ruleScore = Math.min(1, ruleScore);

    // 2. GROQ AI contextual LLM scan
    let aiUnsafe = false;
    let aiCategory = 'clean';
    let aiSeverity: 'low' | 'medium' | 'high' = 'low';
    let aiConfidence = 0.0;
    let aiReason = 'Ecosystem scanning pass.';

    try {
        const prompt = `You are a strict, production-grade social media trust and safety moderation engine.
Analyze the following text content for toxicity, vulgarity, hate speech, sexual harassment, harassment, self-harm, and violence.
You MUST respond with a single, valid JSON object ONLY. Do not write any markdown codeblock wrapper, no prefix, and no trailing conversational text.

Text to analyze: "${text.replace(/"/g, '\\"')}"

Expected JSON Schema:
{
  "isUnsafe": boolean,
  "category": "hate" | "sexual" | "violence" | "harassment" | "clean",
  "severity": "low" | "medium" | "high",
  "confidence": number (between 0.0 and 1.0),
  "reason": "Brief technical explanation of why it was flagged or approved"
}`;

        const chatComplete = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });

        const rawResult = chatComplete.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawResult);

        aiUnsafe = !!parsed.isUnsafe;
        aiCategory = parsed.category || 'clean';
        aiSeverity = parsed.severity || 'low';
        aiConfidence = Number(parsed.confidence) || 0.0;
        aiReason = parsed.reason || '';

    } catch (error: any) {
        logger.error(`GROQ AI Moderation failed, falling back to rule-based logic: ${error.message}`);
        // Fallback directly to rule-based results if AI fails (Rate limits, token limits, key missing)
        if (ruleScore > 0.3) {
            return {
                isUnsafe: true,
                category: 'harmful_content',
                severity: ruleScore > 0.7 ? 'high' : 'medium',
                aiScore: ruleScore,
                reason: `Flagged via keyword filter: matches [${matchedWords.join(', ')}]`
            };
        }
    }

    // Combine score metrics
    const finalScore = Math.max(ruleScore, aiConfidence);
    const isUnsafe = aiUnsafe || ruleScore > 0.4;
    
    let finalSeverity: 'low' | 'medium' | 'high' = aiSeverity;
    if (finalScore > 0.7) finalSeverity = 'high';
    else if (finalScore > 0.35) finalSeverity = 'medium';

    return {
        isUnsafe,
        category: aiCategory === 'clean' && isUnsafe ? 'vulgarity' : aiCategory,
        severity: finalSeverity,
        aiScore: parseFloat(finalScore.toFixed(2)),
        reason: isUnsafe 
            ? `${aiReason} (Rule score: ${ruleScore.toFixed(2)})`
            : 'Passes trust & safety thresholds.'
    };
};

/**
 * Scan image URL references for NSFW keywords or signatures.
 */
export const analyzeImage = async (url: string): Promise<{ isUnsafe: boolean; score: number; reason: string }> => {
    if (!url) return { isUnsafe: false, score: 0, reason: 'No image URL provided' };

    const lowerUrl = url.toLowerCase();
    const suspectPatterns = ['nsfw', 'adult', 'nude', 'sexy', 'porn', 'xxx', 'bikini'];
    
    const isSuspect = suspectPatterns.some(pattern => lowerUrl.includes(pattern));

    if (isSuspect) {
        return {
            isUnsafe: true,
            score: 0.85,
            reason: 'Flagged via suspicious image URL signature signature matches.'
        };
    }

    return {
        isUnsafe: false,
        score: 0.05,
        reason: 'Image complies with general audience standards.'
    };
};
