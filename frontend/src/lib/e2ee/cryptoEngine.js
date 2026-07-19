/**
 * ═══════════════════════════════════════════════════════════════
 * AdventureNexus E2EE Crypto Engine
 * ═══════════════════════════════════════════════════════════════
 * 
 * Uses NaCl Box (X25519 + XSalsa20-Poly1305) — the same crypto
 * primitives used by Signal Protocol, WhatsApp, and Keybase.
 * 
 * - X25519: Elliptic-curve Diffie-Hellman key agreement
 * - XSalsa20: Stream cipher for encryption
 * - Poly1305: MAC for authentication & integrity
 * 
 * The server NEVER sees plaintext. Only ciphertext + nonce are stored.
 */

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

// ──────────────────────────────────────
// KEY PAIR GENERATION
// ──────────────────────────────────────

/**
 * Generate a new NaCl box key pair (X25519).
 * @returns {{ publicKey: string, secretKey: string }} Base64-encoded keys
 */
export const generateKeyPair = () => {
    const keyPair = nacl.box.keyPair();
    return {
        publicKey: naclUtil.encodeBase64(keyPair.publicKey),
        secretKey: naclUtil.encodeBase64(keyPair.secretKey),
    };
};

// ──────────────────────────────────────
// ENCRYPTION
// ──────────────────────────────────────

/**
 * Encrypt a plaintext message for a specific recipient.
 * 
 * Uses NaCl authenticated encryption (box):
 * - Sender's secret key + Receiver's public key → shared secret
 * - XSalsa20 stream cipher + Poly1305 MAC
 * 
 * @param {string} plaintext - The message to encrypt
 * @param {string} receiverPublicKeyBase64 - Recipient's public key (base64)
 * @param {string} senderSecretKeyBase64 - Sender's secret key (base64)
 * @returns {{ encryptedContent: string, nonce: string }} Base64-encoded ciphertext and nonce
 */
export const encryptMessage = (plaintext, receiverPublicKeyBase64, senderSecretKeyBase64) => {
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

/**
 * Decrypt an encrypted message from a specific sender.
 * 
 * @param {string} encryptedContentBase64 - The ciphertext (base64)
 * @param {string} nonceBase64 - The nonce used during encryption (base64)
 * @param {string} senderPublicKeyBase64 - Sender's public key (base64)
 * @param {string} receiverSecretKeyBase64 - Receiver's own secret key (base64)
 * @returns {string|null} Decrypted plaintext, or null if decryption fails
 */
export const decryptMessage = (encryptedContentBase64, nonceBase64, senderPublicKeyBase64, receiverSecretKeyBase64) => {
    try {
        const encryptedBytes = naclUtil.decodeBase64(encryptedContentBase64);
        const nonceBytes = naclUtil.decodeBase64(nonceBase64);
        const senderPublicKey = naclUtil.decodeBase64(senderPublicKeyBase64);
        const receiverSecretKey = naclUtil.decodeBase64(receiverSecretKeyBase64);

        const decrypted = nacl.box.open(encryptedBytes, nonceBytes, senderPublicKey, receiverSecretKey);

        if (!decrypted) {
            // This means the MAC verification failed — message was tampered with,
            // or the wrong keys were used.
            console.warn('[E2EE] Decryption failed — authentication error (tampered or wrong keys)');
            return null;
        }

        return naclUtil.encodeUTF8(decrypted);
    } catch (error) {
        console.error('[E2EE] Decryption error:', error);
        return null;
    }
};

// ──────────────────────────────────────
// GROUP ENCRYPTION (Per-Member)
// ──────────────────────────────────────

/**
 * Encrypt a message for multiple group members.
 * Each member gets their own encrypted copy (per-member encryption).
 * 
 * @param {string} plaintext - The message to encrypt
 * @param {Array<{firebaseUid: string, publicKey: string}>} members - Group members with public keys
 * @param {string} senderSecretKeyBase64 - Sender's secret key
 * @param {string} senderFirebaseUid - Sender's firebase user ID (to skip self-encryption)
 * @returns {Array<{recipientId: string, encryptedContent: string, nonce: string}>}
 */
export const encryptForGroup = (plaintext, members, senderSecretKeyBase64, senderFirebaseUid) => {
    return members
        .filter(m => m.firebaseUid !== senderFirebaseUid && m.publicKey)
        .map(member => {
            const { encryptedContent, nonce } = encryptMessage(
                plaintext,
                member.publicKey,
                senderSecretKeyBase64
            );
            return {
                recipientId: member.firebaseUid,
                encryptedContent,
                nonce,
            };
        });
};

/**
 * Find and decrypt the copy of a group message intended for this user.
 * 
 * @param {Array<{recipientId: string, encryptedContent: string, nonce: string}>} encryptedCopies
 * @param {string} myFirebaseUid - Current user's firebase ID
 * @param {string} senderPublicKeyBase64 - The sender's public key
 * @param {string} mySecretKeyBase64 - Current user's secret key
 * @returns {string|null} Decrypted plaintext
 */
export const decryptFromGroup = (encryptedCopies, myFirebaseUid, senderPublicKeyBase64, mySecretKeyBase64) => {
    const myCopy = encryptedCopies.find(c => c.recipientId === myFirebaseUid);
    if (!myCopy) {
        console.warn('[E2EE] No encrypted copy found for this user in group message');
        return null;
    }
    return decryptMessage(myCopy.encryptedContent, myCopy.nonce, senderPublicKeyBase64, mySecretKeyBase64);
};
