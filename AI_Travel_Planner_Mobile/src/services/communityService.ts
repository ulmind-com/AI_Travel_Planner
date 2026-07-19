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
  appendIf(form, 'tags', input.tags);
  (input.images ?? []).forEach(img => form.append('images', img as any));
  const { data } = await api.post('/community/posts', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
  return (data?.data ?? []) as Group[];
}

export async function getMyGroups(): Promise<Group[]> {
  const { data } = await api.get('/community/groups/my');
  return (data?.data ?? []) as Group[];
}

export async function joinGroup(groupId: string): Promise<void> {
  await api.post(`/community/groups/join/${groupId}`);
}

export async function toggleFollow(targetFirebaseUid: string): Promise<void> {
  await api.post('/community/follow', { targetFirebaseUid });
}
