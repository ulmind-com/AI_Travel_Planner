/**
 * Axios instance for the AI Travel Planner backend.
 *
 * - baseURL = API_BASE_URL + /api/v1
 * - Attaches the current Firebase ID token as `Authorization: Bearer <token>`
 *   on every request (refreshed automatically by the SDK).
 * - Normalizes error messages for the UI.
 */
import axios, { AxiosError, AxiosInstance } from 'axios';
import { auth } from './firebase';
import { API_BASE_URL, API_PREFIX } from './env';

export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async config => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token refresh failed — request proceeds unauthenticated; server 401s.
    }
  }
  return config;
});

/** Extract a human-friendly message from an axios error. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const err = error as AxiosError<any>;
  if (err?.response?.data) {
    const data = err.response.data;
    if (typeof data === 'string') return data;
    return data.message || data.error || data.msg || fallback;
  }
  if (err?.message === 'Network Error') return 'No internet connection. Please try again.';
  return err?.message || fallback;
}

export default api;
