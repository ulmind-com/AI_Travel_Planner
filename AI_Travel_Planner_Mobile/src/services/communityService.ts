import api from '../lib/api';
import { appendIf, FilePart } from '../lib/upload';
import type { CommunityEvent, CommunityPost, Comment, Group, Story } from '../types/community';

export async function getPosts(params?: { category?: string; search?: string }): Promise<CommunityPost[]> {
  const { data } = await api.get('/community/posts', { params });
  return (data?.data ?? []) as CommunityPost[];
}

export async function getTrendingPosts(): Promise<CommunityPost[]> {
  const { data } = await api.get('/community/posts/trending');
  return (data?.data ?? []) as CommunityPost[];
}

export async function getPostById(id: string): Promise<CommunityPost | null> {
  const { data } = await api.get(`/community/posts/${id}`);
  return (data?.data ?? null) as CommunityPost | null;
}

/** Comma-separated "japan, budget" -> JSON array string '["japan","budget"]' (backend JSON.parses tags). */
function tagsToJson(tags?: string): string | undefined {
  if (!tags) return undefined;
  const arr = tags
    .split(',')
    .map(t => t.trim().replace(/^#/, ''))
    .filter(Boolean);
  return arr.length ? JSON.stringify(arr) : undefined;
}

export async function createPost(input: {
  title?: string;
  content: string;
  category?: string;
  tags?: string;
  images?: FilePart[];
}): Promise<CommunityPost> {
  const form = new FormData();
  appendIf(form, 'content', input.content);
  appendIf(form, 'title', input.title);
  appendIf(form, 'category', input.category);
  appendIf(form, 'tags', tagsToJson(input.tags));
  (input.images ?? []).forEach(img => form.append('images', img as any));
  const { data } = await api.post('/community/posts', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return (data?.data ?? data) as CommunityPost;
}

/** Share a generated trip plan to the community feed (links the plan via tripId). */
export async function sharePlanToCommunity(input: {
  title: string;
  content: string;
  category?: string;
  tripId: string;
  imageUrl?: string;
  tags?: string[];
}): Promise<CommunityPost> {
  const { data } = await api.post('/community/posts', {
    title: input.title,
    content: input.content,
    category: input.category || 'Story',
    tripId: input.tripId,
    images: input.imageUrl ? [input.imageUrl] : undefined,
    tags: input.tags?.length ? JSON.stringify(input.tags) : undefined,
  });
  return (data?.data ?? data) as CommunityPost;
}

/** Toggle like on a post/comment. Returns the updated likes array. */
export async function toggleLike(targetId: string, targetType = 'post'): Promise<string[]> {
  const { data } = await api.post('/community/like', { targetId, targetType });
  return (data?.data?.likes ?? []) as string[];
}

export async function addComment(postId: string, content: string): Promise<Comment> {
  const { data } = await api.post('/community/comments', { postId, content });
  return (data?.data ?? data) as Comment;
}

export async function getEvents(): Promise<CommunityEvent[]> {
  const { data } = await api.get('/community/events');
  return (data?.data ?? []) as CommunityEvent[];
}

export async function getStories(): Promise<Story[]> {
  const { data } = await api.get('/community/stories');
  return (data?.data ?? []) as Story[];
}

export async function getGroups(): Promise<Group[]> {
  const { data } = await api.get('/community/groups');
  return (data?.groups ?? data?.data ?? []) as Group[];
}

export async function getMyGroups(): Promise<Group[]> {
  const { data } = await api.get('/community/groups/my');
  return (data?.groups ?? data?.data ?? []) as Group[];
}

export async function getGroupById(id: string): Promise<Group | null> {
  const { data } = await api.get(`/community/groups/${id}`);
  return (data?.group ?? data?.data ?? null) as Group | null;
}

export async function joinGroup(groupId: string): Promise<void> {
  await api.post(`/community/groups/join/${groupId}`);
}

export async function toggleFollow(targetFirebaseUid: string): Promise<void> {
  await api.post('/community/follow', { targetFirebaseUid });
}

export interface PublicProfile {
  profile: {
    firebaseUid: string;
    username?: string;
    fullname?: string;
    profilepicture?: string;
    bio?: string;
    coverImage?: string;
    country?: string;
    followersCount?: number;
    followingCount?: number;
    isFollowing?: boolean;
    createdAt?: string;
  };
  activity: { posts?: CommunityPost[]; stories?: any[]; savedPlans?: any[] };
}

/** Public profile + activity of any traveler by their Firebase UID. */
export async function getPublicProfile(firebaseUid: string): Promise<PublicProfile> {
  const { data } = await api.get(`/community/profile/${firebaseUid}`);
  return (data?.data ?? data) as PublicProfile;
}
