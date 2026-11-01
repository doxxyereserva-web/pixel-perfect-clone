import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Download, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, Pill, errorMessage } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_BUILTIN, skillTargets, targetLabel, type ModelChoice, type SkillTarget } from '@/lib/ai-models';
import { skillFiles, skillInstallDir, skillSlug } from '@/lib/skills';
import { generateAsset } from '@/lib/tools.functions';
import { download, makeZip } from '@/lib/zip';
import { ModelPicker } from './ModelPicker';
import { SkillLibrary } from './SkillLibrary';

type Skill = { id: string; name: string; description: string; target: SkillTarget; content: string };

export function useSkills(projectId: string) {
  return useQuery({
    queryKey: ['skills', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_skills').select('id, name, description, target, content').eq('project_id', projectId).order('name');
      if (error) throw error;
      return data as Skill[];
    },
  });
}

export function downloadSkill(s: Skill) {
  download(makeZip(skillFiles(s)), `${s.name}-${s.target.replace('_', '-')}.zip`);
}

export function SkillsTab({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const { data: skills = [] } = useSkills(projectId);
  const [editing, setEditing] = useState<Partial<Skill> | null>(null);

  return <div className="py-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-xl text-sm text-muted-foreground">Each skill is built for one tool and packaged in that tool’s folder, so it only loads where it was designed to work: Claude Code with Claude, Codex with GPT, Gemini CLI with Gemini.</p>
      {canEdit && <Button type="button" className="rounded-full" onClick={() => setEditing({ target: 'claude_code', name: '', description: '', content: '' })}><Plus /> New skill</Button>}
    </div>
    {!skills.length && <EmptyState mood="curious" title="No skills yet" text={canEdit ? 'Write one yourself or let AI draft it from the project’s purpose and guide.' : 'This project has no skills yet.'} />}
    <ul className="mt-4 divide-y">
      {skills.map(s => <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-sm" translate="no">{s.name}</p><Pill>{targetLabel(s.target)}</Pill></div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground" translate="no">{skillInstallDir[s.target](s.name)}/SKILL.md</p></div>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="glass" className="rounded-full" onClick={() => downloadSkill(s)}><Download /> Download</Button>
          {canEdit && <>
            <Button type="button" size="sm" variant="ghost" className="rounded-full" aria-label="Edit" onClick={() => setEditing(s)}><Pencil /></Button>
            <DeleteSkill id={s.id} projectId={projectId} />
          </>}
        </div>
      </li>)}
    </ul>
    <section className="mt-8 border-t pt-8"><h2 className="mb-5 text-2xl font-normal">Ready-made skills</h2><SkillLibrary projectId={projectId} canEdit={canEdit} /></section>
    <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg sm:max-w-2xl">{editing && <SkillForm projectId={projectId} initial={editing} onDone={() => setEditing(null)} />}</DialogContent>
    </Dialog>
  </div>;
}

function DeleteSkill({ id, projectId }: { id: string; projectId: string }) {
  const qc = useQueryClient();
  return <Button type="button" size="sm" variant="ghost" className="rounded-full text-destructive hover:text-destructive" aria-label="Delete" onClick={async () => {
    if (!confirm('Delete this skill?')) return;
    const { error } = await supabase.from('project_skills').delete().eq('id', id);
    if (error) return toast.error(errorMessage(error));
    qc.invalidateQueries({ queryKey: ['skills', projectId] });
  }}><Trash2 /></Button>;
}

function SkillForm({ projectId, initial, onDone }: { projectId: string; initial: Partial<Skill>; onDone: () => void }) {
  const qc = useQueryClient();
  const generate = useServerFn(generateAsset);
  const [f, setF] = useState({ name: initial.name ?? '', description: initial.description ?? '', target: initial.target ?? 'claude_code' as SkillTarget, content: initial.content ?? '' });
  const [choice, setChoice] = useState<ModelChoice>({ source: 'builtin', model: DEFAULT_BUILTIN });
  const [busy, setBusy] = useState<'save' | 'ai' | null>(null);

  async function draft() {
    setBusy('ai');
    try {
      const { text } = await generate({ data: { projectId, choice, kind: 'skill', target: f.target, brief: [f.name && `Skill name: ${f.name}.`, f.description && `It should: ${f.description}`].filter(Boolean).join(' ') } });
      setF(v => ({ ...v, content: text }));
    } catch (e) { toast.error(errorMessage(e)); }
    setBusy(null);
  }

  async function save() {
    const name = skillSlug(f.name);
    if (!name) return toast.error('Give the skill a name.');
    if (!f.description.trim()) return toast.error('Describe when the skill should be used.');
    setBusy('save');
    const row = { project_id: projectId, name, description: f.description.trim(), target: f.target, content: f.content };
    const { error } = initial.id ? await supabase.from('project_skills').update(row).eq('id', initial.id) : await supabase.from('project_skills').insert(row);
    setBusy(null);
    if (error) return toast.error(error.code === '23505' ? 'A skill with this name already exists for that tool.' : errorMessage(error));
    qc.invalidateQueries({ queryKey: ['skills', projectId] });
    onDone();
  }

  const t = skillTargets.find(s => s.id === f.target);
  if (!t) return null;
  return <div className="grid gap-4">
    <DialogTitle className="text-2xl font-normal">{initial.id ? 'Edit skill' : 'New skill'}</DialogTitle>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5"><Label htmlFor="s-name">Name</Label><Input id="s-name" value={f.name} onChange={e => setF(v => ({ ...v, name: e.target.value }))} onBlur={() => setF(v => ({ ...v, name: skillSlug(v.name) }))} placeholder="combat-system" className="font-mono" translate="no" /></div>
      <div className="grid gap-1.5"><Label>Built for</Label>
        <Select value={f.target} onValueChange={v => setF(x => ({ ...x, target: v as SkillTarget }))}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{skillTargets.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div>
    </div>
    <p className="-mt-2 text-xs text-muted-foreground">Works only with {t.familyLabel}. Installs to <span className="font-mono" translate="no">{skillInstallDir[f.target](skillSlug(f.name) || 'name')}/</span></p>
    <div className="grid gap-1.5"><Label htmlFor="s-desc">When to use it</Label><Textarea id="s-desc" rows={2} maxLength={500} value={f.description} onChange={e => setF(v => ({ ...v, description: e.target.value }))} placeholder="Use when editing the combat scripts of this game." /></div>
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-end justify-between gap-2"><Label htmlFor="s-content">Instructions (SKILL.md)</Label>
        <div className="flex flex-wrap items-center gap-2"><ModelPicker value={choice} onChange={setChoice} /><Button type="button" size="sm" variant="glass" className="rounded-full" disabled={!!busy} onClick={draft}><Sparkles /> {busy === 'ai' ? 'Writing…' : 'Draft with AI'}</Button></div></div>
      <Textarea id="s-content" rows={14} maxLength={100000} value={f.content} onChange={e => setF(v => ({ ...v, content: e.target.value }))} className="font-mono text-xs leading-relaxed" translate="no" />
    </div>
    <Button type="button" disabled={!!busy} className="rounded-full" onClick={save}>Save skill</Button>
  </div>;
}
