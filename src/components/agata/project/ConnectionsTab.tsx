import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Pencil, Plug, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState, Pill, errorMessage } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { saveConnection, testConnection } from '@/lib/tools.functions';

type Conn = { id: string; name: string; url: string; auth_header: string | null; secret_hint: string | null; last_status: string | null; last_tools: string[]; last_checked_at: string | null };

export function ConnectionsTab({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const test = useServerFn(testConnection);
  const [editing, setEditing] = useState<Partial<Conn> | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const { data: conns = [] } = useQuery({
    queryKey: ['connections', projectId],
    enabled: canEdit,
    queryFn: async () => {
      const { data, error } = await supabase.from('project_connections').select('id, name, url, auth_header, secret_hint, last_status, last_tools, last_checked_at').eq('project_id', projectId).order('created_at');
      if (error) throw error;
      return data as Conn[];
    },
  });

  if (!canEdit) return <EmptyState mood="peek" title="Connections are private" text="Only the project owner and workspace admins can see the MCP servers this project connects to." />;

  async function runTest(id: string) {
    setTesting(id);
    try {
      const r = await test({ data: { id } });
      r.status.startsWith('Failed') ? toast.error(r.status) : toast.success(`${r.status} · ${r.tools.length} tools`);
    } catch (e) { toast.error(errorMessage(e)); }
    setTesting(null);
    qc.invalidateQueries({ queryKey: ['connections', projectId] });
  }

  return <div className="py-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-xl text-sm text-muted-foreground">MCP servers this project works with — for example a Roblox Studio MCP or a docs server. Tokens are stored encrypted and never shown again.</p>
      <Button type="button" className="rounded-full" onClick={() => setEditing({})}><Plus /> Add connection</Button>
    </div>
    {!conns.length && <EmptyState mood="curious" title="No connections yet" text="Add the address of an MCP server (Streamable HTTP) and test it to see which tools it offers." />}
    <ul className="mt-4 divide-y">
      {conns.map(c => <li key={c.id} className="grid gap-2 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0"><p className="flex items-center gap-2 text-sm"><Plug className="size-4 text-mineral" />{c.name}{c.secret_hint && <Pill>{c.auth_header} {c.secret_hint}</Pill>}</p>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground" translate="no">{c.url}</p></div>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="glass" className="rounded-full" disabled={testing === c.id} onClick={() => runTest(c.id)}><RefreshCw className={testing === c.id ? 'animate-spin' : ''} /> Test</Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-full" aria-label="Edit" onClick={() => setEditing(c)}><Pencil /></Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-full text-destructive hover:text-destructive" aria-label="Delete" onClick={async () => {
              if (!confirm(`Remove ${c.name}?`)) return;
              const { error } = await supabase.from('project_connections').delete().eq('id', c.id);
              if (error) return toast.error(errorMessage(error));
              qc.invalidateQueries({ queryKey: ['connections', projectId] });
            }}><Trash2 /></Button>
          </div>
        </div>
        {c.last_status && <p className={`text-xs ${c.last_status.startsWith('Failed') ? 'text-destructive' : 'text-muted-foreground'}`}>{c.last_status}{c.last_checked_at && ` · ${new Date(c.last_checked_at).toLocaleString()}`}</p>}
        {!!c.last_tools.length && <div className="flex flex-wrap gap-1">{c.last_tools.map(t => <span key={t} className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px]" translate="no">{t}</span>)}</div>}
      </li>)}
    </ul>
    <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
      <DialogContent className="rounded-lg">{editing && <ConnForm projectId={projectId} initial={editing} onDone={id => { setEditing(null); qc.invalidateQueries({ queryKey: ['connections', projectId] }); if (id) void runTest(id); }} />}</DialogContent>
    </Dialog>
  </div>;
}

function ConnForm({ projectId, initial, onDone }: { projectId: string; initial: Partial<Conn>; onDone: (testId?: string) => void }) {
  const save = useServerFn(saveConnection);
  const [f, setF] = useState({ name: initial.name ?? '', url: initial.url ?? '', header: initial.auth_header ?? 'Authorization', secret: '' });
  const [busy, setBusy] = useState(false);
  return <form className="grid gap-4" onSubmit={async e => {
    e.preventDefault(); setBusy(true);
    try {
      const secret = f.secret.trim();
      await save({ data: {
        id: initial.id, projectId, name: f.name.trim(), url: f.url.trim(),
        authHeader: secret || initial.secret_hint ? f.header.trim() || 'Authorization' : null,
        secret: secret ? (f.header.trim().toLowerCase() === 'authorization' && !/^\w+\s/.test(secret) ? `Bearer ${secret}` : secret) : undefined,
      } });
      onDone(initial.id);
    } catch (err) { toast.error(errorMessage(err)); }
    setBusy(false);
  }}>
    <DialogTitle className="text-2xl font-normal">{initial.id ? 'Edit connection' : 'Add connection'}</DialogTitle>
    <div className="grid gap-1.5"><Label htmlFor="c-name">Name</Label><Input id="c-name" required maxLength={80} value={f.name} onChange={e => setF(v => ({ ...v, name: e.target.value }))} placeholder="Roblox Studio MCP" /></div>
    <div className="grid gap-1.5"><Label htmlFor="c-url">Server address</Label><Input id="c-url" required type="url" pattern="https://.*" value={f.url} onChange={e => setF(v => ({ ...v, url: e.target.value }))} placeholder="https://example.com/mcp" translate="no" /></div>
    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
      <div className="grid gap-1.5"><Label htmlFor="c-h">Auth header</Label><Input id="c-h" value={f.header} onChange={e => setF(v => ({ ...v, header: e.target.value }))} translate="no" /></div>
      <div className="grid gap-1.5"><Label htmlFor="c-s">Token <span className="text-muted-foreground">(optional)</span></Label><Input id="c-s" type="password" autoComplete="off" value={f.secret} onChange={e => setF(v => ({ ...v, secret: e.target.value }))} placeholder={initial.secret_hint ? `Saved ${initial.secret_hint} — leave empty to keep` : ''} /></div>
    </div>
    <Button disabled={busy} className="rounded-full">Save and test</Button>
  </form>;
}
