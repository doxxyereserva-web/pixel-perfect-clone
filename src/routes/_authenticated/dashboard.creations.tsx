import { pageHead } from '@/lib/page-head';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Download, ExternalLink, Lock, Globe, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, PageHeader, Pill, creationKinds, errorMessage, kindLabel, type CreationKind } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/lib/auth';
import { creationDownloadUrl, uploadCreationFile } from '@/lib/media';

export const Route = createFileRoute('/_authenticated/dashboard/creations')({ head: () => pageHead('My creations', 'Manage your scripts, VFX, models and tools on Ágata.'), component: Creations });

type Creation = Database['public']['Tables']['creations']['Row'];

function Creations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Creation | 'new' | null>(null);
  const key = ['creations', user?.id];

  const { data: items } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('creations').select('*').eq('owner_id', user!.id).order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async (c: Creation) => {
      const { error } = await supabase.from('creations').update({ visibility: c.visibility === 'public' ? 'private' : 'public' }).eq('id', c.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: e => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (c: Creation) => {
      if (c.file_path) await supabase.storage.from('creations').remove([c.file_path]);
      const { error } = await supabase.from('creations').delete().eq('id', c.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Creation deleted.'); },
    onError: e => toast.error(errorMessage(e)),
  });

  const add = <Button className="rounded-full" onClick={() => setEditing('new')}><Plus /> New creation</Button>;

  return <div>
    <PageHeader title="Creations" text="Your repository of scripts, VFX, models and tools. Everything starts private — make it public when you want it on your profile." action={items?.length ? add : undefined} />

    {items && !items.length && <EmptyState mood="sleepy" title="Nothing here yet" text="Add your first creation. Only you can see it until you make it public." action={add} />}

    {!!items?.length && <ul className="divide-y">
      {items.map(c => <li key={c.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="truncate text-base">{c.title}</p><Pill>{kindLabel(c.kind)}</Pill><Pill>{c.visibility === 'public' ? <><Globe className="size-3" />Public</> : <><Lock className="size-3" />Private</>}</Pill></div>
          {c.description && <p className="mt-1.5 line-clamp-2 max-w-xl text-sm text-muted-foreground">{c.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {c.external_url && <Button asChild variant="ghost" size="icon" aria-label="Open link"><a href={c.external_url} target="_blank" rel="noreferrer"><ExternalLink /></a></Button>}
          {c.file_path && <Button variant="ghost" size="icon" aria-label="Download file" onClick={async () => { try { window.open(await creationDownloadUrl(c.file_path!), '_blank'); } catch (e) { toast.error(errorMessage(e)); } }}><Download /></Button>}
          <Button variant="glass" size="sm" className="rounded-full" onClick={() => toggle.mutate(c)}>{c.visibility === 'public' ? 'Make private' : 'Make public'}</Button>
          <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(c)}><Pencil /></Button>
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => { if (confirm(`Delete “${c.title}”?`)) remove.mutate(c); }}><Trash2 /></Button>
        </div>
      </li>)}
    </ul>}

    <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
      <DialogContent className="rounded-lg sm:max-w-lg">
        {editing && user && <CreationForm userId={user.id} creation={editing === 'new' ? null : editing} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: key }); }} />}
      </DialogContent>
    </Dialog>
  </div>;
}

function CreationForm({ userId, creation, onDone }: { userId: string; creation: Creation | null; onDone: () => void }) {
  const [form, setForm] = useState({
    title: creation?.title ?? '', description: creation?.description ?? '', kind: (creation?.kind ?? 'script') as CreationKind,
    external_url: creation?.external_url ?? '', visibility: creation?.visibility ?? 'private',
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const url = form.external_url.trim();
      if (url && !/^https:\/\//.test(url)) throw new Error('Links must start with https://');
      let fileFields = {};
      if (file) {
        const up = await uploadCreationFile(userId, file);
        if (creation?.file_path) await supabase.storage.from('creations').remove([creation.file_path]);
        fileFields = { file_path: up.path, file_name: up.name };
      }
      const row = { ...form, title: form.title.trim(), description: form.description.trim() || null, external_url: url || null, ...fileFields };
      const { error } = creation
        ? await supabase.from('creations').update(row).eq('id', creation.id)
        : await supabase.from('creations').insert({ ...row, owner_id: userId });
      if (error) throw error;
      toast.success(creation ? 'Creation saved.' : 'Creation added.');
      onDone();
    } catch (err) { toast.error(errorMessage(err)); }
    setBusy(false);
  }

  return <form onSubmit={submit} className="grid gap-4">
    <DialogTitle className="text-2xl font-normal">{creation ? 'Edit creation' : 'New creation'}</DialogTitle>
    <div className="grid gap-1.5"><Label htmlFor="c-title">Title</Label><Input id="c-title" required maxLength={80} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
    <div className="grid gap-1.5"><Label>Type</Label>
      <Select value={form.kind} onValueChange={v => setForm(f => ({ ...f, kind: v as CreationKind }))}><SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{creationKinds.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid gap-1.5"><Label htmlFor="c-desc">Description</Label><Textarea id="c-desc" rows={3} maxLength={1000} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
    <div className="grid gap-1.5"><Label htmlFor="c-url">Link <span className="text-muted-foreground">(optional)</span></Label><Input id="c-url" type="url" placeholder="https://" value={form.external_url} onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))} /></div>
    <div className="grid gap-1.5"><Label htmlFor="c-file">File <span className="text-muted-foreground">(optional, up to 50 MB)</span></Label>
      <Input id="c-file" type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      {creation?.file_name && !file && <p className="text-xs text-muted-foreground">Current: {creation.file_name}</p>}</div>
    <div className="flex items-center justify-between rounded-lg border p-4"><div><Label htmlFor="c-vis">Public</Label><p className="mt-0.5 text-xs text-muted-foreground">Shown on your profile when creations are visible.</p></div>
      <Switch id="c-vis" checked={form.visibility === 'public'} onCheckedChange={v => setForm(f => ({ ...f, visibility: v ? 'public' : 'private' }))} /></div>
    <Button disabled={busy} className="mt-1 rounded-full">{busy ? 'Saving…' : creation ? 'Save' : 'Add creation'}</Button>
  </form>;
}
