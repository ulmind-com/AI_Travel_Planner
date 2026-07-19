import { IParsedIntent } from './intentParser';

interface IDigitalTwinProfile {
    preferredDestinations?: string[];
    budgetRange?: { min: number; max: number };
    travelStyle?: string[];
    preferredClimate?: string[];
    aiPredictionText?: string;
}

interface IChatHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Prompt builder for AdventureNexus AI Chat Assistant.
 */
export const buildChatPrompt = (
    userMessage: string,
    history: IChatHistoryMessage[],
    digitalTwin: IDigitalTwinProfile,
    heuristicIntent: IParsedIntent
) => {
    // 1. Digital Twin Context
    const twinPreferences = `
- Preferred destinations: ${digitalTwin.preferredDestinations?.join(', ') || 'Not verified'}
- Budget range: $${digitalTwin.budgetRange?.min || 0} - $${digitalTwin.budgetRange?.max || 1000000}
- Travel styles: ${digitalTwin.travelStyle?.join(', ') || 'Not verified'}
- Preferred climates: ${digitalTwin.preferredClimate?.join(', ') || 'Not verified'}
- Twin summary: "${digitalTwin.aiPredictionText || 'Analyzing user footprint.'}"
`;

    // 2. Formatting the conversation history
    const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');

    // 3. System Prompt specifying JSON response format
    const systemPrompt = `You are the AdventureNexus AI Assistant, a premium, context-aware travel copilot.
You have access to the user's "Digital Twin" preferences to customize all suggestions.
You must analyze the user message and history, identify travel intents, provide tailored suggestions (itinerary, budget, hotels, tips), suggest next action buttons, and return a clean JSON response.

Here are the user's Digital Twin preferences to keep in mind for personalization:
${twinPreferences}

Heuristic Intent Detection (use this as guidance, but override if the conversation context demands it):
- Intent: ${heuristicIntent.intent}
- Budget: ${heuristicIntent.budget}
- Destination: ${heuristicIntent.destination || 'Not specified'}
- Group Type: ${heuristicIntent.groupType}
- Mood: ${heuristicIntent.mood}

Respond ONLY in valid, single JSON block matching the following structure:
{
  "intent": {
    "intent": "string (budget_travel, luxury_travel, adventure, relaxation, family_trip, solo_trip, general_chat)",
    "budget": "string (low, medium, high, unknown)",
    "destination": "string or null",
    "mood": "string",
    "groupType": "string (solo, group, family, unknown)"
  },
  "aiResponse": {
    "message": "string (markdown format, conversational assistant reply)",
    "destinations": ["string"],
    "hotels": [
      {
        "name": "string",
        "cost": "string",
        "description": "string"
      }
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "string",
        "description": "string",
        "activities": ["string"]
      }
    ],
    "estimatedCost": "string",
    "tips": ["string"]
  },
  "followUps": ["string (exactly 2 follow-up question choices for the user)"],
  "action": {
    "type": "string (create_plan, search_hotels, none)",
    "data": {
      "to": "string (destination)",
      "days": number (trip duration, default 3),
      "budget": number (total budget estimation in USD/INR),
      "travelStyle": "string"
    }
  }
}

Keep markdown in "aiResponse.message" rich, clear, and professional. Use bullet points and headers. Be concise.`;

    const userPrompt = `
Conversation History:
${formattedHistory || 'No previous messages.'}

Current User Message:
"${userMessage}"

Generate your response in the specified JSON format now:`;

    return {
        systemPrompt,
        userPrompt
    };
};
