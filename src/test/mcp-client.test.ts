import { afterEach, describe, expect, it, vi } from 'vitest';
import { callMcpTool, listMcpTools, probeMcp } from '@/lib/mcp-client.server';

/** Builds a fetch mock answering MCP JSON-RPC over plain JSON. */
function mockMcp(handlers: { tools?: unknown[]; call?: (name: string, args: unknown) => unknown }) {
  return vi.fn(async (_url: unknown, init?: { body?: string }) => {
    const req = JSON.parse(init?.body ?? '{}') as { id?: number; method?: string; params?: { name?: string; arguments?: unknown } };
    if (req.method === 'initialize') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: { serverInfo: { name: 'test-server' } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'notifications/initialized') return new Response(null, { status: 202 });
    if (req.method === 'tools/list') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: { tools: handlers.tools ?? [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'tools/call') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: handlers.call?.(req.params?.name ?? '', req.params?.arguments) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('unknown', { status: 400 });
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('mcp-client.server', () => {
  it('lists tools with descriptions and schemas', async () => {
    vi.stubGlobal('fetch', mockMcp({ tools: [
      { name: 'search', description: 'Search docs', inputSchema: { type: 'object', properties: { q: { type: 'string' } } } },
      { name: 'ping' },
    ] }));
    const r = await listMcpTools('https://mcp.example.com/mcp');
    expect(r.server).toBe('test-server');
    expect(r.tools).toHaveLength(2);
    expect(r.tools[0]).toMatchObject({ name: 'search', description: 'Search docs' });
    expect(r.tools[1].inputSchema).toEqual({ type: 'object', properties: {} });
  });

  it('calls a tool and returns its text content', async () => {
    const call = vi.fn((name: string, args: unknown) => ({ content: [{ type: 'text', text: `ran ${name} with ${JSON.stringify(args)}` }] }));
    vi.stubGlobal('fetch', mockMcp({ call }));
    const out = await callMcpTool('https://mcp.example.com/mcp', { header: 'Authorization', value: 'Bearer x' }, 'search', { q: 'roblox' });
    expect(call).toHaveBeenCalledWith('search', { q: 'roblox' });
    expect(out).toBe('ran search with {"q":"roblox"}');
  });

  it('throws when the tool reports an error', async () => {
    vi.stubGlobal('fetch', mockMcp({ call: () => ({ isError: true, content: [{ type: 'text', text: 'boom' }] }) }));
    await expect(callMcpTool('https://mcp.example.com/mcp', undefined, 'x', {})).rejects.toThrow('boom');
  });

  it('rejects non-public hosts', async () => {
    await expect(probeMcp('http://localhost:3000/mcp')).rejects.toThrow('public https');
    await expect(probeMcp('https://192.168.1.10/mcp')).rejects.toThrow('public https');
  });
});
