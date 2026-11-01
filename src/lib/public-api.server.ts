import { z } from 'zod';
import { sha256Hex } from './crypto.server';
import { skillFiles } from './skills';

/**
 * Ágata REST API, authenticated with personal API keys (Authorization: Bearer agt_…).
 * Runs with the admin client after the key is verified, so every query re-applies
 * the same access rules as RLS: view = public / owner / workspace member, edit = owner / workspace admin.
 */
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Access-Control-Allow-Origin': '*' } });
const err = (status: number, message: string) => json({ error: message }, status);

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

const notePath = z.string().min(1).max(300).regex(/\.md$/i).refine(p => !p.includes('..') && !p.startsWith('/'));

export async function handleApi(request: Request, splat: string) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(agt_[a-f0-9]{48})$/)?.[1];
  if (!token) return err(401, 'Missing or invalid API key.');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data: key } = await db.from('api_keys').select('id, user_id').eq('key_hash', await sha256Hex(token)).maybeSingle();
  if (!key) return err(401, 'Missing or invalid API key.');
  void db.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id).then(() => {});
  const userId = key.user_id;

  const { data: memberships } = await db.from('workspace_members').select('workspace_id, role').eq('user_id', userId);
  const member = new Map((memberships ?? []).map(m => [m.workspace_id, m.role]));
  type P = { id: string; owner_id: string; workspace_id: string | null; visibility: string };
  const canView = (p: P) => p.visibility === 'public' || p.owner_id === userId || (!!p.workspace_id && member.has(p.workspace_id));
  const canEdit = (p: P) => p.owner_id === userId || (!!p.workspace_id && ['owner', 'admin'].includes(member.get(p.workspace_id) ?? ''));

  const parts = splat.split('/').filter(Boolean).map(decodeURIComponent);
  const method = request.method;

  if (parts[0] !== 'projects') return err(404, 'Not found.');

  if (parts.length === 1 && method === 'GET') {
    const ws = [...member.keys()];
    let q = db.from('projects').select('id, name, purpose, visibility, workspace_id, updated_at').order('updated_at', { ascending: false }).limit(200);
    q = ws.length ? q.or(`owner_id.eq.${userId},workspace_id.in.(${ws.join(',')})`) : q.eq('owner_id', userId);
    const { data, error } = await q;
    return error ? err(500, error.message) : json({ projects: data });
  }

  const id = parts[1];
  if (!id || !z.string().uuid().safeParse(id).success) return err(404, 'Not found.');
  const { data: p } = await db.from('projects').select('id, owner_id, workspace_id, visibility, name, purpose, guide, mcp_url, skill_url, models, uses_lovable_api, updated_at').eq('id', id).maybeSingle();
  if (!p || !canView(p)) return err(404, 'Project not found.');

  if (parts.length === 2 && method === 'GET') {
    const { owner_id: _o, ...project } = p;
    return json({ project });
  }

  if (parts[2] === 'skills' && parts.length === 3 && method === 'GET') {
    const { data } = await db.from('project_skills').select('id, name, description, target, content').eq('project_id', id).order('name');
    return json({ skills: (data ?? []).map(s => ({ ...s, files: skillFiles(s) })) });
  }

  if (parts[2] === 'notes') {
    if (parts.length === 3 && method === 'GET') {
      const { data } = await db.from('project_notes').select('path, updated_at').eq('project_id', id).order('path').limit(2000);
      return json({ notes: data ?? [] });
    }
    const path = parts.slice(3).join('/');
    if (!notePath.safeParse(path).success) return err(400, 'Note paths are relative and end in .md');
    if (method === 'GET') {
      const { data } = await db.from('project_notes').select('path, content, updated_at').eq('project_id', id).eq('path', path).maybeSingle();
      return data ? json({ note: data }) : err(404, 'Note not found.');
    }
    if (!canEdit(p)) return err(403, 'You can view this project but not edit it.');
    if (method === 'PUT') {
      const body = await request.text();
      if (body.length > 200000) return err(413, 'Notes are limited to 200,000 characters.');
      const content = (request.headers.get('content-type') ?? '').includes('application/json')
        ? z.object({ content: z.string() }).safeParse(JSON.parse(body || '{}')).data?.content
        : body;
      if (content === undefined) return err(400, 'Send the note as text/markdown or {"content": "…"}.');
      const { error } = await db.from('project_notes').upsert({ project_id: id, path, content, updated_by: userId }, { onConflict: 'project_id,path' });
      return error ? err(500, error.message) : json({ ok: true, path });
    }
    if (method === 'DELETE') {
      await db.from('project_notes').delete().eq('project_id', id).eq('path', path);
      return json({ ok: true });
    }
  }
  return err(404, 'Not found.');
}
