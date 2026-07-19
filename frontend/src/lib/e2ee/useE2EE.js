/**
 * ═══════════════════════════════════════════════════════════════
 * AdventureNexus E2EE React Hook
 * ═══════════════════════════════════════════════════════════════
 * 
 * React hook that manages the full E2EE lifecycle:
 * 1. Key generation on first use
 * 2. Public key upload to server
 * 3. Fetching recipient public keys
 * 4. Encrypt before send
 * 5. Decrypt on receive
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateKeyPair, encryptMessage, decryptMessage } from './cryptoEngine';
import { storeKeyPair, getKeyPair, hasKeyPair, cachePublicKey, getCachedPublicKey } from './keyManager';
import { communityService } from '@/services/communityService';

/**
 * Hook to manage E2EE for a chat conversation.
 * 
 * @param {string} firebaseUid - Current user's Firebase UID
 * @param {Function} getToken - Firebase's getToken function
 * @returns {Object} E2EE utilities
 */
export const useE2EE = (firebaseUid, getToken) => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const keysRef = useRef(null);

    const resetE2EE = useCallback(async () => {
        if (!firebaseUid) return false;
        try {
            setIsReady(false);
            // 1. Delete key pair from IndexedDB
            await deleteKeyPair(firebaseUid);
            keysRef.current = null;

            // 2. Generate new key pair
            const newKeys = generateKeyPair();

            // 3. Store new key pair in IndexedDB
            await storeKeyPair(firebaseUid, newKeys.publicKey, newKeys.secretKey);
            keysRef.current = newKeys;

            // 4. Upload new public key to server
            const token = await getToken();
            await communityService.uploadPublicKey(newKeys.publicKey, token);
            console.log('[E2EE] Key pair successfully regenerated and uploaded to server!');

            setIsReady(true);
            toast.success("E2EE keys regenerated. New messages will be secure!");
            return true;
        } catch (err) {
            console.error('[E2EE] Reset E2EE error:', err);
            setError('Failed to reset encryption keys');
            toast.error("Failed to reset encryption keys.");
            return false;
        }
    }, [firebaseUid, getToken]);

    // ──────────────────────────────────────
    // INITIALIZATION: Generate + Upload + Sync Keys
    // ──────────────────────────────────────

    useEffect(() => {
        if (!firebaseUid) return;

        const initializeKeys = async () => {
            try {
                // Check if keys already exist in IndexedDB
                const existingKeys = await getKeyPair(firebaseUid);

                if (existingKeys) {
                    keysRef.current = existingKeys;
                    setIsReady(true);
                    
                    // Verify that the server has our correct public key
                    try {
                        const token = await getToken();
                        const res = await communityService.getPublicKey(firebaseUid, token);
                        if (!res.success || res.data?.e2eePublicKey !== existingKeys.publicKey) {
                            console.log('[E2EE] Server public key missing or mismatched. Uploading/Syncing...');
                            await communityService.uploadPublicKey(existingKeys.publicKey, token);
                            console.log('[E2EE] Server public key synced successfully.');
                        }
                    } catch (syncErr) {
                        console.warn('[E2EE] Failed to verify public key with server:', syncErr.message);
                    }
                    return;
                }

                // First time — generate new key pair
                const newKeys = generateKeyPair();

                // Store secret key securely in IndexedDB
                await storeKeyPair(firebaseUid, newKeys.publicKey, newKeys.secretKey);
                keysRef.current = newKeys;

                // Upload public key to server
                try {
                    const token = await getToken();
                    await communityService.uploadPublicKey(newKeys.publicKey, token);
                    console.log('[E2EE] Key pair generated and public key uploaded');
                } catch (uploadErr) {
                    console.warn('[E2EE] Failed to upload public key, will retry on next message:', uploadErr.message);
                }

                setIsReady(true);
            } catch (err) {
                console.error('[E2EE] Initialization error:', err);
                setError('Failed to initialize encryption');
            }
        };

        initializeKeys();
    }, [firebaseUid, getToken]);

    // ──────────────────────────────────────
    // FETCH RECIPIENT PUBLIC KEY
    // ──────────────────────────────────────

    const getRecipientPublicKey = useCallback(async (recipientFirebaseUid) => {
        // Check in-memory cache first
        const cached = getCachedPublicKey(recipientFirebaseUid);
        if (cached) return cached;

        // Fetch from server
        try {
            const token = await getToken();
            const res = await communityService.getPublicKey(recipientFirebaseUid, token);
            if (res.success && res.data?.e2eePublicKey) {
                cachePublicKey(recipientFirebaseUid, res.data.e2eePublicKey);
                return res.data.e2eePublicKey;
            }
        } catch (err) {
            console.error('[E2EE] Failed to fetch recipient public key:', err.message);
        }
        return null;
    }, [getToken]);

    // ──────────────────────────────────────
    // ENCRYPT A MESSAGE
    // ──────────────────────────────────────

    const encrypt = useCallback(async (plaintext, recipientFirebaseUid) => {
        if (!keysRef.current) {
            console.error('[E2EE] Keys not initialized');
            return null;
        }

        const recipientPublicKey = await getRecipientPublicKey(recipientFirebaseUid);
        if (!recipientPublicKey) {
            console.warn('[E2EE] Recipient has no public key — sending unencrypted');
            return { content: plaintext, isEncrypted: false };
        }

        try {
            const { encryptedContent, nonce } = encryptMessage(
                plaintext,
                recipientPublicKey,
                keysRef.current.secretKey
            );

            return {
                content: encryptedContent,
                nonce,
                isEncrypted: true,
            };
        } catch (err) {
            console.error('[E2EE] Encryption failed, falling back to plaintext:', err);
            return { content: plaintext, isEncrypted: false };
        }
    }, [getRecipientPublicKey]);

    // ──────────────────────────────────────
    // DECRYPT A MESSAGE
    // ──────────────────────────────────────

    const decrypt = useCallback(async (message) => {
        // If the message is not encrypted, return as-is
        if (!message.isEncrypted) {
            return message.content;
        }

        if (!keysRef.current) {
            return '🔒 Cannot decrypt — keys not loaded';
        }

        // Determine who the "other party" is for decryption
        const senderFirebaseUid = message.senderFirebaseUid;
        const isMine = senderFirebaseUid === firebaseUid;

        // For messages I sent: I need the recipient's public key (to recreate the shared secret)
        // For messages I received: I need the sender's public key
        let otherPartyPublicKey;

        if (isMine) {
            // I sent this — I need the recipient's public key to recreate the box
            // But wait: NaCl box is asymmetric. I encrypted with THEIR pubkey + MY secretkey.
            // To decrypt my OWN sent message, I'd need to have stored it differently.
            // Solution: For sent messages, we store the plaintext content locally or 
            // encrypt a copy for ourselves.
            // 
            // For now, we store the plaintext for our own messages at send time in the 
            // message object's _decryptedContent field.
            if (message._decryptedContent) {
                return message._decryptedContent;
            }
            // If we don't have the cached plaintext, try decrypting with recipient's key
            otherPartyPublicKey = await getRecipientPublicKey(message._recipientFirebaseUid || '');
        } else {
            otherPartyPublicKey = await getRecipientPublicKey(senderFirebaseUid);
        }

        if (!otherPartyPublicKey) {
            return '🔒 Cannot decrypt — missing sender key';
        }

        try {
            const decrypted = decryptMessage(
                message.content,
                message.nonce,
                otherPartyPublicKey,
                keysRef.current.secretKey
            );

            if (decrypted === null) {
                return '🔒 Cannot decrypt this message';
            }

            return decrypted;
        } catch (err) {
            console.error('[E2EE] Decryption error:', err);
            return '🔒 Decryption failed';
        }
    }, [firebaseUid, getRecipientPublicKey]);

    // ──────────────────────────────────────
    // DECRYPT BATCH (for message history)
    // ──────────────────────────────────────

    const decryptBatch = useCallback(async (messages) => {
        return Promise.all(
            messages.map(async (msg) => {
                if (!msg) return msg;
                const decryptedContent = await decrypt(msg);
                return { ...msg, _displayContent: decryptedContent };
            })
        );
    }, [decrypt]);

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
