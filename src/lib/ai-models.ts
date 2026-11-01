/** Browser-safe model + skill compatibility rules shared by UI and server. */

export type AiProvider = 'openai' | 'anthropic' | 'google' | 'openrouter';
export type SkillTarget = 'claude_code' | 'codex' | 'gemini_cli';
export type ModelFamily = 'openai' | 'anthropic' | 'google' | 'other';

/** A model choice: Ágata's built-in models, or one of the user's own provider keys. */
export type ModelChoice = { source: 'builtin' | AiProvider; model: string };

export const providers: { id: AiProvider; label: string; placeholder: string; example: string }[] = [
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-…', example: 'gpt-5.4' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-…', example: 'claude-sonnet-4-5' },
  { id: 'google', label: 'Google Gemini', placeholder: 'AIza…', example: 'gemini-2.5-pro' },
  { id: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-…', example: 'anthropic/claude-sonnet-4.5' },
];

export const builtinModels = [
  { id: 'openai/gpt-6-astra', label: 'GPT-6 Astra (Ágata)' },
  { id: 'openai/gpt-6-sol', label: 'GPT-6 Sol (Ágata)' },
  { id: 'openai/gpt-6-luna', label: 'GPT-6 Luna (Ágata)' },
];

export const DEFAULT_BUILTIN = 'openai/gpt-6-astra';

export const skillTargets: { id: SkillTarget; label: string; family: Exclude<ModelFamily, 'other'>; familyLabel: string }[] = [
  { id: 'claude_code', label: 'Claude Code', family: 'anthropic', familyLabel: 'Claude models' },
  { id: 'codex', label: 'Codex', family: 'openai', familyLabel: 'OpenAI GPT models' },
  { id: 'gemini_cli', label: 'Gemini CLI', family: 'google', familyLabel: 'Gemini models' },
];

export const targetLabel = (t: SkillTarget) => skillTargets.find(s => s.id === t)?.label ?? t;

/** Which model family a choice belongs to. OpenRouter models are identified by their vendor prefix. */
export function modelFamily(choice: ModelChoice): ModelFamily {
  const m = choice.model.trim().toLowerCase();
  if (choice.source === 'openai') return 'openai';
  if (choice.source === 'anthropic') return 'anthropic';
  if (choice.source === 'google') return 'google';
  const vendor = m.split('/')[0];
  if (vendor === 'openai') return 'openai';
  if (vendor === 'anthropic') return 'anthropic';
  if (vendor === 'google') return 'google';
  return 'other';
}

/** A skill only works with the model family it was designed for (Claude Code → Claude, Codex → GPT, Gemini CLI → Gemini). */
export function canUseSkill(target: SkillTarget, choice: ModelChoice): boolean {
  const t = skillTargets.find(s => s.id === target);
  return !!t && modelFamily(choice) === t.family;
}

export function isValidModelChoice(choice: ModelChoice): boolean {
  if (choice.source === 'builtin') return builtinModels.some(m => m.id === choice.model);
  return providers.some(p => p.id === choice.source) && /^[A-Za-z0-9._:/-]{1,120}$/.test(choice.model);
}
