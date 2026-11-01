import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FilePlus2, FolderUp, RefreshCw, Save, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, errorMessage } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { notePath } from '@/lib/skills';
import { download, makeZip } from '@/lib/zip';
import { listVault, loadObsidian, readVaultFile, writeVaultFile } from '@/lib/obsidian';

type Props = { projectId: string; projectName: string; purpose: string; guide: string; canEdit: boolean };

export function NotesTab({ projectId, projectName, purpose, guide, canEdit }: Props) {
  const qc = useQueryClient();
  const key = ['notes', projectId];
  const { data: notes = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('project_notes').select('id, path, content, updated_at').eq('project_id', projectId).order('path');
      if (error) throw error;
      return data;
    },
  });
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [newPath, setNewPath] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const current = notes.find(n => n.path === active);
  useEffect(() => { setDraft(current?.content ?? ''); }, [current?.id, current?.content]);
  useEffect(() => { folderRef.current?.setAttribute('webkitdirectory', ''); }, []);

  const upsert = async (rows: { path: string; content: string }[]) => {
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase.from('project_notes').upsert(rows.slice(i, i + 100).map(r => ({ project_id: projectId, ...r })), { onConflict: 'project_id,path' });
      if (error) throw error;
    }
    qc.invalidateQueries({ queryKey: key });
  };

  const save = useMutation({
    mutationFn: () => upsert([{ path: active!, content: draft }]),
    onSuccess: () => toast.success('Note saved.'),
    onError: e => toast.error(errorMessage(e)),
  });

  async function importFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy('import');
    try {
      const rows: { path: string; content: string }[] = [];
      for (const f of Array.from(list)) {
        const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
        // Drop the vault folder name itself and Obsidian's config folder.
        const parts = rel.split('/');
        if (parts.some(p => p.startsWith('.'))) continue;
        const p = notePath(parts.length > 1 && (f as File & { webkitRelativePath?: string }).webkitRelativePath ? parts.slice(1).join('/') : rel);
        if (!p || f.size > 200_000) continue;
        rows.push({ path: p, content: await f.text() });
      }
      if (!rows.length) throw new Error('No Markdown (.md) notes found.');
      await upsert(rows);
      toast.success(`Imported ${rows.length} note${rows.length > 1 ? 's' : ''}.`);
    } catch (e) { toast.error(errorMessage(e)); }
    setBusy(null);
    if (fileRef.current) fileRef.current.value = '';
    if (folderRef.current) folderRef.current.value = '';
  }

  function exportVault() {
    const root = projectName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Agata project';
    const files = [
      { path: `${root}/Purpose.md`, content: `# ${projectName}\n\n${purpose}\n` },
      { path: `${root}/Guide.md`, content: guide || '# Guide\n' },
      ...notes.filter(n => n.path !== 'Purpose.md' && n.path !== 'Guide.md').map(n => ({ path: `${root}/${n.path}`, content: n.content })),
    ];
    download(makeZip(files), `${root}.zip`);
  }

  async function sync(direction: 'push' | 'pull') {
    const s = loadObsidian();
    if (!s) return toast.error('Set up Obsidian live sync in Dashboard → Connections first.');
    const folder = (s.folder?.trim() || projectName).replace(/^\/+|\/+$/g, '');
    setBusy(direction);
    try {
      if (direction === 'push') {
        for (const n of notes) await writeVaultFile(s, `${folder}/${n.path}`, n.content);
        toast.success(`Sent ${notes.length} notes to “${folder}” in Obsidian.`);
      } else {
        const paths = await listVault(s, folder);
        const rows: { path: string; content: string }[] = [];
        for (const p of paths) { const safe = notePath(p); const c = safe ? await readVaultFile(s, `${folder}/${p}`) : null; if (safe && c !== null && c.length <= 200_000) rows.push({ path: safe, content: c }); }
        if (!rows.length) throw new Error(`No notes found in the “${folder}” folder of your vault.`);
        await upsert(rows);
        toast.success(`Pulled ${rows.length} notes from Obsidian.`);
      }
    } catch (e) { toast.error(errorMessage(e)); }
    setBusy(null);
  }

  return <div className="py-6">
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="glass" size="sm" className="rounded-full" onClick={exportVault}><Download /> Export Obsidian vault</Button>
      {canEdit && <>
        <Button type="button" variant="glass" size="sm" className="rounded-full" disabled={!!busy} onClick={() => fileRef.current?.click()}><UploadCloud /> Import notes</Button>
        <Button type="button" variant="glass" size="sm" className="rounded-full" disabled={!!busy} onClick={() => folderRef.current?.click()}><FolderUp /> Import vault folder</Button>
        <Button type="button" variant="ghost" size="sm" className="rounded-full" disabled={!!busy} onClick={() => sync('pull')}><RefreshCw className={busy === 'pull' ? 'animate-spin' : ''} /> Pull from Obsidian</Button>
      </>}
      <Button type="button" variant="ghost" size="sm" className="rounded-full" disabled={!!busy || !notes.length} onClick={() => sync('push')}><RefreshCw className={busy === 'push' ? 'animate-spin' : ''} /> Send to Obsidian</Button>
      <input ref={fileRef} type="file" accept=".md,text/markdown" multiple hidden onChange={e => importFiles(e.target.files)} />
      <input ref={folderRef} type="file" multiple hidden onChange={e => importFiles(e.target.files)} />
    </div>
    <p className="mt-3 text-xs text-muted-foreground">Notes keep their folders and [[wikilinks]]. Assistants connected through Ágata’s MCP server can read and write them too.</p>

    {!notes.length && !canEdit && <EmptyState mood="reading" title="No notes yet" text="This project’s vault is empty." />}
    <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
      <div>
        {canEdit && <form className="flex gap-1.5" onSubmit={async e => {
          e.preventDefault();
          const p = notePath(newPath.endsWith('.md') ? newPath : `${newPath}.md`);
          if (!p) return toast.error('Use a name like Systems/Combat.md');
          try { await upsert([{ path: p, content: `# ${p.split('/').pop()!.replace(/\.md$/, '')}\n` }]); setActive(p); setNewPath(''); } catch (err) { toast.error(errorMessage(err)); }
        }}><Input value={newPath} onChange={e => setNewPath(e.target.value)} placeholder="Folder/Note.md" className="h-8 text-xs" /><Button size="sm" variant="ghost" className="h-8 px-2" aria-label="New note"><FilePlus2 /></Button></form>}
        <ul className="mt-3 grid gap-0.5 text-sm">
          {notes.map(n => <li key={n.id}><button type="button" onClick={() => setActive(n.path)} translate="no"
            className={`w-full truncate rounded-md px-2 py-1.5 text-left font-mono text-xs transition-colors hover:bg-accent ${active === n.path ? 'bg-accent' : 'text-muted-foreground'}`}>{n.path}</button></li>)}
        </ul>
      </div>
      <div>
        {current ? <>
          <div className="flex items-center justify-between gap-2"><p className="truncate font-mono text-xs text-muted-foreground" translate="no">{current.path}</p>
            {canEdit && <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" className="rounded-full text-destructive hover:text-destructive" onClick={async () => {
                if (!confirm(`Delete ${current.path}?`)) return;
                const { error } = await supabase.from('project_notes').delete().eq('id', current.id);
                if (error) return toast.error(errorMessage(error));
                setActive(null); qc.invalidateQueries({ queryKey: key });
              }}><Trash2 /></Button>
              <Button type="button" size="sm" className="rounded-full" disabled={save.isPending || draft === current.content} onClick={() => save.mutate()}><Save /> Save note</Button>
            </div>}</div>
          <Textarea readOnly={!canEdit} value={draft} onChange={e => setDraft(e.target.value)} rows={22} maxLength={200000} className="mt-2 font-mono text-xs leading-relaxed" translate="no" />
        </> : <p className="py-16 text-center text-sm text-muted-foreground">{notes.length ? 'Pick a note to read or edit it.' : 'Create a note, import Markdown files or pull from Obsidian.'}</p>}
      </div>
    </div>
  </div>;
}
