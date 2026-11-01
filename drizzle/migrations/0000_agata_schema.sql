create type public.visibility as enum ('public', 'private');
create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.creation_kind as enum ('script', 'vfx', 'model', 'tool', 'resource');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text check (char_length(display_name) <= 60),
  bio text check (char_length(bio) <= 400),
  avatar_url text,
  banner_url text,
  is_public boolean not null default true,
  show_creations boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 400),
  owner_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.workspaces to authenticated;
grant all on public.workspaces to service_role;
alter table public.workspaces enable row level security;

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
grant select, insert, update, delete on public.workspace_members to authenticated;
grant all on public.workspace_members to service_role;
alter table public.workspace_members enable row level security;

create or replace function public.workspace_role_of(_workspace uuid, _user uuid)
returns public.workspace_role language sql stable security definer set search_path = public as $$
  select role from public.workspace_members where workspace_id = _workspace and user_id = _user
$$;
create or replace function public.is_workspace_member(_workspace uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = _workspace and user_id = _user)
$$;
create or replace function public.is_workspace_admin(_workspace uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = _workspace and user_id = _user and role in ('owner','admin'))
$$;
create or replace function public.shares_workspace(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members m1
    join public.workspace_members m2 on m1.workspace_id = m2.workspace_id
    where m1.user_id = _a and m2.user_id = _b
  )
$$;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.teams to authenticated;
grant all on public.teams to service_role;
alter table public.teams enable row level security;

create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
grant select, insert, delete on public.team_members to authenticated;
grant all on public.team_members to service_role;
alter table public.team_members enable row level security;

create or replace function public.team_workspace(_team uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select workspace_id from public.teams where id = _team
$$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  purpose text check (char_length(purpose) <= 600),
  guide text check (char_length(guide) <= 20000),
  mcp_url text,
  skill_url text,
  models text[] not null default '{}',
  uses_lovable_api boolean not null default false,
  visibility public.visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;

create table public.creations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text check (char_length(description) <= 1000),
  kind public.creation_kind not null default 'script',
  visibility public.visibility not null default 'private',
  external_url text,
  file_path text,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.creations to anon;
grant select, insert, update, delete on public.creations to authenticated;
grant all on public.creations to service_role;
alter table public.creations enable row level security;

create table public.badges (id text primary key, name text not null, description text not null);
grant select on public.badges to anon, authenticated;
grant all on public.badges to service_role;
alter table public.badges enable row level security;

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
grant select on public.user_badges to anon, authenticated;
grant all on public.user_badges to service_role;
alter table public.user_badges enable row level security;

create policy "Public profiles are visible" on public.profiles for select to anon, authenticated using (is_public);
create policy "Users see own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Workspace peers see each other" on public.profiles for select to authenticated using (public.shares_workspace(auth.uid(), id));
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Members see workspace" on public.workspaces for select to authenticated using (owner_id = auth.uid() or public.is_workspace_member(id, auth.uid()));
create policy "Users create own workspace" on public.workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy "Admins update workspace" on public.workspaces for update to authenticated using (public.is_workspace_admin(id, auth.uid())) with check (public.is_workspace_admin(id, auth.uid()));
create policy "Owner deletes workspace" on public.workspaces for delete to authenticated using (owner_id = auth.uid());

create policy "Members see members" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "Admins add members" on public.workspace_members for insert to authenticated with check (public.is_workspace_admin(workspace_id, auth.uid()) and role <> 'owner');
create policy "Admins change roles" on public.workspace_members for update to authenticated using (public.is_workspace_admin(workspace_id, auth.uid()) and role <> 'owner') with check (role <> 'owner');
create policy "Admins remove or members leave" on public.workspace_members for delete to authenticated using (role <> 'owner' and (public.is_workspace_admin(workspace_id, auth.uid()) or user_id = auth.uid()));

create policy "Members see teams" on public.teams for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "Admins create teams" on public.teams for insert to authenticated with check (public.is_workspace_admin(workspace_id, auth.uid()));
create policy "Admins update teams" on public.teams for update to authenticated using (public.is_workspace_admin(workspace_id, auth.uid())) with check (public.is_workspace_admin(workspace_id, auth.uid()));
create policy "Admins delete teams" on public.teams for delete to authenticated using (public.is_workspace_admin(workspace_id, auth.uid()));

create policy "Members see team members" on public.team_members for select to authenticated using (public.is_workspace_member(public.team_workspace(team_id), auth.uid()));
create policy "Admins add team members" on public.team_members for insert to authenticated with check (public.is_workspace_admin(public.team_workspace(team_id), auth.uid()) and public.is_workspace_member(public.team_workspace(team_id), user_id));
create policy "Admins remove team members" on public.team_members for delete to authenticated using (public.is_workspace_admin(public.team_workspace(team_id), auth.uid()));

create policy "Public projects are visible" on public.projects for select to anon, authenticated using (visibility = 'public');
create policy "Owners and members see projects" on public.projects for select to authenticated using (owner_id = auth.uid() or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid())));
create policy "Users create projects" on public.projects for insert to authenticated with check (owner_id = auth.uid() and (workspace_id is null or public.workspace_role_of(workspace_id, auth.uid()) in ('owner','admin','member')));
create policy "Owners and admins update projects" on public.projects for update to authenticated using (owner_id = auth.uid() or (workspace_id is not null and public.is_workspace_admin(workspace_id, auth.uid()))) with check (workspace_id is null or public.is_workspace_member(workspace_id, auth.uid()));
create policy "Owners and admins delete projects" on public.projects for delete to authenticated using (owner_id = auth.uid() or (workspace_id is not null and public.is_workspace_admin(workspace_id, auth.uid())));

create policy "Public creations are visible" on public.creations for select to anon, authenticated using (
  visibility = 'public' and exists (select 1 from public.profiles p where p.id = owner_id and p.is_public and p.show_creations)
);
create policy "Owners see own creations" on public.creations for select to authenticated using (owner_id = auth.uid());
create policy "Owners create creations" on public.creations for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners update creations" on public.creations for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Owners delete creations" on public.creations for delete to authenticated using (owner_id = auth.uid());

create policy "Badges are visible" on public.badges for select to anon, authenticated using (true);
create policy "Badges of public profiles are visible" on public.user_badges for select to anon, authenticated using (
  exists (select 1 from public.profiles p where p.id = user_id and p.is_public)
);
create policy "Users see own badges" on public.user_badges for select to authenticated using (user_id = auth.uid());

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger workspaces_touch before update on public.workspaces for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger creations_touch before update on public.creations for each row execute function public.touch_updated_at();

create or replace function public.add_workspace_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;
create trigger workspaces_add_owner after insert on public.workspaces for each row execute function public.add_workspace_owner();

insert into public.badges (id, name, description) values ('early', 'Early member', 'Joined Ágata during early access.');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'creator'), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then base := base || 'creator'; end if;
  base := left(base, 18);
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := base || '_' || substr(md5(random()::text), 1, 4);
  end loop;
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', candidate), 60),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_badges (user_id, badge_id) values (new.id, 'early');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.find_profile_by_username(_username text)
returns table (id uuid, username text, display_name text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select id, username, display_name, avatar_url from public.profiles where username = lower(_username) limit 1
$$;
revoke execute on function public.find_profile_by_username(text) from anon, public;
grant execute on function public.find_profile_by_username(text) to authenticated;

create policy "Profile media is readable" on storage.objects for select to anon, authenticated using (bucket_id = 'profile-media');
create policy "Users upload own profile media" on storage.objects for insert to authenticated with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own profile media" on storage.objects for update to authenticated using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own profile media" on storage.objects for delete to authenticated using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owners read own creation files" on storage.objects for select to authenticated using (bucket_id = 'creations' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Public creation files are readable" on storage.objects for select to anon, authenticated using (
  bucket_id = 'creations' and exists (
    select 1 from public.creations c join public.profiles p on p.id = c.owner_id
    where c.file_path = storage.objects.name and c.visibility = 'public' and p.is_public and p.show_creations
  )
);
create policy "Owners upload creation files" on storage.objects for insert to authenticated with check (bucket_id = 'creations' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners delete creation files" on storage.objects for delete to authenticated using (bucket_id = 'creations' and (storage.foldername(name))[1] = auth.uid()::text);