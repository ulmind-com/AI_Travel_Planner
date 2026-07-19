import { groqGeneratedData } from './groq.service';
import logger from '../utils/logger';

export interface IModerationResult {
    toxicityScore: number;
    spamScore: number;
    flags: ('toxic' | 'spam' | 'sexual' | 'hate')[];
}

/**
 * Run content through GROQ to analyze for toxicity, spam, and safety flags.
 */
export const moderateContent = async (text: string): Promise<IModerationResult> => {
    if (!text || text.trim() === '') {
        return { toxicityScore: 0, spamScore: 0, flags: [] };
    }

    try {
        const prompt = `Analyze this user generated content for safety, spam, toxicity, and appropriateness.
Content to analyze:
"${text.replace(/"/g, '\\"')}"

Evaluate:
- toxicity (insults, abuse, hostility, cyberbullying)
- spam (unsolicited advertisements, repetitive promotional text, bot-like phrasing)
- hate speech (bias or targeting based on race, gender, religion, orientation)
- sexual content (inappropriate nudity, explicit language)

Respond ONLY with a valid JSON object matching this schema:
{
  "toxicityScore": <number between 0.0 and 1.0>,
  "spamScore": <number between 0.0 and 1.0>,
  "flags": <array of strings from the list ["toxic", "spam", "sexual", "hate"]>
}`;

        const rawResult = await groqGeneratedData(prompt);
        const parsed = JSON.parse(rawResult);

        // Sanitize outputs
        const toxicityScore = parseFloat(parsed.toxicityScore ?? 0);
        const spamScore = parseFloat(parsed.spamScore ?? 0);
        const rawFlags = parsed.flags ?? [];
        
        const validFlags = ['toxic', 'spam', 'sexual', 'hate'];
        const flags = rawFlags.filter((f: string) => validFlags.includes(f)) as ('toxic' | 'spam' | 'sexual' | 'hate')[];

        return {
            toxicityScore: Math.max(0, Math.min(1, toxicityScore)),
            spamScore: Math.max(0, Math.min(1, spamScore)),
            flags
        };
        
    } catch (error) {
        logger.error('[AI Moderation Engine] Failed content analysis, using fallback zero flags:', error);
        
        // Safety Fallback (non-toxic default unless spam triggers detected locally)
        const hasUrl = /https?:\/\/[^\s]+/.test(text);
        const spamWords = ['buy now', 'cheap', 'click here', 'discount', 'free money'];
        const matchesSpam = spamWords.some(w => text.toLowerCase().includes(w));

        return {
            toxicityScore: 0,
            spamScore: hasUrl || matchesSpam ? 0.6 : 0,
            flags: hasUrl || matchesSpam ? ['spam'] : []
        };
    }
};
