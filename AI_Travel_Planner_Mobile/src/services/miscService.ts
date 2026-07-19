import api from '../lib/api';

/** Live travel intelligence (advisories, weather, safety, tips). */
export async function getTravelIntel(destination?: string): Promise<any> {
  const { data } = await api.get('/travel/intel', {
    params: destination ? { destination } : undefined,
  });
  return data?.data ?? data;
}

/** Generic bookings (hotel/plan) for the user. */
export async function getMyBookings(): Promise<any[]> {
  const { data } = await api.get('/bookings/my');
  return (data?.data ?? data ?? []) as any[];
}

export interface Review {
  _id: string;
  userName?: string;
  userAvatar?: string;
  location?: string;
  rating?: number;
  comment?: string;
  tripType?: string;
  images?: string[];
  likes?: string[];
  createdAt?: string;
}

export async function getReviews(): Promise<Review[]> {
  const { data } = await api.get('/reviews');
  return (data?.data ?? data ?? []) as Review[];
}

export async function createReview(input: {
  userName?: string;
  location?: string;
  rating: number;
  comment: string;
  tripType?: string;
}): Promise<any> {
  const { data } = await api.post('/reviews', input);
  return data;
}
