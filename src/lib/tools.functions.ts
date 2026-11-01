import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { canUseSkill, isValidModelChoice, targetLabel, type ModelChoice, type SkillTarget } from './ai-models';

const providerSchema = z.enum(['openai', 'anthropic', 'google', 'openrouter']);
const choiceSchema = z.object({ source: z.enum(['builtin', 'openai', 'anthropic', 'google', 'openrouter']), model: z.string().min(1).max(120) })
  .refine(c => isValidModelChoice(c as ModelChoice), 'Unknown model');

// ---------- Own AI provider keys ----------
export const saveAiKey = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ provider: providerSchema, key: z.string().trim().min(10).max(500) }).parse(i))
  .handler(async ({ data, context }) => {
    const { encryptSecret, hint } = await import('./crypto.server');
    const { error } = await context.supabase.from('user_ai_keys').upsert(
      { user_id: context.userId, provider: data.provider, key_encrypted: await encryptSecret(data.key), key_hint: hint(data.key) },
      { onConflict: 'user_id,provider' },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Ágata API keys ----------
export const createApiKey = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ name: z.string().trim().min(1).max(60) }).parse(i))
  .handler(async ({ data, context }) => {
    const { sha256Hex } = await import('./crypto.server');
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const key = 'agt_' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    const { error } = await context.supabase.from('api_keys').insert({ user_id: context.userId, name: data.name, prefix: key.slice(0, 10), key_hash: await sha256Hex(key) });
    if (error) throw new Error(error.message);
    return { key };
  });

// ---------- External MCP connections ----------
export const saveConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid().optional(), projectId: z.string().uuid(),
    name: z.string().trim().min(1).max(80), url: z.string().trim().url().max(500).startsWith('https://'),
    authHeader: z.string().regex(/^[A-Za-z0-9-]{1,64}$/).nullable(), secret: z.string().max(2000).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { encryptSecret, hint } = await import('./crypto.server');
    const row: Record<string, unknown> = { project_id: data.projectId, name: data.name, url: data.url, auth_header: data.authHeader };
    if (data.secret !== undefined) {
      row.secret_encrypted = data.secret ? await encryptSecret(data.secret) : null;
      row.secret_hint = data.secret ? hint(data.secret) : null;
    }
    const q = data.id
      ? context.supabase.from('project_connections').update(row).eq('id', data.id).eq('project_id', data.projectId)
      : context.supabase.from('project_connections').insert(row as { project_id: string; name: string; url: string });
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: c, error } = await context.supabase.from('project_connections').select('url, auth_header, secret_encrypted').eq('id', data.id).maybeSingle();
    if (error || !c) throw new Error('Connection not found.');
    const { decryptSecret } = await import('./crypto.server');
    const { probeMcp } = await import('./mcp-client.server');
    let status: string, tools: string[] = [];
    try {
      const auth = c.auth_header && c.secret_encrypted ? { header: c.auth_header, value: await decryptSecret(c.secret_encrypted) } : undefined;
      const r = await probeMcp(c.url, auth);
      tools = r.tools; status = `Connected to ${r.server}`;
    } catch (e) {
      status = `Failed: ${e instanceof Error ? e.message : 'unknown error'}`.slice(0, 300);
    }
    await context.supabase.from('project_connections').update({ last_status: status, last_tools: tools, last_checked_at: new Date().toISOString() }).eq('id', data.id);
    return { status, tools };
  });

// ---------- AI: assistant + generators ----------
async function projectContext(supabase: Parameters<typeof import('./ai.server').runModel>[0]['supabase'], projectId: string) {
  const { data: p, error } = await supabase.from('projects').select('name, purpose, guide, models').eq('id', projectId).maybeSingle();
  if (error || !p) throw new Error('Project not found.');
  const { data: notes } = await supabase.from('project_notes').select('path').eq('project_id', projectId).limit(200);
  return `Project: ${p.name}\nPurpose: ${p.purpose ?? '(not written yet)'}\nModels: ${p.models.join(', ') || '(none listed)'}\nNotes in vault: ${(notes ?? []).map(n => n.path).join(', ') || '(none)'}\n\nGuide:\n${(p.guide ?? '(not written yet)').slice(0, 12000)}`;
}

export const projectChat = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string().uuid(), choice: choiceSchema, skillId: z.string().uuid().nullable(),
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(20000) })).min(1).max(40),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { runModel } = await import('./ai.server');
    let system = `You are Ágata's project assistant for Roblox Studio creators. Be concise and practical. Answer in the user's language.\n\n${await projectContext(context.supabase, data.projectId)}`;
    if (data.skillId) {
      const { data: s } = await context.supabase.from('project_skills').select('name, target, content, project_id').eq('id', data.skillId).maybeSingle();
      if (!s || s.project_id !== data.projectId) throw new Error('Skill not found.');
      if (!canUseSkill(s.target, data.choice as ModelChoice)) throw new Error(`The “${s.name}” skill is built for ${targetLabel(s.target)} and only works with its model family.`);
      system += `\n\nActive skill “${s.name}”:\n${s.content.slice(0, 30000)}`;
    }
    const text = await runModel({ supabase: context.supabase, userId: context.userId, choice: data.choice as ModelChoice, system, messages: data.messages });
    return { text };
  });

export const generateAsset = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string().uuid(), choice: choiceSchema, kind: z.enum(['guide', 'skill']),
    target: z.enum(['claude_code', 'codex', 'gemini_cli']).optional(), brief: z.string().max(2000).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { runModel } = await import('./ai.server');
    const ctx = await projectContext(context.supabase, data.projectId);
    const prompt = data.kind === 'guide'
      ? `Write a clear setup and usage guide in Markdown for this project. Use headings and numbered steps. ${data.brief ?? ''}`
      : `Write the body of an agent skill (SKILL.md instructions, no frontmatter) for ${targetLabel(data.target as SkillTarget)} that teaches the agent how to work on this project: conventions, steps, pitfalls. Markdown only. ${data.brief ?? ''}`;
    const text = await runModel({ supabase: context.supabase, userId: context.userId, choice: data.choice as ModelChoice, system: `You write documentation for Roblox Studio projects on Ágata.\n\n${ctx}`, messages: [{ role: 'user', content: prompt }] });
    return { text: text.replace(/^```(?:markdown|md)?\n([\s\S]*?)\n```\s*$/, '$1') };
  });
