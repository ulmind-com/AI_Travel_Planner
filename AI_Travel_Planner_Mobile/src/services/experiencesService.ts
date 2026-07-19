import api from '../lib/api';
import { appendIf, FilePart } from '../lib/upload';

export interface Experience {
  _id: string;
  firebaseUid?: string;
  userId?: any;
  title?: string;
  description?: string;
  location?: string;
  images?: string[];
  tags?: string[];
  rating?: number;
  estimatedCost?: string;
  currency?: string;
  difficultyLevel?: string;
  crowdType?: string;
  likes?: string[];
  saves?: string[];
  createdAt?: string;
}

export async function getExperienceFeed(): Promise<Experience[]> {
  const { data } = await api.get('/experiences/feed');
  return (data?.data ?? data ?? []) as Experience[];
}

export async function getExperienceById(id: string): Promise<Experience | null> {
  const { data } = await api.get(`/experiences/${id}`);
  return (data?.data ?? data ?? null) as Experience | null;
}

export async function toggleExperienceLike(id: string): Promise<any> {
  const { data } = await api.post(`/experiences/like/${id}`);
  return data;
}

export async function toggleExperienceSave(id: string): Promise<any> {
  const { data } = await api.post(`/experiences/save/${id}`);
  return data;
}

export async function getExperienceComments(postId: string): Promise<any[]> {
  const { data } = await api.get(`/experiences/comments/${postId}`);
  return (data?.data ?? []) as any[];
}

export async function addExperienceComment(postId: string, content: string): Promise<any> {
  const { data } = await api.post('/experiences/comments', { postId, content });
  return data;
}

export async function createExperience(input: {
  title: string;
  description: string;
  location?: string;
  tags?: string;
  rating?: number;
  estimatedCost?: string;
  currency?: string;
  difficultyLevel?: string;
  crowdType?: string;
  images?: FilePart[];
}): Promise<Experience> {
  const form = new FormData();
  appendIf(form, 'title', input.title);
  appendIf(form, 'description', input.description);
  appendIf(form, 'location', input.location);
  appendIf(form, 'tags', input.tags);
  appendIf(form, 'rating', input.rating);
  appendIf(form, 'estimatedCost', input.estimatedCost);
  appendIf(form, 'currency', input.currency);
  appendIf(form, 'difficultyLevel', input.difficultyLevel);
  appendIf(form, 'crowdType', input.crowdType);
  (input.images ?? []).forEach(img => form.append('images', img as any));
  const { data } = await api.post('/experiences/create', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return (data?.data ?? data) as Experience;
}
