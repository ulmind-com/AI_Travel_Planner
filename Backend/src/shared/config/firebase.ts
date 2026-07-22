import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') }); // Ensure path to .env is correct depending on deployment

/**
 * Normalize a service-account private key coming from an environment variable.
 * Hosting dashboards mangle these in a few predictable ways, so accept them all:
 *  - wrapped in single/double quotes
 *  - literal "\n" sequences instead of real newlines
 *  - escaped "\\n"
 *  - base64 of the whole PEM (set FIREBASE_PRIVATE_KEY_BASE64 instead)
 */
function normalizePrivateKey(raw?: string): string | undefined {
    if (!raw) return undefined;
    let key = raw.trim();

    // Strip a single layer of wrapping quotes (common copy/paste artifact).
    if (
        (key.startsWith('"') && key.endsWith('"')) ||
        (key.startsWith("'") && key.endsWith("'"))
    ) {
        key = key.slice(1, -1);
    }

    // Turn literal \n (and double-escaped \\n) into real newlines.
    key = key.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');

    return key.trim();
}

function readPrivateKey(): string | undefined {
    const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    if (b64 && b64.trim()) {
        try {
            return normalizePrivateKey(Buffer.from(b64.trim(), 'base64').toString('utf8'));
        } catch {
            console.error('❌ FIREBASE_PRIVATE_KEY_BASE64 is not valid base64.');
        }
    }
    return normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
}

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey = readPrivateKey();

// --- Explicit, actionable diagnostics (no secrets are printed) ---
const problems: string[] = [];
if (!projectId) problems.push('FIREBASE_PROJECT_ID is missing');
if (!clientEmail) problems.push('FIREBASE_CLIENT_EMAIL is missing');
if (!privateKey) {
    problems.push('FIREBASE_PRIVATE_KEY (or FIREBASE_PRIVATE_KEY_BASE64) is missing');
} else {
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        problems.push(
            'FIREBASE_PRIVATE_KEY does not contain "-----BEGIN PRIVATE KEY-----" — check for missing/extra quotes'
        );
    }
    if (!privateKey.includes('\n')) {
        problems.push(
            'FIREBASE_PRIVATE_KEY has no newlines — paste it with real line breaks or literal \\n sequences'
        );
    }
}

try {
    if (!admin.apps.length) {
        if (problems.length) {
            console.error(
                '❌ Firebase Admin NOT initialized. Fix these environment variables:\n  - ' +
                    problems.join('\n  - ')
            );
        } else {
            admin.initializeApp({
                credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
            });
            console.log(`✅ Firebase Admin initialized for project "${projectId}".`);
        }
    }
} catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
}

export default admin;
