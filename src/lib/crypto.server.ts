/** AES-GCM encryption for stored third-party secrets (AI keys, MCP connection tokens). WebCrypto only — runs on Workers. */
const enc = new TextEncoder();
const dec = new TextDecoder();

let keyPromise: Promise<CryptoKey> | undefined;
function key() {
  if (!keyPromise) {
    const secret = process.env['AGATA_ENCRYPTION_KEY'];
    if (!secret) throw new Error('Encryption is not configured.');
    keyPromise = crypto.subtle.digest('SHA-256', enc.encode(secret)).then(raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']));
  }
  return keyPromise;
}

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function encryptSecret(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(), enc.encode(plain)));
  return `v1.${b64(iv)}.${b64(ct)}`;
}

export async function decryptSecret(stored: string) {
  const [v, iv, ct] = stored.split('.');
  if (v !== 'v1' || !iv || !ct) throw new Error('Unreadable secret.');
  return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await key(), unb64(ct)));
}

export async function sha256Hex(s: string) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  return [...h].map(b => b.toString(16).padStart(2, '0')).join('');
}

export const hint = (s: string) => `…${s.slice(-4)}`;
