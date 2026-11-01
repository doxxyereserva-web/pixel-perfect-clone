import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, EmptyState, Pill, errorMessage, roleLabels, type WorkspaceRole } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const Route = createFileRoute('/_authenticated/dashboard/workspaces/$id')({ component: WorkspacePage });

const assignable: WorkspaceRole[] = ['admin', 'member', 'viewer'];

function WorkspacePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const refresh = () => qc.invalidateQueries({ queryKey: ['workspace', id] });

  const { data, isLoading } = useQuery({
    queryKey: ['workspace', id],
    queryFn: async () => {
      const [ws, members, teams, projects] = await Promise.all([
        supabase.from('workspaces').select('*').eq('id', id).maybeSingle(),
        supabase.from('workspace_members').select('user_id, role, profiles(username, display_name, avatar_url)').eq('workspace_id', id).order('created_at'),
        supabase.from('teams').select('id, name, team_members(user_id)').eq('workspace_id', id).order('created_at'),
        supabase.from('projects').select('id, name, visibility').eq('workspace_id', id).order('updated_at', { ascending: false }),
      ]);
      for (const r of [ws, members, teams, projects]) if (r.error) throw r.error;
      return { ws: ws.data, members: members.data ?? [], teams: teams.data ?? [], projects: projects.data ?? [] };
    },
  });

  const myRole = data?.members.find(m => m.user_id === user?.id)?.role;
  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const run = (fn: () => PromiseLike<{ error: unknown }>, ok?: string) => async () => {
    const { error } = await fn();
    if (error) return toast.error(errorMessage(error));
    if (ok) toast.success(ok);
    refresh();
  };

  if (isLoading) return null;
  if (!data?.ws) return <EmptyState mood="alert" title="Workspace not found" text="It may have been deleted, or you're no longer a member." action={<Button asChild variant="glass" className="rounded-full"><Link to="/dashboard/workspaces">Back to workspaces</Link></Button>} />;

  const ws = data.ws;
  const name = (uid: string) => { const p = data.members.find(m => m.user_id === uid)?.profiles; return p?.display_name || p?.username || 'Member'; };

  return <div>
    <Link to="/dashboard/workspaces" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Workspaces</Link>
    <div className="mt-4 flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
      <div><h1 className="text-2xl font-normal tracking-tight sm:text-3xl">{ws.name}</h1>{ws.description && <p className="mt-3 max-w-lg text-sm text-muted-foreground">{ws.description}</p>}</div>
      {myRole && <Pill>Your role: {roleLabels[myRole]}</Pill>}
    </div>

    <div className="grid gap-14 pt-10 xl:grid-cols-[1.2fr_1fr]">
      <section>
        <h2 className="text-lg">Members <span className="text-muted-foreground">{data.members.length}</span></h2>
        {isAdmin && <AddMember workspaceId={id} onAdded={refresh} />}
        <ul className="mt-4 divide-y border-y">
          {data.members.map(m => <li key={m.user_id} className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex min-w-0 items-center gap-3"><Avatar path={m.profiles?.avatar_url} name={m.profiles?.display_name ?? m.profiles?.username} className="size-9" />
              <div className="min-w-0"><p className="truncate text-sm">{m.profiles?.display_name || m.profiles?.username}</p><p className="truncate text-xs text-muted-foreground">@{m.profiles?.username}</p></div></div>
            <div className="flex items-center gap-1">
              {isAdmin && m.role !== 'owner'
                ? <Select value={m.role} onValueChange={v => run(() => supabase.from('workspace_members').update({ role: v as WorkspaceRole }).eq('workspace_id', id).eq('user_id', m.user_id), 'Role updated.')()}>
                    <SelectTrigger className="h-8 w-28 rounded-full text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{assignable.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}</SelectContent></Select>
                : <Pill>{roleLabels[m.role]}</Pill>}
              {m.role !== 'owner' && (isAdmin || m.user_id === user?.id) && <Button variant="ghost" size="icon" className="size-8" aria-label={m.user_id === user?.id ? 'Leave workspace' : 'Remove member'}
                onClick={async () => {
                  const self = m.user_id === user?.id;
                  if (!confirm(self ? 'Leave this workspace?' : `Remove ${name(m.user_id)}?`)) return;
                  const { error } = await supabase.from('workspace_members').delete().eq('workspace_id', id).eq('user_id', m.user_id);
                  if (error) return toast.error(errorMessage(error));
                  if (self) navigate({ to: '/dashboard/workspaces' }); else refresh();
                }}><X /></Button>}
            </div>
          </li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-lg">Teams</h2>
        <p className="mt-1 text-sm text-muted-foreground">Group members by discipline — scripting, VFX, building.</p>
        {isAdmin && <NewTeam workspaceId={id} onAdded={refresh} />}
        {!data.teams.length && <p className="mt-5 text-sm text-muted-foreground">No teams yet.</p>}
        <ul className="mt-4 grid gap-3">
          {data.teams.map(t => {
            const inTeam = new Set(t.team_members.map(tm => tm.user_id));
            const others = data.members.filter(m => !inTeam.has(m.user_id));
            return <li key={t.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between"><p className="text-sm">{t.name}</p>
                {isAdmin && <Button variant="ghost" size="icon" className="size-8" aria-label="Delete team" onClick={() => confirm(`Delete team “${t.name}”?`) && run(() => supabase.from('teams').delete().eq('id', t.id))()}><Trash2 /></Button>}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.team_members.map(tm => <span key={tm.user_id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">{name(tm.user_id)}
                  {isAdmin && <button aria-label="Remove from team" className="text-muted-foreground hover:text-foreground" onClick={run(() => supabase.from('team_members').delete().eq('team_id', t.id).eq('user_id', tm.user_id))}><X className="size-3" /></button>}</span>)}
                {!t.team_members.length && <span className="text-xs text-muted-foreground">No one yet.</span>}
              </div>
              {isAdmin && !!others.length && <Select value="" onValueChange={uid => run(() => supabase.from('team_members').insert({ team_id: t.id, user_id: uid }))()}>
                <SelectTrigger className="mt-3 h-8 w-44 rounded-full text-xs"><SelectValue placeholder="Add to team" /></SelectTrigger>
                <SelectContent>{others.map(o => <SelectItem key={o.user_id} value={o.user_id}>{name(o.user_id)}</SelectItem>)}</SelectContent></Select>}
            </li>;
          })}
        </ul>

        <h2 className="mt-8 text-lg">Projects</h2>
        {!data.projects.length ? <p className="mt-2 text-sm text-muted-foreground">No projects in this workspace. Create one from Projects and choose this workspace.</p>
          : <ul className="mt-3 divide-y border-y">{data.projects.map(p => <li key={p.id}><Link to="/dashboard/projects/$id" params={{ id: p.id }} className="flex items-center justify-between py-3 text-sm hover:text-mineral">{p.name}<ArrowUpRight className="size-4 text-muted-foreground" /></Link></li>)}</ul>}
      </section>
    </div>

    {isAdmin && <WorkspaceSettings ws={ws} isOwner={myRole === 'owner'} onSaved={refresh} />}
  </div>;
}

function AddMember({ workspaceId, onAdded }: { workspaceId: string; onAdded: () => void }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const { data, error } = await supabase.rpc('find_profile_by_username', { _username: username.trim().replace(/^@/, '') });
      if (error) throw error;
      const found = data?.[0];
      if (!found) throw new Error('No one with that username.');
      const { error: e2 } = await supabase.from('workspace_members').insert({ workspace_id: workspaceId, user_id: found.id, role });
      if (e2) throw e2.code === '23505' ? new Error('Already a member.') : e2;
      toast.success(`@${found.username} added.`); setUsername(''); onAdded();
    } catch (err) { toast.error(errorMessage(err)); }
    setBusy(false);
  }
  return <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
    <Input required value={username} onChange={e => setUsername(e.target.value)} placeholder="@username" aria-label="Username to add" className="h-9 min-w-0 flex-1 rounded-full" />
    <Select value={role} onValueChange={v => setRole(v as WorkspaceRole)}><SelectTrigger className="h-9 w-28 rounded-full text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>{assignable.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}</SelectContent></Select>
    <Button disabled={busy} size="sm" className="h-9 rounded-full"><UserPlus /> Add</Button>
  </form>;
}

function NewTeam({ workspaceId, onAdded }: { workspaceId: string; onAdded: () => void }) {
  const [name, setName] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('teams').insert({ workspace_id: workspaceId, name: name.trim() });
    if (error) return toast.error(errorMessage(error));
    setName(''); onAdded();
  }
  return <form onSubmit={submit} className="mt-4 flex gap-2">
    <Input required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Team name" aria-label="New team name" className="h-9 rounded-full" />
    <Button size="sm" variant="glass" className="h-9 rounded-full"><Plus /> Team</Button>
  </form>;
}

function WorkspaceSettings({ ws, isOwner, onSaved }: { ws: { id: string; name: string; description: string | null }; isOwner: boolean; onSaved: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: ws.name, description: ws.description ?? '' });
  useEffect(() => setForm({ name: ws.name, description: ws.description ?? '' }), [ws.name, ws.description]);
  const save = useMutation({
    mutationFn: async () => { const { error } = await supabase.from('workspaces').update({ name: form.name.trim(), description: form.description.trim() || null }).eq('id', ws.id); if (error) throw error; },
    onSuccess: () => { toast.success('Workspace saved.'); onSaved(); },
    onError: e => toast.error(errorMessage(e)),
  });
  return <section className="mt-16 max-w-2xl border-t pt-8">
    <h2 className="text-lg">Settings</h2>
    <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="mt-5 grid gap-4">
      <div className="grid gap-1.5"><Label htmlFor="ws-name">Name</Label><Input id="ws-name" required maxLength={60} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
      <div className="grid gap-1.5"><Label htmlFor="ws-desc">Description</Label><Textarea id="ws-desc" rows={3} maxLength={400} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={save.isPending} className="rounded-full">Save</Button>
        {isOwner && <Button type="button" variant="ghost" className="rounded-full text-destructive hover:text-destructive" onClick={async () => {
          if (!confirm(`Delete “${ws.name}”? Members lose access and its projects become personal to their owners.`)) return;
          const { error } = await supabase.from('workspaces').delete().eq('id', ws.id);
          if (error) return toast.error(errorMessage(error));
          navigate({ to: '/dashboard/workspaces' });
        }}><Trash2 /> Delete workspace</Button>}
      </div>
    </form>
  </section>;
}
