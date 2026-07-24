import api from '../lib/api';

/** Subscribe an email to the daily travel newsletter (POST /mail/subscribe). */
export async function subscribeNewsletter(email: string): Promise<void> {
  await api.post('/mail/subscribe', { email });
}

export interface TravelIntel {
  weather?: { temp?: number; rain?: number; wind?: number; uv?: number; humidity?: number; description?: string };
  crowdLevel?: string;
  bestTimeToday?: string;
  riskLevel?: string;
  recommendations?: string[];
  riskDetails?: { level?: string; reasons?: string[]; alerts?: any[] };
  [key: string]: any;
}

/** Live travel intelligence (weather, crowd, risk, best time, tips) for a location. */
export async function getTravelIntel(location: string): Promise<TravelIntel> {
  const { data } = await api.get('/travel/intel', { params: { location }, timeout: 45000 });
  return (data?.data ?? data) as TravelIntel;
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
