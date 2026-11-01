/** Live sync with a desktop Obsidian vault through the "Local REST API" community plugin. Settings stay on this device. */
export type ObsidianSettings = { url: string; key: string; folder?: string };
const KEY = 'agata-obsidian';

export function loadObsidian(): ObsidianSettings | null {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return v?.url && v?.key ? v : null; } catch { return null; }
}
export function saveObsidian(s: ObsidianSettings | null) {
  if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY);
}

const enc = (p: string) => p.split('/').map(encodeURIComponent).join('/');

async function call(s: ObsidianSettings, path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(s.url.replace(/\/+$/, '') + path, { ...init, headers: { Authorization: `Bearer ${s.key}`, ...init?.headers } });
  } catch {
    throw new Error('Could not reach Obsidian. Is it open with the Local REST API plugin enabled? For the https address, open it once in this browser and accept the certificate.');
  }
  if (res.status === 401) throw new Error('Obsidian rejected the API key.');
  if (!res.ok && res.status !== 404) throw new Error(`Obsidian answered ${res.status}.`);
  return res;
}

export async function pingObsidian(s: ObsidianSettings) {
  const r = await call(s, '/');
  const body = await r.json().catch(() => ({}));
  if (body?.authenticated === false) throw new Error('Obsidian rejected the API key.');
  return true;
}

/** Recursively list Markdown files under a vault folder, relative to that folder. */
export async function listVault(s: ObsidianSettings, folder: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string, depth: number) {
    if (depth > 8 || out.length > 2000) return;
    const r = await call(s, `/vault/${dir ? enc(dir) + '/' : ''}`);
    if (r.status === 404) return;
    const { files = [] } = (await r.json()) as { files?: string[] };
    for (const f of files) {
      const full = dir ? `${dir}/${f.replace(/\/$/, '')}` : f.replace(/\/$/, '');
      if (f.endsWith('/')) await walk(full, depth + 1);
      else if (f.toLowerCase().endsWith('.md')) out.push(full);
    }
  }
  await walk(folder.replace(/^\/+|\/+$/g, ''), 0);
  const prefix = folder.replace(/^\/+|\/+$/g, '');
  return out.map(p => (prefix && p.startsWith(prefix + '/') ? p.slice(prefix.length + 1) : p));
}

export async function readVaultFile(s: ObsidianSettings, path: string) {
  const r = await call(s, `/vault/${enc(path)}`, { headers: { Accept: 'text/markdown' } });
  return r.status === 404 ? null : r.text();
}

export async function writeVaultFile(s: ObsidianSettings, path: string, content: string) {
  await call(s, `/vault/${enc(path)}`, { method: 'PUT', headers: { 'Content-Type': 'text/markdown' }, body: content });
}
