/**
 * ═══════════════════════════════════════════════════════════════
 * AdventureNexus E2EE React Hook (React Native)
 * ═══════════════════════════════════════════════════════════════
 *
 * Manages the full E2EE lifecycle, mirroring the website:
 *   1. Key generation on first use
 *   2. Public key upload to server
 *   3. Fetching recipient public keys
 *   4. Encrypt before send
 *   5. Decrypt on receive
 *
 * Token is attached automatically by the axios instance, so the
 * service calls here don't need an explicit token argument.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateKeyPair, encryptMessage, decryptMessage, KeyPair } from './cryptoEngine';
import {
  storeKeyPair,
  getKeyPair,
  deleteKeyPair,
  cachePublicKey,
  getCachedPublicKey,
} from './keyManager';
import { uploadPublicKey, fetchPublicKey } from '../../services/messagingService';
import type { Message } from '../../services/messagingService';

export interface EncryptResult {
  content: string;
  nonce?: string;
  isEncrypted: boolean;
}

/** Message shape the hook can decrypt (adds a couple of client-only hints). */
export type DecryptableMessage = Message & {
  _recipientFirebaseUid?: string;
  _decryptedContent?: string;
};

export const useE2EE = (firebaseUid: string | undefined) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keysRef = useRef<KeyPair | null>(null);

  // ── INITIALIZATION: Generate + Upload + Sync Keys ──
  useEffect(() => {
    if (!firebaseUid) return;
    let cancelled = false;

    const initializeKeys = async () => {
      try {
        const existingKeys = await getKeyPair(firebaseUid);

        if (existingKeys) {
          keysRef.current = existingKeys;
          if (!cancelled) setIsReady(true);

          // Verify the server has our correct public key; sync if needed.
          try {
            const serverKey = await fetchPublicKey(firebaseUid);
            if (serverKey !== existingKeys.publicKey) {
              await uploadPublicKey(existingKeys.publicKey);
            }
          } catch (syncErr) {
            console.warn('[E2EE] Failed to verify public key with server:', syncErr);
          }
          return;
        }

        // First time — generate a new key pair.
        const newKeys = generateKeyPair();
        await storeKeyPair(firebaseUid, newKeys.publicKey, newKeys.secretKey);
        keysRef.current = newKeys;

        try {
          await uploadPublicKey(newKeys.publicKey);
        } catch (uploadErr) {
          console.warn('[E2EE] Failed to upload public key, will retry later:', uploadErr);
        }

        if (!cancelled) setIsReady(true);
      } catch (err) {
        console.error('[E2EE] Initialization error:', err);
        if (!cancelled) setError('Failed to initialize encryption');
      }
    };

    initializeKeys();
    return () => {
      cancelled = true;
    };
  }, [firebaseUid]);

  // ── FETCH RECIPIENT PUBLIC KEY (cached) ──
  const getRecipientPublicKey = useCallback(async (recipientFirebaseUid: string): Promise<string | null> => {
    if (!recipientFirebaseUid) return null;
    const cached = getCachedPublicKey(recipientFirebaseUid);
    if (cached) return cached;

    try {
      const key = await fetchPublicKey(recipientFirebaseUid);
      if (key) {
        cachePublicKey(recipientFirebaseUid, key);
        return key;
      }
    } catch (err) {
      console.error('[E2EE] Failed to fetch recipient public key:', err);
    }
    return null;
  }, []);

  // ── ENCRYPT ──
  const encrypt = useCallback(
    async (plaintext: string, recipientFirebaseUid: string): Promise<EncryptResult> => {
      if (!keysRef.current) {
        return { content: plaintext, isEncrypted: false };
      }

      const recipientPublicKey = await getRecipientPublicKey(recipientFirebaseUid);
      if (!recipientPublicKey) {
        // Recipient has no key yet — send unencrypted (web does the same).
        return { content: plaintext, isEncrypted: false };
      }

      try {
        const { encryptedContent, nonce } = encryptMessage(
          plaintext,
          recipientPublicKey,
          keysRef.current.secretKey,
        );
        return { content: encryptedContent, nonce, isEncrypted: true };
      } catch (err) {
        console.error('[E2EE] Encryption failed, falling back to plaintext:', err);
        return { content: plaintext, isEncrypted: false };
      }
    },
    [getRecipientPublicKey],
  );

  // ── DECRYPT ──
  const decrypt = useCallback(
    async (message: DecryptableMessage): Promise<string> => {
      if (!message.isEncrypted) {
        return message.content;
      }
      if (!keysRef.current) {
        return '🔒 Cannot decrypt — keys not loaded';
      }

      const senderFirebaseUid = message.senderFirebaseUid;
      const isMine = senderFirebaseUid === firebaseUid;

      let otherPartyPublicKey: string | null;

      if (isMine) {
        // For our own sent messages we keep the plaintext locally at send time.
        if (message._decryptedContent) return message._decryptedContent;
        otherPartyPublicKey = await getRecipientPublicKey(message._recipientFirebaseUid || '');
      } else {
        otherPartyPublicKey = await getRecipientPublicKey(senderFirebaseUid || '');
      }

      if (!otherPartyPublicKey) {
        return '🔒 Cannot decrypt — missing sender key';
      }

      try {
        const decrypted = decryptMessage(
          message.content,
          message.nonce || '',
          otherPartyPublicKey,
          keysRef.current.secretKey,
        );
        return decrypted === null ? '🔒 Cannot decrypt this message' : decrypted;
      } catch (err) {
        console.error('[E2EE] Decryption error:', err);
        return '🔒 Decryption failed';
      }
    },
    [firebaseUid, getRecipientPublicKey],
  );

  // ── DECRYPT BATCH (message history) ──
  const decryptBatch = useCallback(
    async (messages: DecryptableMessage[]): Promise<DecryptableMessage[]> => {
      return Promise.all(
        messages.map(async (msg) => {
          if (!msg) return msg;
          const decryptedContent = await decrypt(msg);
          return { ...msg, _displayContent: decryptedContent };
        }),
      );
    },
    [decrypt],
  );

  // ── RESET (key rotation) ──
  const resetE2EE = useCallback(async (): Promise<boolean> => {
    if (!firebaseUid) return false;
    try {
      setIsReady(false);
      await deleteKeyPair(firebaseUid);
      keysRef.current = null;

      const newKeys = generateKeyPair();
      await storeKeyPair(firebaseUid, newKeys.publicKey, newKeys.secretKey);
      keysRef.current = newKeys;

      await uploadPublicKey(newKeys.publicKey);
      setIsReady(true);
      return true;
    } catch (err) {
      console.error('[E2EE] Reset error:', err);
      setError('Failed to reset encryption keys');
      return false;
    }
  }, [firebaseUid]);

  return {
    isReady,
    error,
    encrypt,
    decrypt,
    decryptBatch,
    getRecipientPublicKey,
    resetE2EE,
    myPublicKey: keysRef.current?.publicKey || null,
  };
};
