/**
 * ═══════════════════════════════════════════════════════════════
 * AdventureNexus E2EE Crypto Engine (React Native)
 * ═══════════════════════════════════════════════════════════════
 *
 * Mirrors the website's crypto engine exactly so messages are
 * cross-compatible between web and mobile.
 *
 * Uses NaCl Box (X25519 + XSalsa20-Poly1305) — the same primitives
 * used by Signal, WhatsApp, and Keybase.
 *
 * The server NEVER sees plaintext. Only ciphertext + nonce are stored.
 *
 * NOTE: React Native has no `window.crypto.getRandomValues`, so we wire
 * tweetnacl's PRNG to expo-crypto's synchronous secure RNG.
 */

import './base64Polyfill'; // must run before tweetnacl-util uses btoa/atob
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import * as Crypto from 'expo-crypto';

// ──────────────────────────────────────
// Secure PRNG for tweetnacl (RN has no crypto.getRandomValues)
// ──────────────────────────────────────
nacl.setPRNG((x: Uint8Array, n: number) => {
  const bytes = Crypto.getRandomBytes(n);
  for (let i = 0; i < n; i++) x[i] = bytes[i];
});

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

// ──────────────────────────────────────
// KEY PAIR GENERATION
// ──────────────────────────────────────

/** Generate a new NaCl box key pair (X25519). Returns base64-encoded keys. */
export const generateKeyPair = (): KeyPair => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    secretKey: naclUtil.encodeBase64(keyPair.secretKey),
  };
};

// ──────────────────────────────────────
// ENCRYPTION
// ──────────────────────────────────────

export interface EncryptedPayload {
  encryptedContent: string;
  nonce: string;
}

/**
 * Encrypt a plaintext message for a specific recipient.
 * Sender's secret key + Receiver's public key → shared secret.
 */
export const encryptMessage = (
  plaintext: string,
  receiverPublicKeyBase64: string,
  senderSecretKeyBase64: string,
): EncryptedPayload => {
  try {
    const messageBytes = naclUtil.decodeUTF8(plaintext);
    const nonce = nacl.randomBytes(nacl.box.nonceLength); // 24 bytes
    const receiverPublicKey = naclUtil.decodeBase64(receiverPublicKeyBase64);
    const senderSecretKey = naclUtil.decodeBase64(senderSecretKeyBase64);

    const encrypted = nacl.box(messageBytes, nonce, receiverPublicKey, senderSecretKey);

    if (!encrypted) {
      throw new Error('Encryption failed — nacl.box returned null');
    }

    return {
      encryptedContent: naclUtil.encodeBase64(encrypted),
      nonce: naclUtil.encodeBase64(nonce),
    };
  } catch (error) {
    console.error('[E2EE] Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

// ──────────────────────────────────────
// DECRYPTION
// ──────────────────────────────────────

/** Decrypt an encrypted message from a specific sender. Returns plaintext or null. */
export const decryptMessage = (
  encryptedContentBase64: string,
  nonceBase64: string,
  senderPublicKeyBase64: string,
  receiverSecretKeyBase64: string,
): string | null => {
  try {
    const encryptedBytes = naclUtil.decodeBase64(encryptedContentBase64);
    const nonceBytes = naclUtil.decodeBase64(nonceBase64);
    const senderPublicKey = naclUtil.decodeBase64(senderPublicKeyBase64);
    const receiverSecretKey = naclUtil.decodeBase64(receiverSecretKeyBase64);

    const decrypted = nacl.box.open(encryptedBytes, nonceBytes, senderPublicKey, receiverSecretKey);

    if (!decrypted) {
      // MAC verification failed — tampered or wrong keys.
      console.warn('[E2EE] Decryption failed — authentication error');
      return null;
    }

    return naclUtil.encodeUTF8(decrypted);
  } catch (error) {
    console.error('[E2EE] Decryption error:', error);
    return null;
  }
};
