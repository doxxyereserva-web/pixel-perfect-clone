import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { Boxes, FolderKanban, LayoutGrid, LogOut, Plug, UserRound, Users } from 'lucide-react';
import { Avatar } from '@/components/agata/account';
import { useMyProfile, useSignOut } from '@/lib/auth';

export const Route = createFileRoute('/_authenticated/dashboard')({
  head: () => ({ meta: [
    { title: 'Dashboard — Ágata' },
    { name: 'description', content: 'Your Ágata dashboard: profile, creations, workspaces and projects.' },
    { property: 'og:title', content: 'Dashboard — Ágata' },
    { property: 'og:description', content: 'Your Ágata dashboard.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: DashboardLayout,
});

const items = [
  { to: '/dashboard' as const, label: 'Overview', icon: LayoutGrid, exact: true },
  { to: '/dashboard/profile' as const, label: 'Profile', icon: UserRound },
  { to: '/dashboard/creations' as const, label: 'Creations', icon: Boxes },
  { to: '/dashboard/workspaces' as const, label: 'Workspaces', icon: Users },
  { to: '/dashboard/projects' as const, label: 'Projects', icon: FolderKanban },
  { to: '/dashboard/connections' as const, label: 'Connections', icon: Plug },
];

function DashboardLayout() {
  const { data: profile } = useMyProfile();
  const signOut = useSignOut();
  return <div className="section-shell grid gap-5 pb-16 pt-20 sm:pt-24 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="hidden items-center gap-3 border-b pb-5 lg:flex">
        <Avatar path={profile?.avatar_url} name={profile?.display_name ?? profile?.username} />
        <div className="min-w-0"><p className="truncate text-sm">{profile?.display_name ?? '—'}</p><p className="truncate text-xs text-muted-foreground">@{profile?.username ?? '…'}</p></div>
      </div>
      <nav aria-label="Account" className="-mx-6 flex gap-1 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 lg:mx-0 lg:mt-4 lg:flex-col lg:overflow-visible">
        {items.map(i => <Link key={i.to} to={i.to} activeOptions={{ exact: !!i.exact }}
          className="flex shrink-0 items-center gap-2.5 rounded-full px-3 py-1.5 text-sm text-foreground/70 lg:py-2 transition-colors hover:bg-accent hover:text-foreground"
          activeProps={{ className: 'bg-accent !text-foreground' }}><i.icon className="size-4" />{i.label}</Link>)}
        <button onClick={signOut} className="flex shrink-0 items-center gap-2.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground lg:py-2 hover:bg-accent hover:text-foreground lg:mt-4"><LogOut className="size-4" />Sign out</button>
      </nav>
    </aside>
    <div className="min-w-0"><Outlet /></div>
  </div>;
}
