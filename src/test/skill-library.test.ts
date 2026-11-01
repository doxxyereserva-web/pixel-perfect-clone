import { describe, expect, it } from 'vitest';
import { filterLibrarySkills, librarySkillForTarget, readySkills } from '@/lib/skill-library';
import { canUseSkill, type SkillTarget } from '@/lib/ai-models';
import { skillFiles } from '@/lib/skills';

describe('ready-made creative skills', () => {
  it('includes usable VFX and 3D workflows', () => {
    expect(filterLibrarySkills('VFX', '').map(s => s.id)).toEqual(['roblox-particle-impact', 'roblox-beams-trails']);
    expect(filterLibrarySkills('3D modeling', '').map(s => s.id)).toEqual(['blender-hard-surface-props']);
    expect(filterLibrarySkills('All', 'rigging').map(s => s.id)).toEqual(['blender-rig-animation']);
  });
  it('keeps real source and photographic provenance in project copies and downloads', () => {
    const skill = readySkills.find(s => s.id === 'uv-photographic-pbr');
    if (!skill) throw new Error('Missing material skill');
    const edition = librarySkillForTarget(skill, 'codex');
    expect(edition.content).toContain('https://create.roblox.com/docs/art/modeling/surface-appearance');
    expect(edition.content).toContain('https://polyhaven.com/a/brown_planks_03');
    expect(edition.content).toContain('Rob Tuytel / Poly Haven · CC0');
    expect(skill.references).toHaveLength(3);
    expect(skill.references.every(r => r.image.startsWith('/__l5e/assets-v1/'))).toBe(true);
  });
  const cases: [SkillTarget, string, 'anthropic' | 'openai' | 'google', string][] = [
    ['claude_code', '.claude', 'anthropic', 'claude-sonnet-4-5'],
    ['codex', '.codex', 'openai', 'gpt-5.4'],
    ['gemini_cli', '.gemini', 'google', 'gemini-2.5-pro'],
  ];
  it.each(cases)('locks %s editions to their tool and model family', (target, dir, source, model) => {
    const skill = readySkills.find(s => s.id === 'roblox-particle-impact');
    if (!skill) throw new Error('Missing VFX skill');
    const edition = librarySkillForTarget(skill, target);
    expect(skillFiles(edition)[0]?.path).toBe(`${dir}/skills/roblox-particle-impact/SKILL.md`);
    expect(canUseSkill(edition.target, { source, model })).toBe(true);
    expect(canUseSkill(edition.target, { source: 'openrouter', model: 'meta/llama-4' })).toBe(false);
  });
});