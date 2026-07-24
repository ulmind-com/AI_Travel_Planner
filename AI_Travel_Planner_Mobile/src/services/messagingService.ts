import api from '../lib/api';

export interface ParticipantDetail {
  firebaseUid: string;
  username?: string;
  fullname?: string;
  profilepicture?: string;
  onlineStatus?: string;
  lastActive?: string | null;
}

export interface Conversation {
  _id: string;
  participants?: any[];
  participantDetails?: ParticipantDetail[];
  isGroup?: boolean;
  groupName?: string;
  groupImage?: string;
  lastMessage?: Message | string;
  updatedAt?: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface Message {
  _id: string;
  conversationId?: string;
  senderFirebaseUid?: string;
  sender?: any;
  content: string;
  nonce?: string;
  isEncrypted?: boolean;
  status?: MessageStatus;
  type?: string;
  createdAt?: string;
  /** Client-side decrypted text for display (never sent to server). */
  _displayContent?: string;
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

export async function sendMessage(
  conversationId: string,
  content: string,
  opts: { nonce?: string; isEncrypted?: boolean } = {},
): Promise<Message> {
  const { data } = await api.post('/messaging/message', {
    conversationId,
    content,
    type: 'text',
    nonce: opts.nonce ?? '',
    isEncrypted: opts.isEncrypted ?? false,
  });
  return (data?.data ?? data) as Message;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await api.put(`/messaging/messages/read/${conversationId}`);
}

// ── E2EE public-key exchange ──

export async function uploadPublicKey(publicKey: string): Promise<void> {
  await api.post('/users/e2ee/public-key', { publicKey });
}

export async function fetchPublicKey(firebaseUid: string): Promise<string | null> {
  const { data } = await api.get(`/users/e2ee/public-key/${firebaseUid}`);
  return (data?.data?.e2eePublicKey ?? null) as string | null;
}
