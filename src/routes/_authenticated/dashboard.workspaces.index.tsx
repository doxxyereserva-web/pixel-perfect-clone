import { pageHead } from '@/lib/page-head';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, PageHeader, Pill, errorMessage, roleLabels } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const Route = createFileRoute('/_authenticated/dashboard/workspaces/')({ head: () => pageHead('My workspaces', 'Manage Ágata studios, teams and shared projects.'), component: Workspaces });

function Workspaces() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ['workspaces', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('workspace_members').select('role, workspaces(id, name, description, created_at)').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data.filter(r => r.workspaces);
    },
  });

  const add = <Button className="rounded-full" onClick={() => setOpen(true)}><Plus /> New workspace</Button>;

  return <div>
    <PageHeader title="Workspaces" text="Shared spaces for your studio or team: members, roles, groups and the projects you build together." action={data?.length ? add : undefined} />
    {data && !data.length && <EmptyState mood="peek" title="No workspaces yet" text="Create one for your studio, then invite people by their username." action={add} />}
    {!!data?.length && <ul className="divide-y">
      {data.map(({ role, workspaces: w }) => <li key={w!.id}>
        <Link to="/dashboard/workspaces/$id" params={{ id: w!.id }} className="group flex items-center justify-between gap-4 py-6">
          <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-base">{w!.name}</p><Pill>{roleLabels[role]}</Pill></div>
            {w!.description && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{w!.description}</p>}</div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </li>)}
    </ul>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="rounded-lg">{user && <NewWorkspace userId={user.id} />}</DialogContent></Dialog>
  </div>;
}

function NewWorkspace({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data, error } = await supabase.from('workspaces').insert({ name: name.trim(), description: description.trim() || null, owner_id: userId }).select('id').single();
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    navigate({ to: '/dashboard/workspaces/$id', params: { id: data.id } });
  }
  return <form onSubmit={submit} className="grid gap-4">
    <DialogTitle className="text-2xl font-normal">New workspace</DialogTitle>
    <div className="grid gap-1.5"><Label htmlFor="w-name">Name</Label><Input id="w-name" required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Studio name" /></div>
    <div className="grid gap-1.5"><Label htmlFor="w-desc">Description <span className="text-muted-foreground">(optional)</span></Label><Textarea id="w-desc" rows={3} maxLength={400} value={description} onChange={e => setDescription(e.target.value)} /></div>
    <Button disabled={busy} className="rounded-full">Create workspace</Button>
  </form>;
}
