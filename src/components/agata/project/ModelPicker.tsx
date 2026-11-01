import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { builtinModels, providers, type AiProvider, type ModelChoice } from '@/lib/ai-models';

export function useMyAiKeys() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-keys', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_ai_keys').select('id, provider, key_hint, created_at').eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
  });
}

/** Choose Ágata's built-in models or a model on one of your own provider keys. */
export function ModelPicker({ value, onChange }: { value: ModelChoice; onChange: (v: ModelChoice) => void }) {
  const { data: keys = [] } = useMyAiKeys();
  const own = providers.filter(p => keys.some(k => k.provider === p.id));
  const selectValue = value.source === 'builtin' ? `builtin:${value.model}` : `own:${value.source}`;
  const current = providers.find(p => p.id === value.source);
  return <div className="flex flex-wrap items-center gap-2">
    <Select value={selectValue} onValueChange={v => {
      const [kind, id] = v.split(':') as [string, string];
      if (kind === 'builtin') onChange({ source: 'builtin', model: id });
      else onChange({ source: id as AiProvider, model: providers.find(p => p.id === id)!.example });
    }}>
      <SelectTrigger className="h-9 w-56 rounded-full text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectGroup><SelectLabel>Ágata</SelectLabel>{builtinModels.map(m => <SelectItem key={m.id} value={`builtin:${m.id}`}>{m.label}</SelectItem>)}</SelectGroup>
        <SelectGroup><SelectLabel>Your keys</SelectLabel>
          {own.length ? own.map(p => <SelectItem key={p.id} value={`own:${p.id}`}>{p.label} (your key)</SelectItem>)
            : <div className="px-2 py-1.5 text-xs text-muted-foreground">Add keys in Dashboard → Connections</div>}
        </SelectGroup>
      </SelectContent>
    </Select>
    {current && <Input aria-label="Model id" value={value.model} placeholder={current.example} onChange={e => onChange({ ...value, model: e.target.value.trim() })} className="h-9 w-56 rounded-full font-mono text-xs" translate="no" />}
  </div>;
}
