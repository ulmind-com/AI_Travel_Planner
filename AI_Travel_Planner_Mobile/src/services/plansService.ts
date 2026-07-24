import api from '../lib/api';
import type { Plan, PlanSearchInput } from '../types/plan';

/**
 * Generate AI travel plans for the given search input.
 * Uses a long timeout: AI generation + per-plan image fetching, plus a Render
 * cold start, can take well over the default 20s.
 */
export async function searchDestination(input: PlanSearchInput): Promise<Plan[]> {
  const { data } = await api.post('/plans/search/destination', input, { timeout: 120000 });
  return (data?.data ?? []) as Plan[];
}

/** Fetch the authenticated user's saved/generated plans (newest first). */
export async function getMyPlans(): Promise<Plan[]> {
  const { data } = await api.get('/plans/my-plans');
  return (data?.data ?? []) as Plan[];
}

/** Personalized AI recommendations (falls back to latest community plans). */
export async function getRecommendations(): Promise<Plan[]> {
  const { data } = await api.get('/plans/recommendations');
  return (data?.data ?? []) as Plan[];
}

/** Fetch a single plan by id (public/shared). */
export async function getPlanById(id: string): Promise<Plan | null> {
  const { data } = await api.get(`/plans/public/${id}`);
  return (data?.data ?? data ?? null) as Plan | null;
}

/**
 * Saved / favorite trips use the liked-plans system (user.likedPlans), which
 * has a proper GET that returns the full plan objects — unlike /plans/:id/save.
 */
export async function getSavedPlans(): Promise<Plan[]> {
  const { data } = await api.get('/liked-plans');
  return (data?.likedPlans ?? data?.data ?? []) as Plan[];
}

export async function savePlan(planId: string): Promise<void> {
  await api.post(`/liked-plans/${planId}`);
}

export async function unsavePlan(planId: string): Promise<void> {
  await api.delete(`/liked-plans/${planId}`);
}

/** Public: fetch a batch of destination images (Unsplash). */
export async function getDestinationImages(query: string, count = 6): Promise<string[]> {
  const { data } = await api.post('/plans/search/destination-images', { query, count });
  return (data?.data ?? []) as string[];
}
