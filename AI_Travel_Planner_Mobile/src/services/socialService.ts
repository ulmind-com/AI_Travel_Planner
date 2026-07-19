import api from '../lib/api';

export interface SocialUser {
  _id?: string;
  firebaseUid?: string;
  username?: string;
  fullname?: string;
  profilepicture?: string;
  profileImage?: string;
  bio?: string;
  trustScore?: number;
  followersCount?: number;
  isFollowing?: boolean;
}

export interface Notification {
  _id: string;
  type?: string;
  message?: string;
  content?: string;
  read?: boolean;
  isRead?: boolean;
  relatedId?: string;
  senderFirebaseUid?: string;
  sender?: any;
  createdAt?: string;
}

export async function searchUsers(q: string): Promise<SocialUser[]> {
  const { data } = await api.get('/social/search', { params: { q } });
  return (data?.data ?? data ?? []) as SocialUser[];
}

export async function getSocialProfile(username: string): Promise<any> {
  const { data } = await api.get(`/social/profile/${username}`);
  return data?.data ?? data;
}

export async function toggleFollow(targetId: string): Promise<any> {
  const { data } = await api.post(`/social/follow/${targetId}`);
  return data;
}

export async function sendFriendRequest(targetId: string): Promise<any> {
  const { data } = await api.post('/social/friend-request', { targetId });
  return data;
}

export async function acceptFriendRequest(requesterId: string): Promise<any> {
  const { data } = await api.post('/social/accept-request', { requesterId });
  return data;
}

export async function getFriends(): Promise<SocialUser[]> {
  const { data } = await api.get('/social/friends');
  return (data?.data ?? data ?? []) as SocialUser[];
}

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get('/social/notifications');
  return (data?.data ?? data ?? []) as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/social/notifications/read/${id}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/social/notifications/read-all');
}

/** Trust score for a user (0-100). */
export async function getTrustScore(userId: string): Promise<any> {
  const { data } = await api.get(`/trust/${userId}`);
  return data?.data ?? data;
}
