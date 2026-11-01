import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Download, ExternalLink, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { errorMessage } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { skillTargets, targetLabel, type SkillTarget } from '@/lib/ai-models';
import { filterLibrarySkills, librarySkillForTarget, skillCategories, type LibrarySkill, type SkillCategory } from '@/lib/skill-library';
import { skillFiles, skillInstallDir } from '@/lib/skills';
import { download, makeZip } from '@/lib/zip';

export function SkillLibrary({ projectId, canEdit = false }: { projectId?: string; canEdit?: boolean }) {
  const qc = useQueryClient();
  const [category, setCategory] = useState<SkillCategory>('All');
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<SkillTarget>('codex');
  const [preview, setPreview] = useState<LibrarySkill | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const items = filterLibrarySkills(category, query);
  const edition = preview ? librarySkillForTarget(preview, target) : null;

  function getPackage(s: LibrarySkill) {
    download(makeZip(skillFiles(librarySkillForTarget(s, target))), `${s.id}-${target.replace('_', '-')}.zip`);
  }

  async function add(s: LibrarySkill) {
    if (!projectId || !canEdit || busy) return;
    setBusy(s.id);
    try {
      const { error } = await supabase.from('project_skills').insert({ project_id: projectId, ...librarySkillForTarget(s, target) });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['skills', projectId] });
      toast.success(`${s.title} added to project.`);
    } catch (e) {
      toast.error(typeof e === 'object' && e !== null && 'code' in e && e.code === '23505' ? 'This skill is already in your project for this tool.' : errorMessage(e));
    } finally { setBusy(null); }
  }

  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
      <div className="relative min-w-0 flex-1 sm:max-w-sm"><Search className="pointer-events-none absolute start-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search ready-made skills" placeholder="Search skills" value={query} onChange={e => setQuery(e.target.value)} className="ps-9" /></div>
      <Select value={target} onValueChange={v => { if (skillTargets.some(t => t.id === v)) setTarget(v as SkillTarget); }}><SelectTrigger aria-label="Skill tool edition" className="w-44"><SelectValue /></SelectTrigger><SelectContent>{skillTargets.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select>
    </div>
    <div className="my-5 flex flex-wrap gap-1" aria-label="Skill categories">{skillCategories.map(c => <Button key={c} type="button" size="sm" variant={category === c ? 'default' : 'ghost'} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</Button>)}</div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(s => <article key={s.id} className="flex min-w-0 flex-col rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{s.category}</span><span>{targetLabel(target)}</span></div>
      <h3 className="mt-4 text-xl font-normal">{s.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
      <p className="mt-4 text-xs text-mineral">{s.sources.length} official references{s.references.length ? ` · ${s.references.length} CC0 surfaces` : ''}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="glass" onClick={() => setPreview(s)} aria-label={`Preview ${s.title}`}><BookOpen />Preview</Button>
        <Button type="button" size="icon" variant="ghost" title={`Download ${s.title}`} aria-label={`Download ${s.title}`} onClick={() => getPackage(s)}><Download /></Button>
        {projectId && canEdit && <Button type="button" size="sm" disabled={!!busy} onClick={() => add(s)} aria-label={`Add ${s.title} to project`}><Plus />{busy === s.id ? 'Adding…' : 'Add'}</Button>}
      </div>
    </article>)}</div>
    {!items.length && <p className="py-12 text-center text-muted-foreground">No skills match your search.</p>}
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
      {preview && edition && <>
        <DialogTitle className="text-2xl font-normal">{preview.title}</DialogTitle><DialogDescription>{targetLabel(target)} · {preview.category}</DialogDescription>
        <Tabs defaultValue="instructions">
          <TabsList><TabsTrigger value="instructions">Instructions</TabsTrigger><TabsTrigger value="references">References</TabsTrigger></TabsList>
          <TabsContent value="instructions"><pre translate="no" className="max-h-[48dvh] overflow-y-auto whitespace-pre-wrap break-words py-4 font-mono text-xs leading-relaxed">{edition.content}</pre></TabsContent>
          <TabsContent value="references" className="py-4">
            <p className="text-sm text-muted-foreground">Original Ágata instructions based on official documentation. Not an official Roblox or Blender skill.</p>
            <ul className="mt-4 divide-y">{preview.sources.map(s => <li key={s.url}><Button asChild variant="ghost" className="h-auto w-full justify-between whitespace-normal py-3 text-start"><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ExternalLink className="shrink-0" /></a></Button></li>)}</ul>
            {!!preview.references.length && <><h3 className="mt-6 text-lg">Photographic material references</h3><p className="mt-1 text-xs text-muted-foreground">Real-surface diffuse maps, not finished props or particle sprites. CC0; credit retained.</p><div className="mt-4 grid gap-4 sm:grid-cols-3">{preview.references.map(r => <figure key={r.url}><img loading="lazy" src={r.image} alt={`${r.title} photographic surface reference`} className="aspect-square w-full rounded-lg object-cover" /><figcaption className="mt-2 text-xs"><a className="text-mineral underline underline-offset-4" href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a><p className="mt-1 text-muted-foreground">{r.credit}</p></figcaption></figure>)}</div></>}
          </TabsContent>
        </Tabs>
        <p className="break-all font-mono text-xs text-muted-foreground" translate="no">{skillInstallDir[target](edition.name)}/SKILL.md</p>
        <div className="flex flex-wrap gap-2"><Button variant="glass" onClick={() => getPackage(preview)}><Download />Download ZIP</Button>{projectId && canEdit && <Button disabled={!!busy} onClick={() => add(preview)}><Plus />{busy ? 'Adding…' : 'Add to project'}</Button>}</div>
      </>}
    </DialogContent></Dialog>
  </div>;
}