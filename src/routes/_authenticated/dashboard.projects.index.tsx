import { pageHead } from '@/lib/page-head';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Globe, Lock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, PageHeader, Pill, errorMessage } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const Route = createFileRoute('/_authenticated/dashboard/projects/')({ head: () => pageHead('My projects', 'Manage Ágata project guides, skills, notes and tools.'), component: Projects });

export function useEditableWorkspaces(userId?: string) {
  return useQuery({
    queryKey: ['editable-workspaces', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('workspace_members').select('role, workspaces(id, name)').eq('user_id', userId!).neq('role', 'viewer');
      if (error) throw error;
      return data.flatMap(r => r.workspaces ? [r.workspaces] : []);
    },
  }).data ?? [];
}

function Projects() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ['projects', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // RLS returns projects the user owns or that live in their workspaces (plus public ones, filtered below).
      const { data: memberships } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user!.id);
      const wsIds = (memberships ?? []).map(m => m.workspace_id);
      let q = supabase.from('projects').select('id, name, purpose, visibility, owner_id, workspaces(name)').order('updated_at', { ascending: false });
      q = wsIds.length ? q.or(`owner_id.eq.${user!.id},workspace_id.in.(${wsIds.join(',')})`) : q.eq('owner_id', user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const add = <Button className="rounded-full" onClick={() => setOpen(true)}><Plus /> New project</Button>;

  return <div>
    <PageHeader title="Projects" text="Each project carries its purpose, guide, MCP connection, skill download, available models and Lovable API setup." action={data?.length ? add : undefined} />
    {data && !data.length && <EmptyState mood="reading" title="No projects yet" text="Start a project on your own or inside a workspace. You can fill in each part as it takes shape." action={add} />}
    {!!data?.length && <ul className="divide-y">
      {data.map(p => <li key={p.id}><Link to="/dashboard/projects/$id" params={{ id: p.id }} className="group flex items-center justify-between gap-4 py-6">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-base">{p.name}</p>
          <Pill>{p.workspaces?.name ?? 'Personal'}</Pill><Pill>{p.visibility === 'public' ? <><Globe className="size-3" />Public</> : <><Lock className="size-3" />Private</>}</Pill></div>
          {p.purpose && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{p.purpose}</p>}</div>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link></li>)}
    </ul>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="rounded-lg">{user && <NewProject userId={user.id} />}</DialogContent></Dialog>
  </div>;
}

function NewProject({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const workspaces = useEditableWorkspaces(userId);
  const [form, setForm] = useState({ name: '', purpose: '', workspace: 'personal' });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data, error } = await supabase.from('projects').insert({
      name: form.name.trim(), purpose: form.purpose.trim() || null, owner_id: userId,
      workspace_id: form.workspace === 'personal' ? null : form.workspace,
    }).select('id').single();
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    navigate({ to: '/dashboard/projects/$id', params: { id: data.id } });
  }
  return <form onSubmit={submit} className="grid gap-4">
    <DialogTitle className="text-2xl font-normal">New project</DialogTitle>
    <div className="grid gap-1.5"><Label htmlFor="p-name">Name</Label><Input id="p-name" required maxLength={80} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
    <div className="grid gap-1.5"><Label>Where</Label>
      <Select value={form.workspace} onValueChange={v => setForm(f => ({ ...f, workspace: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="personal">Personal</SelectItem>{workspaces.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid gap-1.5"><Label htmlFor="p-purpose">Purpose <span className="text-muted-foreground">(optional)</span></Label><Textarea id="p-purpose" rows={3} maxLength={600} value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="What this project is for, in a sentence or two." /></div>
    <Button disabled={busy} className="rounded-full">Create project</Button>
  </form>;
}
