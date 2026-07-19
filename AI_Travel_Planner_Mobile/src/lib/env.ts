/**
 * Runtime configuration.
 *
 * API_BASE_URL points at the deployed backend. During local development
 * against a simulator/emulator, use your machine's LAN IP (not localhost),
 * e.g. http://192.168.1.5:8080. It will be swapped for the real deployed
 * Render/Railway URL once the backend is live.
 */

// Live deployed backend (Render).
export const API_BASE_URL = 'https://ai-travel-planner-0ddm.onrender.com';

/** All backend routes are namespaced under /api/v1 */
export const API_PREFIX = '/api/v1';

/** Firebase Web SDK config (public client config — safe to ship). */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBWMVnaXn2gn8_qpqhrS4EGgOks-tQPlL8',
  authDomain: 'adventurenexus-2d97a.firebaseapp.com',
  projectId: 'adventurenexus-2d97a',
  storageBucket: 'adventurenexus-2d97a.firebasestorage.app',
  messagingSenderId: '42855451170',
  appId: '1:42855451170:web:414f13fe6db65f0395587b',
};
