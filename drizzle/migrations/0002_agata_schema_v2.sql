do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='visibility') then
    create type public.visibility as enum ('public', 'private');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='workspace_role') then
    create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='creation_kind') then
    create type public.creation_kind as enum ('script', 'vfx', 'model', 'tool', 'resource');
  end if;
end $$;
select 1;