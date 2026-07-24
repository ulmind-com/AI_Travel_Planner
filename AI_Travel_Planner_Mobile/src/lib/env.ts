/**
 * Runtime configuration.
 *
 * API_BASE_URL points at the deployed backend. During local development
 * against a simulator/emulator, use your machine's LAN IP (not localhost),
 * e.g. http://192.168.1.5:8080. It will be swapped for the real deployed
 * Render/Railway URL once the backend is live.
 */

// Live deployed backend (Render).
export const API_BASE_URL = 'https://ai-travel-planner-5tp6.onrender.com';

/** All backend routes are namespaced under /api/v1 */
export const API_PREFIX = '/api/v1';

/** Firebase Web SDK config (public client config — safe to ship). */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCAraMVT1cr05Jhq8F7jhRdmZ-lxvGZtHo',
  authDomain: 'ai-travel-planner-d392a.firebaseapp.com',
  projectId: 'ai-travel-planner-d392a',
  storageBucket: 'ai-travel-planner-d392a.firebasestorage.app',
  messagingSenderId: '571075770817',
  appId: '1:571075770817:web:d25921e0accf315e6bd740',
};
