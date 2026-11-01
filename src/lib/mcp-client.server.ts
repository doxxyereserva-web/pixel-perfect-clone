/** Minimal MCP Streamable HTTP client: initialize + tools/list, used to test external connections. */

function blockedHost(url: URL) {
  const h = url.hostname.toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local')
    || /^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h.startsWith('[');
}

async function readRpc(res: Response, id: number): Promise<{ result?: unknown; error?: { message?: string } }> {
  const type = res.headers.get('content-type') ?? '';
  const text = (await res.text()).slice(0, 500_000);
  if (type.includes('text/event-stream')) {
    for (const line of text.split('\n')) {
      if (!line.startsWith('data:')) continue;
      try { const msg = JSON.parse(line.slice(5).trim()); if (msg.id === id) return msg; } catch { /* skip */ }
    }
    throw new Error('No response in event stream.');
  }
  return JSON.parse(text);
}

export async function probeMcp(rawUrl: string, auth?: { header: string; value: string }) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || blockedHost(url)) throw new Error('Use a public https:// address.');
  const base: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (auth) base[auth.header] = auth.value;
  const signal = AbortSignal.timeout(15_000);

  const init = await fetch(url, { method: 'POST', headers: base, signal, redirect: 'error', body: JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'agata', version: '1.0.0' } },
  }) });
  if (init.status === 401 || init.status === 403) throw new Error(`The server refused access (${init.status}). Check the token.`);
  if (!init.ok) throw new Error(`The server answered ${init.status}.`);
  const initMsg = await readRpc(init, 1);
  if (initMsg.error) throw new Error(initMsg.error.message ?? 'Initialize failed.');
  const server = (initMsg.result as { serverInfo?: { name?: string } } | undefined)?.serverInfo?.name ?? 'MCP server';

  const headers = { ...base };
  const session = init.headers.get('mcp-session-id');
  if (session) headers['Mcp-Session-Id'] = session;
  await fetch(url, { method: 'POST', headers, signal, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).then(r => r.body?.cancel()).catch(() => {});
  const list = await fetch(url, { method: 'POST', headers, signal, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) });
  if (!list.ok) throw new Error(`tools/list answered ${list.status}.`);
  const listMsg = await readRpc(list, 2);
  if (listMsg.error) throw new Error(listMsg.error.message ?? 'tools/list failed.');
  const tools = ((listMsg.result as { tools?: { name?: string }[] } | undefined)?.tools ?? []).map(t => String(t.name ?? '')).filter(Boolean).slice(0, 100);
  return { server, tools };
}
