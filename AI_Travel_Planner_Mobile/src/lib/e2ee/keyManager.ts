/**
 * ═══════════════════════════════════════════════════════════════
 * AdventureNexus E2EE Key Manager (React Native)
 * ═══════════════════════════════════════════════════════════════
 *
 * Stores the user's private key in the device secure enclave
 * (iOS Keychain / Android Keystore) via expo-secure-store.
 *
 * The private key NEVER leaves the device.
 * The public key is uploaded to the server for other users to encrypt to.
 *
 * Mirrors the website's keyManager (which uses IndexedDB in the browser).
 */

import * as SecureStore from 'expo-secure-store';
import type { KeyPair } from './cryptoEngine';

// SecureStore keys allow only alphanumerics, ".", "-", "_".
// Firebase UIDs are alphanumeric, so this is safe.
const keyName = (firebaseUid: string) => `e2ee_${firebaseUid}`;

// ──────────────────────────────────────
// KEY STORAGE (Private Key — Secure Enclave)
// ──────────────────────────────────────

/** Store the user's E2EE key pair securely. */
export const storeKeyPair = async (
  firebaseUid: string,
  publicKey: string,
  secretKey: string,
): Promise<boolean> => {
  try {
    const payload = JSON.stringify({ publicKey, secretKey, createdAt: new Date().toISOString() });
    await SecureStore.setItemAsync(keyName(firebaseUid), payload);
    return true;
  } catch (error) {
    console.error('[E2EE KeyManager] Failed to store key pair:', error);
    throw error;
  }
};

/** Retrieve the user's stored key pair. */
export const getKeyPair = async (firebaseUid: string): Promise<KeyPair | null> => {
  try {
    const raw = await SecureStore.getItemAsync(keyName(firebaseUid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.publicKey || !parsed?.secretKey) return null;
    return { publicKey: parsed.publicKey, secretKey: parsed.secretKey };
  } catch (error) {
    console.error('[E2EE KeyManager] Failed to retrieve key pair:', error);
    return null;
  }
};

/** Check if the user already has a stored key pair. */
export const hasKeyPair = async (firebaseUid: string): Promise<boolean> => {
  const keyPair = await getKeyPair(firebaseUid);
  return !!keyPair;
};

/** Delete the user's key pair (for key rotation or account deletion). */
export const deleteKeyPair = async (firebaseUid: string): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(keyName(firebaseUid));
    return true;
  } catch (error) {
    console.error('[E2EE KeyManager] Failed to delete key pair:', error);
    throw error;
  }
};

// ──────────────────────────────────────
// PUBLIC KEY CACHE (In-Memory)
// ──────────────────────────────────────

const publicKeyCache = new Map<string, string>();

export const cachePublicKey = (firebaseUid: string, publicKey: string) => {
  publicKeyCache.set(firebaseUid, publicKey);
};

export const getCachedPublicKey = (firebaseUid: string): string | null => {
  return publicKeyCache.get(firebaseUid) || null;
};

export const clearPublicKeyCache = () => {
  publicKeyCache.clear();
};
