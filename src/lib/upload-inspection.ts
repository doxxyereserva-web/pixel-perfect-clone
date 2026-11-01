/** Bounded, non-executing inspection. Never labels executable code malware-free. */
export const INSPECTOR_VERSION = 'agata-static-1';
export const MAX_SCAN_BYTES = 50 * 1024 * 1024;
export type Inspection = { status: 'checked' | 'review_required' | 'rejected'; summary: string; findings: string[] };
const reject = (reason: string): Inspection => ({ status: 'rejected', summary: reason, findings: [reason] });
const review = (reason: string, findings: string[] = []): Inspection => ({ status: 'review_required', summary: reason, findings });
const checked = (summary: string): Inspection => ({ status: 'checked', summary, findings: [] });

export function inspectUpload(name: string, bytes: Uint8Array): Inspection {
  if (!bytes.length || bytes.length > MAX_SCAN_BYTES) return reject('Empty file or file larger than 50 MB.');
  const ext = name.split('.').pop()?.toLowerCase();
  if (['exe', 'dll', 'com', 'bat', 'cmd', 'ps1', 'sh', 'html', 'svg', 'js', 'jar'].includes(ext ?? '')) return reject('Executable or active document formats are blocked.');
  if (ext === 'glb') return inspectGlb(bytes);
  if (ext === 'obj') return inspectObj(bytes);
  if (ext === 'lua' || ext === 'luau' || ext === 'rbxmx') {
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return reject('Invalid UTF-8 source.'); }
    if (text.includes('\0') || bytes.length > 5 * 1024 * 1024) return reject('Source exceeds inspection limits or contains binary data.');
    if (ext === 'rbxmx' && /<!DOCTYPE|<!ENTITY/i.test(text)) return reject('XML entities and document types are blocked.');
    const patterns: [RegExp, string][] = [
      [/\brequire\s*\(\s*\d/i, 'Remote numeric require dependency'],
      [/\bloadstring\b|\bgetfenv\b|\bsetfenv\b/i, 'Dynamic execution or environment manipulation'],
      [/HttpService|HttpGet|GetAsync|PostAsync|RequestAsync/i, 'Network access'],
      [/InsertService|LoadAsset|GetObjects/i, 'Runtime asset loading'],
      [/string\s*\.\s*(char|reverse)|\\x[0-9a-f]{2}|\\\d{3}/i, 'Possible encoded or obfuscated payload'],
    ];
    const findings = patterns.filter(([re]) => re.test(text)).map(([, reason]) => reason);
    return review(findings.length ? 'Potentially risky code detected; public release blocked.' : 'Executable scripts/XML require independent code review before public release.', findings);
  }
  return review('This format cannot be fully inspected here. Kept private; export a mesh-only OBJ or GLB for automated checks.');
}

function inspectObj(bytes: Uint8Array): Inspection {
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return reject('OBJ must be valid UTF-8 text.'); }
  if (text.includes('\0')) return reject('Binary data in OBJ.');
  const lines = text.split(/\r?\n/);
  if (lines.length > 600000) return review('Mesh exceeds automatic inspection complexity limits.');
  let vertices = 0, uvs = 0, normals = 0, faces = 0;
  for (const raw of lines) {
    if (raw.length > 8192) return reject('Oversized OBJ line.');
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const [op, ...args] = line.split(/\s+/);
    if (op === 'v' || op === 'vt' || op === 'vn') {
      const min = op === 'vt' ? 1 : 3;
      if (args.length < min || args.length > 4 || args.some(a => !Number.isFinite(Number(a)) || Math.abs(Number(a)) > 1e9)) return reject('Invalid mesh coordinates.');
      if (op === 'v') vertices++; else if (op === 'vt') uvs++; else normals++;
    } else if (op === 'f') {
      if (args.length < 3 || args.length > 256) return reject('Invalid face size.');
      for (const a of args) {
        const parts = a.split('/'); if (parts.length > 3) return reject('Invalid face index.');
        const limits = [vertices, uvs, normals];
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i]; if (!p && i > 0) continue;
          if (!p || !/^-?\d+$/.test(p)) return reject('Invalid face index.');
          const n = Number(p), limit = limits[i] ?? 0;
          if (!n || !Number.isSafeInteger(n) || Math.abs(n) > limit) return reject('Face references a missing vertex.');
        }
      }
      faces++;
    } else if (!['o', 'g', 's', 'usemtl'].includes(op ?? '')) {
      return review('OBJ contains dependencies or unsupported directives. Export a self-contained mesh without mtllib/call/includes.');
    }
  }
  if (!vertices || !faces) return reject('No valid mesh geometry found.');
  return checked('Mesh-only OBJ structural checks passed. No executable directives or external dependencies; not a malware-free guarantee.');
}

function inspectGlb(bytes: Uint8Array): Inspection {
  if (bytes.length < 20) return reject('Invalid GLB header.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.length) return reject('Invalid GLB signature, version or length.');
  let offset = 12, json: unknown = null, binaryBytes = 0, chunks = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) return reject('Truncated GLB chunk.');
    const len = view.getUint32(offset, true), type = view.getUint32(offset + 4, true); offset += 8;
    if (len % 4 || offset + len > bytes.length || chunks >= 2) return reject('Invalid GLB chunk layout.');
    if (chunks === 0 && type === 0x4e4f534a) {
      if (len > 4 * 1024 * 1024) return review('GLB metadata exceeds inspection complexity limits.');
      try { json = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(offset, offset + len))); } catch { return reject('Invalid glTF JSON.'); }
    } else if (chunks === 1 && type === 0x004e4942) binaryBytes = len;
    else return reject('Unsupported GLB chunk type/order.');
    chunks++; offset += len;
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return reject('Missing glTF object.');
  const doc = json as Record<string, unknown>;
  const asset = doc.asset as { version?: string } | undefined;
  if (asset?.version !== '2.0') return reject('Only glTF 2.0 is supported.');
  // No extensions, embedded code, external resources, animations or image decoders on the automatic release path.
  const stack: unknown[] = [json]; let count = 0;
  while (stack.length) {
    const item = stack.pop(); if (++count > 200000) return review('GLB complexity requires review.');
    if (item && typeof item === 'object') {
      for (const [key, val] of Object.entries(item)) {
        if (['uri', 'extensions', 'extras'].includes(key)) return review('GLB contains external/embedded resources or extension metadata requiring review.');
        stack.push(val);
      }
    }
  }
  if (doc.images || doc.animations || doc.skins) return review('Textured or animated GLB requires additional review; mesh-only GLB can be checked automatically.');
  const buffers = doc.buffers as { byteLength?: number }[] | undefined;
  if (!Array.isArray(buffers) || buffers.length !== 1 || !Number.isInteger(buffers[0]?.byteLength) || (buffers[0]?.byteLength ?? 0) > binaryBytes || (buffers[0]?.byteLength ?? 0) < binaryBytes - 3) return reject('Invalid embedded buffer bounds.');
  const bufferViews = doc.bufferViews as { buffer?: number; byteOffset?: number; byteLength?: number; byteStride?: number }[] | undefined;
  if (!Array.isArray(bufferViews)) return reject('Missing buffer views.');
  for (const b of bufferViews) {
    if (!b || b.buffer !== 0 || !Number.isInteger(b.byteLength) || (b.byteLength ?? 0) <= 0 || !Number.isInteger(b.byteOffset ?? 0) || (b.byteOffset ?? 0) < 0 || (b.byteOffset ?? 0) + (b.byteLength ?? 0) > (buffers[0]?.byteLength ?? 0)) return reject('Invalid buffer view bounds.');
  }
  // Accessor decoding is not performed. Never promote a complex binary model on header checks alone.
  return review('GLB structure checked; binary geometry requires independent validation before public release. Mesh-only OBJ can be checked automatically.');
}