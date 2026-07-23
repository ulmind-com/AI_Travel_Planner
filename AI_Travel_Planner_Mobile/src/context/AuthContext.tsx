/**
 * Auth context — bridges Firebase Auth with the backend user profile.
 *
 * Flow:
 *  1. Firebase email/password (Google can be added via a native module later).
 *  2. On auth state change, sync/register the user with the backend and load
 *     the profile from GET /users/profile (the backend `protect` middleware
 *     auto-creates the record from the verified token if missing).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import api from '../lib/api';

export interface UserProfile {
  _id?: string;
  firebaseUid?: string;
  email?: string;
  username?: string;
  profileImage?: string;
  role?: string;
  bio?: string;
  [key: string]: any;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean; // initial auth-state resolution
  signUp: (params: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/profile');
      const p = data?.data ?? data?.user ?? data;
      setProfile(p ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  const syncRegister = useCallback(async (u: FirebaseUser) => {
    try {
      await api.post('/users/register', {
        firebaseUid: u.uid,
        email: u.email,
        username: u.displayName || undefined,
        profileImage: u.photoURL || undefined,
      });
    } catch {
      // Non-fatal: `protect` auto-creates on first profile fetch anyway.
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setFirebaseUser(u);
      // Resolve navigation immediately once Firebase restores the session
      // (instant, from AsyncStorage). The backend profile sync happens in the
      // background so a cold/slow API never keeps the user on the splash.
      setIsBootstrapping(false);
      if (u) {
        syncRegister(u)
          .then(() => loadProfile())
          .catch(() => {});
      } else {
        setProfile(null);
      }
    });
    return unsub;
  }, [loadProfile, syncRegister]);

  const signUp = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await fbUpdateProfile(cred.user, { displayName: name.trim() });
      }
      await syncRegister(cred.user);
      await loadProfile();
    },
    [loadProfile, syncRegister],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      isAuthenticated: !!firebaseUser,
      isBootstrapping,
      signUp,
      signIn,
      signOut,
      resetPassword,
      refreshProfile: loadProfile,
    }),
    [firebaseUser, profile, isBootstrapping, signUp, signIn, signOut, resetPassword, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
