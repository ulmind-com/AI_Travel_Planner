import api from '../lib/api';

export interface Conversation {
  _id: string;
  participants?: any[];
  isGroup?: boolean;
  groupName?: string;
  groupImage?: string;
  lastMessage?: { content?: string; createdAt?: string } | string;
  updatedAt?: string;
}

export interface Message {
  _id: string;
  conversationId?: string;
  senderFirebaseUid?: string;
  sender?: any;
  content: string;
  type?: string;
  createdAt?: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get('/messaging/conversations');
  return (data?.data ?? data ?? []) as Conversation[];
}

export async function getOrCreateConversation(recipientFirebaseUid: string): Promise<Conversation> {
  const { data } = await api.post('/messaging/conversation', { recipientFirebaseUid });
  return (data?.data ?? data) as Conversation;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await api.get(`/messaging/messages/${conversationId}`);
  return (data?.data ?? data ?? []) as Message[];
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const { data } = await api.post('/messaging/message', { conversationId, content, type: 'text' });
  return (data?.data ?? data) as Message;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await api.put(`/messaging/messages/read/${conversationId}`);
}
