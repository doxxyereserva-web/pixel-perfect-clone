import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowUp, Eraser } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mascot } from '@/components/agata/Logo';
import { errorMessage } from '@/components/agata/account';
import { canUseSkill, DEFAULT_BUILTIN, skillTargets, targetLabel, type ModelChoice } from '@/lib/ai-models';
import { projectChat } from '@/lib/tools.functions';
import { ModelPicker } from './ModelPicker';
import { useSkills } from './SkillsTab';

type Turn = { role: 'user' | 'assistant'; content: string };

export function AssistantTab({ projectId }: { projectId: string }) {
  const chat = useServerFn(projectChat);
  const { data: skills = [] } = useSkills(projectId);
  const [choice, setChoice] = useState<ModelChoice>({ source: 'builtin', model: DEFAULT_BUILTIN });
  const [skillId, setSkillId] = useState<string>('none');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [turns.length, busy]);

  const skill = skills.find(s => s.id === skillId);
  const skillBlocked = !!skill && !canUseSkill(skill.target, choice);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    if (skillBlocked) return toast.error(`“${skill!.name}” only works with ${skillTargets.find(t => t.id === skill!.target)!.familyLabel}.`);
    const next = [...turns, { role: 'user' as const, content: text }];
    setTurns(next); setInput(''); setBusy(true);
    try {
      const r = await chat({ data: { projectId, choice, skillId: skill ? skill.id : null, messages: next.slice(-40) } });
      setTurns([...next, { role: 'assistant', content: r.text }]);
    } catch (e) { toast.error(errorMessage(e)); setTurns(turns); setInput(text); }
    setBusy(false);
  }

  return <div className="py-6">
    <div className="flex flex-wrap items-center gap-2">
      <ModelPicker value={choice} onChange={setChoice} />
      <Select value={skillId} onValueChange={setSkillId}>
        <SelectTrigger className="h-9 w-56 rounded-full text-xs"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="none">No skill</SelectItem>
          {skills.map(s => <SelectItem key={s.id} value={s.id} disabled={!canUseSkill(s.target, choice)}>{s.name} · {targetLabel(s.target)}</SelectItem>)}</SelectContent>
      </Select>
      {!!turns.length && <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setTurns([])}><Eraser /> Clear</Button>}
    </div>
    {skillBlocked && <p className="mt-2 text-xs text-destructive">This skill is built for {targetLabel(skill!.target)}. Pick a {skillTargets.find(t => t.id === skill!.target)!.familyLabel.replace(' models', '')} model to use it.</p>}

    <div className="mt-6 grid min-h-[320px] content-start gap-4 rounded-lg border bg-card/50 p-4 sm:p-6">
      {!turns.length && <div className="flex flex-col items-center py-10 text-center"><Mascot mood="curious" className="size-14" />
        <p className="mt-3 text-sm text-muted-foreground">Ask about this project. The assistant knows its purpose, guide and vault.</p></div>}
      {turns.map((t, i) => <div key={i} className={t.role === 'user' ? 'ms-auto max-w-[85%] rounded-2xl bg-secondary px-4 py-2.5 text-sm' : 'max-w-[95%] whitespace-pre-wrap text-sm leading-relaxed'} translate="no">{t.content}</div>)}
      {busy && <p className="text-sm text-muted-foreground">Thinking…</p>}
      <div ref={end} />
    </div>
    <form className="mt-3 flex items-end gap-2" onSubmit={e => { e.preventDefault(); void send(); }}>
      <Textarea value={input} onChange={e => setInput(e.target.value)} rows={2} maxLength={20000} placeholder="Message the assistant…" className="min-h-0 resize-none rounded-2xl"
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} />
      <Button disabled={busy || !input.trim()} size="icon" className="size-10 shrink-0 rounded-full" aria-label="Send"><ArrowUp /></Button>
    </form>
  </div>;
}
