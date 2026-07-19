import api from '../lib/api';
import type { ChatMessage, ChatReply } from '../types/chat';

/** Send a message to the AI travel assistant. */
export async function sendChatMessage(message: string): Promise<ChatReply> {
  const { data } = await api.post('/ai/chat', { message }, { timeout: 90000 });
  return data as ChatReply;
}

/** Fetch the user's chat history. */
export async function getChatHistory(): Promise<ChatMessage[]> {
  const { data } = await api.get('/ai/chat/history');
  return (data?.data ?? []) as ChatMessage[];
}

/** Clear the user's chat history. */
export async function clearChatHistory(): Promise<void> {
  await api.delete('/ai/chat/history');
}

/** Travel-twin AI plan suggestions. */
export async function getAiSuggestions(): Promise<any> {
  const { data } = await api.get('/ai/suggestions');
  return data?.data ?? data;
}

/** Travel-twin preference profile insights. */
export async function getTwinProfile(): Promise<any> {
  const { data } = await api.get('/ai/profile');
  return data?.data ?? data;
}
