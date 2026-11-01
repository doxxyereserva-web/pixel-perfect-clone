create or replace function public.can_view_project(_project uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects p where p.id = _project and (
    p.visibility = 'public' or p.owner_id = _user
    or (p.workspace_id is not null and public.is_workspace_member(p.workspace_id, _user))))
$$;
create or replace function public.can_edit_project(_project uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects p where p.id = _project and (
    p.owner_id = _user or (p.workspace_id is not null and public.is_workspace_admin(p.workspace_id, _user))))
$$;
grant execute on function public.can_view_project(uuid, uuid) to anon, authenticated;
grant execute on function public.can_edit_project(uuid, uuid) to authenticated;

create table public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  path text not null check (char_length(path) between 1 and 300 and path ~ '\.md$' and path !~ '(^/|\.\.)'),
  content text not null default '' check (char_length(content) <= 200000),
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);
grant select on public.project_notes to anon;
grant select, insert, update, delete on public.project_notes to authenticated;
grant all on public.project_notes to service_role;
alter table public.project_notes enable row level security;
create policy "View notes of visible projects" on public.project_notes for select to anon, authenticated using (public.can_view_project(project_id, auth.uid()));
create policy "Editors insert notes" on public.project_notes for insert to authenticated with check (public.can_edit_project(project_id, auth.uid()));
create policy "Editors update notes" on public.project_notes for update to authenticated using (public.can_edit_project(project_id, auth.uid())) with check (public.can_edit_project(project_id, auth.uid()));
create policy "Editors delete notes" on public.project_notes for delete to authenticated using (public.can_edit_project(project_id, auth.uid()));
create trigger project_notes_touch before update on public.project_notes for each row execute function public.touch_updated_at();

create type public.skill_target as enum ('claude_code', 'codex', 'gemini_cli');
create table public.project_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (name ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  description text not null check (char_length(description) between 1 and 500),
  target public.skill_target not null,
  content text not null default '' check (char_length(content) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name, target)
);
grant select on public.project_skills to anon;
grant select, insert, update, delete on public.project_skills to authenticated;
grant all on public.project_skills to service_role;
alter table public.project_skills enable row level security;
create policy "View skills of visible projects" on public.project_skills for select to anon, authenticated using (public.can_view_project(project_id, auth.uid()));
create policy "Editors insert skills" on public.project_skills for insert to authenticated with check (public.can_edit_project(project_id, auth.uid()));
create policy "Editors update skills" on public.project_skills for update to authenticated using (public.can_edit_project(project_id, auth.uid())) with check (public.can_edit_project(project_id, auth.uid()));
create policy "Editors delete skills" on public.project_skills for delete to authenticated using (public.can_edit_project(project_id, auth.uid()));
create trigger project_skills_touch before update on public.project_skills for each row execute function public.touch_updated_at();

create table public.project_connections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  url text not null check (url ~ '^https://' and char_length(url) <= 500),
  auth_header text check (auth_header is null or auth_header ~ '^[A-Za-z0-9-]{1,64}$'),
  secret_encrypted text,
  secret_hint text,
  last_status text,
  last_tools text[] not null default '{}',
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.project_connections to authenticated;
grant all on public.project_connections to service_role;
alter table public.project_connections enable row level security;
create policy "Editors see connections" on public.project_connections for select to authenticated using (public.can_edit_project(project_id, auth.uid()));
create policy "Editors insert connections" on public.project_connections for insert to authenticated with check (public.can_edit_project(project_id, auth.uid()));
create policy "Editors update connections" on public.project_connections for update to authenticated using (public.can_edit_project(project_id, auth.uid())) with check (public.can_edit_project(project_id, auth.uid()));
create policy "Editors delete connections" on public.project_connections for delete to authenticated using (public.can_edit_project(project_id, auth.uid()));
create trigger project_connections_touch before update on public.project_connections for each row execute function public.touch_updated_at();

create type public.ai_provider as enum ('openai', 'anthropic', 'google', 'openrouter');
create table public.user_ai_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider public.ai_provider not null,
  key_encrypted text not null,
  key_hint text not null,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);
grant select, insert, update, delete on public.user_ai_keys to authenticated;
grant all on public.user_ai_keys to service_role;
alter table public.user_ai_keys enable row level security;
create policy "Own AI keys" on public.user_ai_keys for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.api_keys to authenticated;
grant all on public.api_keys to service_role;
alter table public.api_keys enable row level security;
create policy "Own API keys select" on public.api_keys for select to authenticated using (user_id = auth.uid());
create policy "Own API keys insert" on public.api_keys for insert to authenticated with check (user_id = auth.uid());
create policy "Own API keys delete" on public.api_keys for delete to authenticated using (user_id = auth.uid());