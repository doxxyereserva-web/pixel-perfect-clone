import { pageHead } from '@/lib/page-head';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/agata/Logo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, useMyProfile } from '@/lib/auth';

export const Route = createFileRoute('/_authenticated/dashboard/')({ head: () => pageHead('My space', 'Your Ágata creations, workspaces and projects in one place.'), component: Overview });

function useCount(table: 'creations' | 'projects' | 'workspace_members', column: string, userId?: string) {
  return useQuery({
    queryKey: ['count', table, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, userId!);
      if (error) throw error;
      return count ?? 0;
    },
  }).data;
}

function Overview() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const creations = useCount('creations', 'owner_id', user?.id);
  const projects = useCount('projects', 'owner_id', user?.id);
  const workspaces = useCount('workspace_members', 'user_id', user?.id);
  const empty = creations === 0 && projects === 0 && workspaces === 0;
  const name = profile?.display_name || profile?.username;

  const stats = [
    { label: 'Creations', value: creations, to: '/dashboard/creations' as const },
    { label: 'Workspaces', value: workspaces, to: '/dashboard/workspaces' as const },
    { label: 'Projects', value: projects, to: '/dashboard/projects' as const },
  ];

  return <div>
    <div className="flex items-center gap-5 border-b pb-5">
      <Mascot mood={empty ? 'excited' : 'love'} className="size-14 shrink-0" />
      <div><p className="text-sm text-muted-foreground">Welcome{name ? ',' : ''}</p><h1 className="text-2xl font-normal tracking-tight sm:text-3xl">{name ?? 'creator'}</h1></div>
    </div>

    <dl className="grid grid-cols-3 border-b">
      {stats.map(s => <Link key={s.label} to={s.to} className="group flex min-w-0 items-end justify-between gap-1 border-r px-3 py-4 first:ps-0 last:border-r-0 sm:px-5">
        <div><dt className="truncate text-xs text-muted-foreground">{s.label}</dt><dd className="mt-2 text-3xl font-light tabular-nums">{s.value ?? '–'}</dd></div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>)}
    </dl>

    <section className="mt-8">
      <h2 className="text-lg">{empty ? 'Start here' : 'Keep going'}</h2>
      <div className="mt-3 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
        <Step title="Finish your profile" text="Add a banner, photo and a short bio so people know your work." to="/dashboard/profile" />
        <Step title="Add a creation" text="Keep scripts, VFX, models and tools in one place. Private by default." to="/dashboard/creations" />
        <Step title="Open a workspace" text="Bring your team in, split into groups and share projects." to="/dashboard/workspaces" />
      </div>
      {profile && <Button asChild variant="glass" className="mt-6 rounded-full"><Link to="/u/$username" params={{ username: profile.username }}>View public profile <ArrowUpRight /></Link></Button>}
    </section>
  </div>;
}

function Step({ title, text, to }: { title: string; text: string; to: '/dashboard/profile' | '/dashboard/creations' | '/dashboard/workspaces' }) {
  return <Link to={to} className="group bg-card p-4 transition-colors hover:bg-accent/60">
    <p className="flex items-center justify-between text-sm">{title}<ArrowUpRight className="size-4 text-muted-foreground" /></p>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
  </Link>;
}
