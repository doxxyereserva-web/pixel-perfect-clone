import { describe, expect, it } from 'vitest';
import { canUseSkill, isValidModelChoice } from '@/lib/ai-models';
import { notePath, skillFiles } from '@/lib/skills';

describe('skills only work with the model they were designed for', () => {
  it('Claude Code skills need a Claude model', () => {
    expect(canUseSkill('claude_code', { source: 'anthropic', model: 'claude-sonnet-4-5' })).toBe(true);
    expect(canUseSkill('claude_code', { source: 'openrouter', model: 'anthropic/claude-sonnet-4.5' })).toBe(true);
    expect(canUseSkill('claude_code', { source: 'openai', model: 'gpt-5.4' })).toBe(false);
    expect(canUseSkill('claude_code', { source: 'builtin', model: 'openai/gpt-6-astra' })).toBe(false);
  });
  it('Codex skills need an OpenAI model', () => {
    expect(canUseSkill('codex', { source: 'builtin', model: 'openai/gpt-6-astra' })).toBe(true);
    expect(canUseSkill('codex', { source: 'openai', model: 'gpt-5.4' })).toBe(true);
    expect(canUseSkill('codex', { source: 'google', model: 'gemini-2.5-pro' })).toBe(false);
  });
  it('Gemini CLI skills need a Gemini model', () => {
    expect(canUseSkill('gemini_cli', { source: 'google', model: 'gemini-2.5-pro' })).toBe(true);
    expect(canUseSkill('gemini_cli', { source: 'openrouter', model: 'meta/llama-4' })).toBe(false);
  });
  it('packages each skill into its own tool folder', () => {
    expect(skillFiles({ name: 'combat', description: 'd', target: 'claude_code', content: 'x' })[0]!.path).toBe('.claude/skills/combat/SKILL.md');
    expect(skillFiles({ name: 'combat', description: 'd', target: 'codex', content: 'x' })[0]!.path).toBe('.codex/skills/combat/SKILL.md');
  });
});

describe('inputs', () => {
  it('rejects unknown built-in models', () => {
    expect(isValidModelChoice({ source: 'builtin', model: 'openai/gpt-6-astra' })).toBe(true);
    expect(isValidModelChoice({ source: 'builtin', model: 'some/other' })).toBe(false);
  });
  it('only accepts safe relative .md note paths', () => {
    expect(notePath('Systems\\Combat.md')).toBe('Systems/Combat.md');
    expect(notePath('../secret.md')).toBeNull();
    expect(notePath('image.png')).toBeNull();
  });
});
