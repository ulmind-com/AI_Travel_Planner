/**
 * Minimal, correct base64 polyfill for React Native / Hermes.
 *
 * tweetnacl-util's encodeBase64/decodeBase64 rely on global `btoa`/`atob`,
 * which Hermes does not guarantee. This installs pure-JS implementations
 * when they're missing, so E2EE encoding is deterministic across engines.
 *
 * Import this BEFORE tweetnacl-util is used (it is imported at the top of
 * cryptoEngine.ts).
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const g = globalThis as any;

if (typeof g.btoa === 'undefined') {
  g.btoa = (input: string): string => {
    let output = '';
    let i = 0;
    while (i < input.length) {
      const c1 = input.charCodeAt(i++);
      const c2 = input.charCodeAt(i++);
      const c3 = input.charCodeAt(i++);

      const e1 = c1 >> 2;
      const e2 = ((c1 & 3) << 4) | (c2 >> 4);
      let e3 = ((c2 & 15) << 2) | (c3 >> 6);
      let e4 = c3 & 63;

      if (isNaN(c2)) {
        e3 = 64;
        e4 = 64;
      } else if (isNaN(c3)) {
        e4 = 64;
      }

      output +=
        CHARS.charAt(e1) +
        CHARS.charAt(e2) +
        (e3 === 64 ? '=' : CHARS.charAt(e3)) +
        (e4 === 64 ? '=' : CHARS.charAt(e4));
    }
    return output;
  };
}

if (typeof g.atob === 'undefined') {
  g.atob = (input: string): string => {
    const str = input.replace(/=+$/, '');
    let output = '';
    if (str.length % 4 === 1) {
      throw new Error("'atob' failed: invalid base64 string.");
    }
    let bc = 0;
    let bs = 0;
    for (let i = 0; i < str.length; i++) {
      const idx = CHARS.indexOf(str.charAt(i));
      if (idx === -1) continue;
      bs = bc % 4 ? bs * 64 + idx : idx;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
    return output;
  };
}

export {};
