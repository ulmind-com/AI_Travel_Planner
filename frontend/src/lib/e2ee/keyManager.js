/**
 * ═══════════════════════════════════════════════════════════════
 * AdventureNexus E2EE Key Manager
 * ═══════════════════════════════════════════════════════════════
 * 
 * Securely stores the user's private key in IndexedDB.
 * 
 * WHY IndexedDB and NOT localStorage:
 * - Not accessible via document.cookie XSS vectors
 * - Structured binary storage (not plain strings)
 * - Browser can encrypt at rest
 * - Not included in exports or sync
 * 
 * The private key NEVER leaves the client device.
 * The public key is uploaded to the server for other users to encrypt to.
 */

const DB_NAME = 'NexusE2EE';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

// ──────────────────────────────────────
// IndexedDB Helpers
// ──────────────────────────────────────

/**
 * Open (or create) the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// ──────────────────────────────────────
// KEY STORAGE (Private Key — IndexedDB)
// ──────────────────────────────────────

/**
 * Store the user's E2EE key pair securely in IndexedDB.
 * @param {string} firebaseUid - The user's Firebase UID (used as key)
 * @param {string} publicKey - Base64-encoded public key
 * @param {string} secretKey - Base64-encoded secret key
 */
export const storeKeyPair = async (firebaseUid, publicKey, secretKey) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        store.put({
            id: firebaseUid,
            publicKey,
            secretKey,
            createdAt: new Date().toISOString(),
        });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error('[E2EE KeyManager] Failed to store key pair:', error);
        throw error;
    }
};

/**
 * Retrieve the user's stored key pair from IndexedDB.
 * @param {string} firebaseUid - The user's Firebase UID
 * @returns {Promise<{publicKey: string, secretKey: string}|null>}
 */
export const getKeyPair = async (firebaseUid) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(firebaseUid);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    resolve({
                        publicKey: result.publicKey,
                        secretKey: result.secretKey,
                    });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[E2EE KeyManager] Failed to retrieve key pair:', error);
        return null;
    }
};

/**
 * Get ONLY the secret key for the current user.
 * @param {string} firebaseUid
 * @returns {Promise<string|null>}
 */
export const getSecretKey = async (firebaseUid) => {
    const keyPair = await getKeyPair(firebaseUid);
    return keyPair?.secretKey || null;
};

/**
 * Check if the user already has a stored key pair.
 * @param {string} firebaseUid
 * @returns {Promise<boolean>}
 */
export const hasKeyPair = async (firebaseUid) => {
    const keyPair = await getKeyPair(firebaseUid);
    return !!keyPair;
};

/**
 * Delete the user's key pair (for key rotation or account deletion).
 * @param {string} firebaseUid
 */
export const deleteKeyPair = async (firebaseUid) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(firebaseUid);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error('[E2EE KeyManager] Failed to delete key pair:', error);
        throw error;
    }
};

// ──────────────────────────────────────
// PUBLIC KEY CACHE (In-Memory)
// ──────────────────────────────────────

// Cache other users' public keys in memory to avoid repeated API calls
const publicKeyCache = new Map();

/**
 * Cache a user's public key (fetched from server).
 * @param {string} firebaseUid
 * @param {string} publicKey - Base64-encoded public key
 */
export const cachePublicKey = (firebaseUid, publicKey) => {
    publicKeyCache.set(firebaseUid, publicKey);
};

/**
 * Get a cached public key.
 * @param {string} firebaseUid
 * @returns {string|null}
 */
export const getCachedPublicKey = (firebaseUid) => {
    return publicKeyCache.get(firebaseUid) || null;
};

/**
 * Clear the entire public key cache.
 */
export const clearPublicKeyCache = () => {
    publicKeyCache.clear();
};
