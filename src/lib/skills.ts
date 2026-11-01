import type { SkillTarget } from './ai-models';

export type SkillLike = { name: string; description: string; target: SkillTarget; content: string };

const yaml = (s: string) => JSON.stringify(s.replace(/\s+/g, ' ').trim());

/** Where each tool loads skills from, so a downloaded package only installs into the tool it was designed for. */
export const skillInstallDir: Record<SkillTarget, (name: string) => string> = {
  claude_code: n => `.claude/skills/${n}`,
  codex: n => `.codex/skills/${n}`,
  gemini_cli: n => `.gemini/skills/${n}`,
};

export function skillMarkdown(s: SkillLike) {
  return `---\nname: ${s.name}\ndescription: ${yaml(s.description)}\n---\n\n${s.content.trim()}\n`;
}

export function skillFiles(s: SkillLike): { path: string; content: string }[] {
  return [{ path: `${skillInstallDir[s.target](s.name)}/SKILL.md`, content: skillMarkdown(s) }];
}

/** Slugify a name into a valid skill id. */
export const skillSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63);

/** Normalise an Obsidian/relative note path; returns null when it is not a safe .md path. */
export function notePath(raw: string): string | null {
  const p = raw.replace(/\\/g, '/').split('/').filter(Boolean).join('/').trim();
  if (!p || p.length > 300 || p.includes('..') || !p.toLowerCase().endsWith('.md')) return null;
  return p;
}
