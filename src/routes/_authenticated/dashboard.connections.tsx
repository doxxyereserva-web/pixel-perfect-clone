import { pageHead } from '@/lib/page-head';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bot, Check, Copy, KeyRound, NotebookPen, Plus, Server, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader, Pill, errorMessage } from '@/components/agata/account';
import { useMyAiKeys } from '@/components/agata/project/ModelPicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { providers, type AiProvider } from '@/lib/ai-models';
import { createApiKey, saveAiKey } from '@/lib/tools.functions';
import { loadObsidian, pingObsidian, saveObsidian } from '@/lib/obsidian';

export const Route = createFileRoute('/_authenticated/dashboard/connections')({ head: () => pageHead('Connections and API keys', 'Connect Ágata assistants, your AI accounts, API tools and Obsidian.'), component: Connections });

function useOrigin() {
  const [o, setO] = useState('');
  useEffect(() => setO(window.location.origin), []);
  return o;
}

function Copyable({ value, mono = true }: { value: string; mono?: boolean }) {
  const [done, setDone] = useState(false);
  return <div className="flex items-start gap-2 rounded-md border bg-background p-2.5">
    <pre className={`min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-all text-xs ${mono ? 'font-mono' : ''}`} translate="no">{value}</pre>
    <button type="button" aria-label="Copy" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => { void navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}</button>
  </div>;
}

function Section({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children: ReactNode }) {
  return <section className="grid gap-4 border-b py-8 md:grid-cols-[260px_1fr]">
    <div><h2 className="flex items-center gap-2.5 text-base [&_svg]:size-4 [&_svg]:text-mineral">{icon}{title}</h2><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p></div>
    <div className="grid min-w-0 content-start gap-3">{children}</div>
  </section>;
}

function Connections() {
  const origin = useOrigin();
  const mcpUrl = `${origin}/mcp`;
  return <div>
    <PageHeader title="Connections" text="Connect AI assistants to Ágata, bring your own AI keys, call Ágata from your own tools and sync with Obsidian." />

    <Section icon={<Server />} title="Ágata MCP server" text="Let Claude, ChatGPT, Codex or Cursor work with your projects, vault notes and skills. You sign in once and approve the connection.">
      <Label className="text-xs text-muted-foreground">Server address</Label>
      <Copyable value={mcpUrl} />
      <Label className="mt-2 text-xs text-muted-foreground">Claude Code</Label>
      <Copyable value={`claude mcp add --transport http agata ${mcpUrl}`} />
      <Label className="mt-2 text-xs text-muted-foreground">Codex (~/.codex/config.toml)</Label>
      <Copyable value={`[mcp_servers.agata]\nurl = "${mcpUrl}"`} />
      <Label className="mt-2 text-xs text-muted-foreground">Cursor (.cursor/mcp.json)</Label>
      <Copyable value={JSON.stringify({ mcpServers: { agata: { url: mcpUrl } } }, null, 2)} />
      <p className="text-xs text-muted-foreground">In Claude.ai or ChatGPT, add a custom connector with the server address above.</p>
    </Section>

    <AiKeys />
    <ApiKeys origin={origin} />
    <ObsidianSettings />
  </div>;
}

function AiKeys() {
  const qc = useQueryClient();
  const save = useServerFn(saveAiKey);
  const { data: keys = [] } = useMyAiKeys();
  const [drafts, setDrafts] = useState<Partial<Record<AiProvider, string>>>({});
  const [busy, setBusy] = useState<AiProvider | null>(null);
  return <Section icon={<Bot />} title="Your AI keys" text="Use your own provider accounts in the project assistant and AI drafts. Keys are encrypted and never shown again.">
    {providers.map(p => {
      const saved = keys.find(k => k.provider === p.id);
      return <form key={p.id} className="grid gap-1.5" onSubmit={async e => {
        e.preventDefault(); const key = drafts[p.id]?.trim(); if (!key) return;
        setBusy(p.id);
        try { await save({ data: { provider: p.id, key } }); setDrafts(d => ({ ...d, [p.id]: '' })); toast.success(`${p.label} key saved.`); qc.invalidateQueries({ queryKey: ['ai-keys'] }); }
        catch (err) { toast.error(errorMessage(err)); }
        setBusy(null);
      }}>
        <Label htmlFor={`k-${p.id}`} className="flex items-center gap-2">{p.label}{saved && <Pill>Saved {saved.key_hint}</Pill>}</Label>
        <div className="flex gap-2">
          <Input id={`k-${p.id}`} type="password" autoComplete="off" placeholder={saved ? 'Paste a new key to replace' : p.placeholder} value={drafts[p.id] ?? ''} onChange={e => setDrafts(d => ({ ...d, [p.id]: e.target.value }))} />
          <Button disabled={busy === p.id || !drafts[p.id]?.trim()} variant="glass" className="rounded-full">Save</Button>
          {saved && <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${p.label} key`} className="shrink-0 rounded-full text-destructive hover:text-destructive" onClick={async () => {
            const { error } = await supabase.from('user_ai_keys').delete().eq('id', saved.id);
            if (error) return toast.error(errorMessage(error));
            qc.invalidateQueries({ queryKey: ['ai-keys'] });
          }}><Trash2 /></Button>}
        </div>
      </form>;
    })}
  </Section>;
}

function ApiKeys({ origin }: { origin: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const create = useServerFn(createApiKey);
  const [name, setName] = useState('');
  const [fresh, setFresh] = useState<string | null>(null);
  const { data: keys = [] } = useQuery({
    queryKey: ['api-keys', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('api_keys').select('id, name, prefix, last_used_at, created_at').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return <Section icon={<KeyRound />} title="Ágata API keys" text="Call Ágata from scripts, Roblox Studio plugins or other tools. A key acts as you, so keep it private.">
    <form className="flex gap-2" onSubmit={async e => {
      e.preventDefault(); if (!name.trim()) return;
      try { const r = await create({ data: { name: name.trim() } }); setFresh(r.key); setName(''); qc.invalidateQueries({ queryKey: ['api-keys'] }); }
      catch (err) { toast.error(errorMessage(err)); }
    }}>
      <Input value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Key name, e.g. Studio plugin" />
      <Button className="rounded-full"><Plus /> Create key</Button>
    </form>
    {fresh && <div className="grid gap-1.5 rounded-md border border-mineral/40 p-3"><p className="text-xs">Copy this key now — it won’t be shown again.</p><Copyable value={fresh} /></div>}
    {!!keys.length && <ul className="divide-y rounded-md border">{keys.map(k => <li key={k.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
      <div className="min-w-0"><p className="truncate">{k.name}</p><p className="font-mono text-[11px] text-muted-foreground" translate="no">{k.prefix}… · {k.last_used_at ? `used ${new Date(k.last_used_at).toLocaleDateString()}` : 'never used'}</p></div>
      <Button type="button" variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive" onClick={async () => {
        if (!confirm(`Revoke “${k.name}”? Tools using it will stop working.`)) return;
        const { error } = await supabase.from('api_keys').delete().eq('id', k.id);
        if (error) return toast.error(errorMessage(error));
        qc.invalidateQueries({ queryKey: ['api-keys'] });
      }}>Revoke</Button>
    </li>)}</ul>}
    <Label className="mt-2 text-xs text-muted-foreground">Endpoints</Label>
    <Copyable value={[
      `GET    ${origin}/api/public/v1/projects`,
      `GET    ${origin}/api/public/v1/projects/{id}`,
      `GET    ${origin}/api/public/v1/projects/{id}/notes`,
      `GET    ${origin}/api/public/v1/projects/{id}/notes/{path.md}`,
      `PUT    ${origin}/api/public/v1/projects/{id}/notes/{path.md}`,
      `DELETE ${origin}/api/public/v1/projects/{id}/notes/{path.md}`,
      `GET    ${origin}/api/public/v1/projects/{id}/skills`,
    ].join('\n')} />
    <Copyable value={`curl -H "Authorization: Bearer agt_…" ${origin}/api/public/v1/projects`} />
  </Section>;
}

function ObsidianSettings() {
  const [s, setS] = useState({ url: 'https://127.0.0.1:27124', key: '', folder: '' });
  const [saved, setSaved] = useState(false);
  useEffect(() => { const v = loadObsidian(); if (v) { setS({ url: v.url, key: v.key, folder: v.folder ?? '' }); setSaved(true); } }, []);
  return <Section icon={<NotebookPen />} title="Obsidian live sync" text="Send and pull project notes to the Obsidian app on this computer. Install the “Local REST API” community plugin and paste its key. Settings stay in this browser.">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5"><Label htmlFor="o-url">Plugin address</Label><Input id="o-url" value={s.url} onChange={e => setS(v => ({ ...v, url: e.target.value }))} translate="no" /></div>
      <div className="grid gap-1.5"><Label htmlFor="o-key">API key</Label><Input id="o-key" type="password" autoComplete="off" value={s.key} onChange={e => setS(v => ({ ...v, key: e.target.value }))} /></div>
    </div>
    <div className="grid gap-1.5"><Label htmlFor="o-folder">Vault folder <span className="text-muted-foreground">(optional — defaults to the project name)</span></Label><Input id="o-folder" value={s.folder} onChange={e => setS(v => ({ ...v, folder: e.target.value }))} placeholder="Ágata/My game" /></div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" className="rounded-full" disabled={!s.url || !s.key} onClick={async () => {
        try { await pingObsidian(s); saveObsidian({ url: s.url.trim(), key: s.key.trim(), folder: s.folder.trim() || undefined }); setSaved(true); toast.success('Connected to Obsidian.'); }
        catch (e) { toast.error(errorMessage(e)); }
      }}>Test and save</Button>
      {saved && <Button type="button" variant="ghost" className="rounded-full" onClick={() => { saveObsidian(null); setSaved(false); setS({ url: 'https://127.0.0.1:27124', key: '', folder: '' }); }}>Forget</Button>}
    </div>
    <p className="text-xs text-muted-foreground">Using the https address? Open it once in this browser and accept the plugin’s certificate. Then use “Send to Obsidian” and “Pull from Obsidian” in a project’s Vault tab.</p>
  </Section>;
}
