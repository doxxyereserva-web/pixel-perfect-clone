/** Minimal MCP Streamable HTTP client: initialize, tools/list and tools/call against external servers. */

function blockedHost(url: URL) {
  const h = url.hostname.toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local')
    || /^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h.startsWith('[');
}

export type McpAuth = { header: string; value: string };
export type McpToolDef = { name: string; description: string; inputSchema: Record<string, unknown> };

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

/** Opens an MCP session: validates the URL, initializes and returns the POST helper with session headers. */
async function openSession(rawUrl: string, auth?: McpAuth) {
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

  const rpc = async (id: number, method: string, params: unknown) => {
    const res = await fetch(url, { method: 'POST', headers, signal, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
    if (!res.ok) throw new Error(`${method} answered ${res.status}.`);
    const msg = await readRpc(res, id);
    if (msg.error) throw new Error(msg.error.message ?? `${method} failed.`);
    return msg.result;
  };
  return { server, rpc };
}

/** Lists a server's tools with descriptions and input schemas. */
export async function listMcpTools(rawUrl: string, auth?: McpAuth): Promise<{ server: string; tools: McpToolDef[] }> {
  const { server, rpc } = await openSession(rawUrl, auth);
  const result = await rpc(2, 'tools/list', {}) as { tools?: { name?: string; description?: string; inputSchema?: Record<string, unknown> }[] } | undefined;
  const tools = (result?.tools ?? [])
    .filter(t => typeof t.name === 'string' && t.name)
    .slice(0, 100)
    .map(t => ({
      name: String(t.name),
      description: String(t.description ?? '').slice(0, 500),
      inputSchema: t.inputSchema && typeof t.inputSchema === 'object' ? t.inputSchema : { type: 'object', properties: {} },
    }));
  return { server, tools };
}

/** Calls one tool on an external MCP server and returns its text content (bounded). */
export async function callMcpTool(rawUrl: string, auth: McpAuth | undefined, name: string, args: Record<string, unknown>): Promise<string> {
  const { rpc } = await openSession(rawUrl, auth);
  const result = await rpc(2, 'tools/call', { name, arguments: args }) as {
    isError?: boolean;
    content?: { type?: string; text?: string }[];
    structuredContent?: unknown;
  } | undefined;
  const text = (result?.content ?? [])
    .filter(c => c.type === 'text' && typeof c.text === 'string')
    .map(c => c.text as string)
    .join('\n')
    || (result?.structuredContent !== undefined ? JSON.stringify(result.structuredContent) : '(no content)');
  const bounded = text.slice(0, 20_000);
  if (result?.isError) throw new Error(bounded.slice(0, 300) || 'The tool reported an error.');
  return bounded;
}

export async function probeMcp(rawUrl: string, auth?: McpAuth) {
  const { server, tools } = await listMcpTools(rawUrl, auth);
  return { server, tools: tools.map(t => t.name) };
}
