export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  intent?: any;
  action?: any;
}

export interface AiResponse {
  message: string;
  destinations?: string[];
  hotels?: { name: string; cost: string; description: string }[];
  itinerary?: { day: number; title: string; description: string; activities: string[] }[];
  estimatedCost?: string;
  tips?: string[];
}

export interface ChatReply {
  success: boolean;
  intent?: any;
  aiResponse: AiResponse;
  followUps?: string[];
  action?: {
    type: 'create_plan' | 'search_hotels' | 'none';
    data: { to?: string; days?: number; budget?: number; travelStyle?: string };
  };
}
