import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Cpu, Download, KeyRound, Plug, Target, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, errorMessage } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useEditableWorkspaces } from './dashboard.projects.index';

export const Route = createFileRoute('/_authenticated/dashboard/projects/$id')({ component: ProjectPage });

type Form = { name: string; purpose: string; guide: string; mcp_url: string; skill_url: string; models: string[]; uses_lovable_api: boolean; visibility: 'public' | 'private'; workspace: string };

function ProjectPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const workspaces = useEditableWorkspaces(user?.id);

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    enabled: !!user,
    queryFn: async () => {
      const { data: p, error } = await supabase.from('projects').select('*, workspaces(name)').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!p) return null;
      let role: string | null = null;
      if (p.workspace_id) role = (await supabase.from('workspace_members').select('role').eq('workspace_id', p.workspace_id).eq('user_id', user!.id).maybeSingle()).data?.role ?? null;
      return { p, canEdit: p.owner_id === user!.id || role === 'owner' || role === 'admin' };
    },
  });

  const [form, setForm] = useState<Form | null>(null);
  useEffect(() => {
    const p = data?.p;
    if (p) setForm({ name: p.name, purpose: p.purpose ?? '', guide: p.guide ?? '', mcp_url: p.mcp_url ?? '', skill_url: p.skill_url ?? '', models: p.models, uses_lovable_api: p.uses_lovable_api, visibility: p.visibility, workspace: p.workspace_id ?? 'personal' });
  }, [data?.p]);

  const save = useMutation({
    mutationFn: async (f: Form) => {
      for (const u of [f.mcp_url, f.skill_url]) if (u.trim() && !/^https:\/\//.test(u.trim())) throw new Error('Links must start with https://');
      const { error } = await supabase.from('projects').update({
        name: f.name.trim(), purpose: f.purpose.trim() || null, guide: f.guide.trim() || null, mcp_url: f.mcp_url.trim() || null, skill_url: f.skill_url.trim() || null,
        models: f.models, uses_lovable_api: f.uses_lovable_api, visibility: f.visibility, workspace_id: f.workspace === 'personal' ? null : f.workspace,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Project saved.'); qc.invalidateQueries({ queryKey: ['project', id] }); qc.invalidateQueries({ queryKey: ['projects'] }); },
    onError: e => toast.error(errorMessage(e)),
  });

  if (isLoading || (data && !form)) return null;
  if (!data || !form) return <EmptyState mood="alert" title="Project not found" text="It may have been deleted, or you don't have access." action={<Button asChild variant="glass" className="rounded-full"><Link to="/dashboard/projects">Back to projects</Link></Button>} />;

  const { p, canEdit } = data;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => f && ({ ...f, [k]: v }));
  const ro = !canEdit;
  const currentWs = p.workspace_id && !workspaces.some(w => w.id === p.workspace_id) ? [{ id: p.workspace_id, name: p.workspaces?.name ?? 'Workspace' }] : [];

  return <form onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(form); }}>
    <Link to="/dashboard/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Projects</Link>
    <div className="mt-4 flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
      <Input aria-label="Project name" disabled={ro} required maxLength={80} value={form.name} onChange={e => set('name', e.target.value)}
        className="h-auto border-0 bg-transparent px-0 text-2xl sm:text-3xl font-normal tracking-tight shadow-none focus-visible:ring-0 disabled:opacity-100 sm:text-5xl md:text-5xl" />
      <div className="flex shrink-0 items-center gap-2">
        <Select disabled={ro} value={form.workspace} onValueChange={v => set('workspace', v)}><SelectTrigger className="h-9 w-40 rounded-full text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="personal">Personal</SelectItem>{[...currentWs, ...workspaces].map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch disabled={ro} checked={form.visibility === 'public'} onCheckedChange={v => set('visibility', v ? 'public' : 'private')} />Public</label>
      </div>
    </div>

    <div className="divide-y">
      <Module icon={<Target />} title="Purpose" text="Why this project exists and who it's for.">
        <Textarea disabled={ro} rows={3} maxLength={600} value={form.purpose} onChange={e => set('purpose', e.target.value)} />
      </Module>
      <Module icon={<BookOpen />} title="Guide" text="Setup steps, conventions and how to use it. Plain text or Markdown.">
        <Textarea disabled={ro} rows={10} maxLength={20000} value={form.guide} onChange={e => set('guide', e.target.value)} className="font-mono text-xs leading-relaxed" />
      </Module>
      <Module icon={<Plug />} title="MCP connection" text="The MCP server address assistants use to work with this project.">
        <Input disabled={ro} type="url" placeholder="https://" value={form.mcp_url} onChange={e => set('mcp_url', e.target.value)} />
      </Module>
      <Module icon={<Download />} title="Skill download" text="Where people download the skill package for this project.">
        <Input disabled={ro} type="url" placeholder="https://" value={form.skill_url} onChange={e => set('skill_url', e.target.value)} />
      </Module>
      <Module icon={<Cpu />} title="Available models" text="AI models this project is set up to work with. Press Enter to add.">
        <Tags disabled={ro} value={form.models} onChange={v => set('models', v)} />
      </Module>
      <Module icon={<KeyRound />} title="Lovable API" text="Use your own Lovable API in this project.">
        <label className="flex items-center gap-3 text-sm"><Switch disabled={ro} checked={form.uses_lovable_api} onCheckedChange={v => set('uses_lovable_api', v)} />{form.uses_lovable_api ? 'Enabled' : 'Off'}</label>
      </Module>
    </div>

    {canEdit && <div className="sticky bottom-4 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-full border bg-card/90 p-2 ps-5 shadow-lg backdrop-blur">
      <p className="text-xs text-muted-foreground">Changes are saved when you press Save.</p>
      <div className="flex gap-1">
        {p.owner_id === user?.id && <Button type="button" variant="ghost" className="rounded-full text-destructive hover:text-destructive" onClick={async () => {
          if (!confirm(`Delete “${p.name}”?`)) return;
          const { error } = await supabase.from('projects').delete().eq('id', id);
          if (error) return toast.error(errorMessage(error));
          qc.invalidateQueries({ queryKey: ['projects'] }); navigate({ to: '/dashboard/projects' });
        }}><Trash2 /> Delete</Button>}
        <Button disabled={save.isPending} className="rounded-full px-6">Save</Button>
      </div>
    </div>}
    {!canEdit && <p className="mt-8 text-xs text-muted-foreground">View only — the project owner or a workspace admin can edit.</p>}
  </form>;
}

function Module({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children: ReactNode }) {
  return <section className="grid gap-4 py-8 md:grid-cols-[260px_1fr]">
    <div><h2 className="flex items-center gap-2.5 text-base [&_svg]:size-4 [&_svg]:text-mineral">{icon}{title}</h2><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p></div>
    <div className="grid gap-1.5"><Label className="sr-only">{title}</Label>{children}</div>
  </section>;
}

function Tags({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState('');
  const add = () => { const t = draft.trim(); if (t && !value.includes(t) && value.length < 20) onChange([...value, t]); setDraft(''); };
  return <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5">
    {value.map(t => <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">{t}
      {!disabled && <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter(x => x !== t))} className="text-muted-foreground hover:text-foreground"><X className="size-3" /></button>}</span>)}
    {!disabled && <input value={draft} onChange={e => setDraft(e.target.value)} onBlur={add} placeholder={value.length ? '' : 'Model name'} aria-label="Add model"
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1)); }}
      className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none" />}
  </div>;
}
