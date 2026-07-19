/**
 * Firebase initialization for React Native.
 *
 * Uses the Firebase JS SDK with AsyncStorage-backed persistence so the user
 * stays signed in across app restarts. The backend verifies the Firebase ID
 * token via its `verifyFirebaseToken` middleware, so all we do client-side is
 * authenticate and forward the token as a Bearer header (see lib/api.ts).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  // @ts-ignore - getReactNativePersistence is exported from firebase/auth in RN
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { FIREBASE_CONFIG } from './env';

const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized (e.g. Fast Refresh) — reuse the existing instance.
  auth = getAuth(app);
}

export { app, auth };
