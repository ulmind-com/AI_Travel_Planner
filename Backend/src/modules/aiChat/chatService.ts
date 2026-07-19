import ChatHistory, { IChatMessage } from '../../shared/database/models/chatHistoryModel';
import User from '../../shared/database/models/userModel';
import { getUserProfile } from '../../shared/services/digitalTwinEngine';
import { parseIntentHeuristic } from './intentParser';
import { buildChatPrompt } from './promptBuilder';
import { groqGeneratedData } from '../../shared/services/groq.service';
import logger from '../../shared/utils/logger';

export interface IChatResponse {
    success: boolean;
    intent: any;
    aiResponse: {
        message: string;
        destinations: string[];
        hotels: Array<{ name: string; cost: string; description: string }>;
        itinerary: Array<{ day: number; title: string; description: string; activities: string[] }>;
        estimatedCost: string;
        tips: string[];
    };
    followUps: string[];
    action: {
        type: 'create_plan' | 'search_hotels' | 'none';
        data: {
            to?: string;
            days?: number;
            budget?: number;
            travelStyle?: string;
        };
    };
}

/**
 * Process a new incoming user chat message.
 */
export const processUserMessage = async (
    firebaseUid: string,
    message: string
): Promise<IChatResponse> => {
    try {
        // 1. Get Mongo User Object ID
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            throw new Error(`User not found with firebaseUid: ${firebaseUid}`);
        }

        // 2. Fetch or create ChatHistory
        let chatHistory = await ChatHistory.findOne({ firebaseUid });
        if (!chatHistory) {
            chatHistory = await ChatHistory.create({
                userId: user._id,
                firebaseUid,
                messages: []
            });
        }

        // 3. Get User's Digital Twin Profile
        const twinProfile = await getUserProfile(firebaseUid);

        // 4. Extract last 10 messages from history for prompt context
        const recentMessages = chatHistory.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // 5. Run local intent detection
        const heuristicIntent = parseIntentHeuristic(message);

        // 6. Build Prompt for GROQ
        const { systemPrompt, userPrompt } = buildChatPrompt(
            message,
            recentMessages,
            twinProfile,
            heuristicIntent
        );

        const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

        // 7. Call GROQ
        logger.info(`[AIChat] Querying GROQ for user: ${firebaseUid}`);
        const rawResponse = await groqGeneratedData(combinedPrompt);
        
        let parsedResult: any;
        try {
            parsedResult = JSON.parse(rawResponse);
        } catch (e) {
            logger.warn(`[AIChat] Failed to parse GROQ JSON response. Raw: ${rawResponse}`);
            // Fallback parsing / construct basic valid response
            parsedResult = {
                intent: heuristicIntent,
                aiResponse: {
                    message: rawResponse || "I encountered an error understanding your request. How else can I help?",
                    destinations: heuristicIntent.destination ? [heuristicIntent.destination] : [],
                    hotels: [],
                    itinerary: [],
                    estimatedCost: "Unknown",
                    tips: []
                },
                followUps: ["Do you want to plan a trip?", "What is your budget?"],
                action: { type: "none", data: {} }
            };
        }

        // 8. Save messages to history
        const userMsg: IChatMessage = {
            role: 'user',
            content: message,
            timestamp: new Date(),
            intent: heuristicIntent
        };

        const assistantMsg: IChatMessage = {
            role: 'assistant',
            content: parsedResult.aiResponse?.message || JSON.stringify(parsedResult),
            timestamp: new Date(),
            intent: parsedResult.intent,
            action: {
                ...(parsedResult.action || {}),
                aiResponse: parsedResult.aiResponse,
                followUps: parsedResult.followUps
            }
        };

        chatHistory.messages.push(userMsg, assistantMsg);
        await chatHistory.save();

        return {
            success: true,
            intent: parsedResult.intent || heuristicIntent,
            aiResponse: parsedResult.aiResponse,
            followUps: parsedResult.followUps || ["Do you want cheaper options?", "Travel solo or group?"],
            action: parsedResult.action || { type: 'none', data: {} }
        };

    } catch (error: any) {
        logger.error(`[AIChat] Error processing user message:`, error);
        throw error;
    }
};

/**
 * Retrieve chat history messages for a user.
 */
export const getHistoryMessages = async (firebaseUid: string) => {
    const history = await ChatHistory.findOne({ firebaseUid });
    return history ? history.messages : [];
};

/**
 * Clear chat history.
 */
export const clearChatHistory = async (firebaseUid: string) => {
    await ChatHistory.deleteOne({ firebaseUid });
    return { success: true, message: 'Chat history cleared successfully.' };
};
