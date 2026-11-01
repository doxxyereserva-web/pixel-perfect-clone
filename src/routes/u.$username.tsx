import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, Banner, EmptyState, Pill, errorMessage, kindLabel } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { creationDownloadUrl } from '@/lib/media';
import { toast } from 'sonner';

export const Route = createFileRoute('/u/$username')({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Ágata` },
      { name: 'description', content: `Creations, tools and badges shared by @${params.username} on Ágata.` },
      { property: 'og:title', content: `@${params.username} — Ágata` },
      { property: 'og:description', content: `Creations, tools and badges shared by @${params.username} on Ágata.` },
      { property: 'og:type', content: 'profile' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: PublicProfile,
});

function PublicProfile() {
  const { username } = Route.useParams();
  const { user } = useAuth();

  const profile = useQuery({
    queryKey: ['public-profile', username, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const p = profile.data;

  const badges = useQuery({
    queryKey: ['public-badges', p?.id],
    enabled: !!p,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_badges').select('awarded_at, badges(id, name, description)').eq('user_id', p!.id);
      if (error) throw error;
      return data;
    },
  });

  const creations = useQuery({
    queryKey: ['public-creations', p?.id, user?.id],
    enabled: !!p,
    queryFn: async () => {
      const { data, error } = await supabase.from('creations').select('*').eq('owner_id', p!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function download(path: string) {
    try { window.open(await creationDownloadUrl(path), '_blank', 'noopener'); }
    catch (e) { toast.error(errorMessage(e)); }
  }

  if (profile.isLoading) return <main className="section-shell min-h-screen pt-32" />;
  if (!p) return <main className="section-shell min-h-screen pt-32">
    <EmptyState mood="peek" title="Profile not available" text="This profile doesn't exist or its owner keeps it private."
      action={<Button asChild variant="glass" className="rounded-full"><Link to="/">Go home</Link></Button>} />
  </main>;

  const isOwner = user?.id === p.id;
  const showCreations = p.show_creations || isOwner;

  return <main className="section-shell min-h-screen pb-24 pt-28 sm:pt-32">
    <div className="relative">
      <Banner path={p.banner_url} className="h-44 rounded-lg sm:h-60" />
      <div className="absolute -bottom-12 left-6 rounded-full ring-4 ring-background">
        <Avatar path={p.avatar_url} name={p.display_name ?? p.username} className="size-28 text-3xl" />
      </div>
    </div>

    <div className="mt-16 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-4xl font-normal tracking-tight sm:text-5xl">{p.display_name ?? p.username}</h1>
        <p className="mt-2 text-sm text-muted-foreground">@{p.username} · ID {p.id.slice(0, 8)}</p>
        {p.bio && <p className="mt-4 max-w-xl leading-relaxed text-foreground/80">{p.bio}</p>}
      </div>
      {isOwner && <Button asChild variant="glass" className="rounded-full"><Link to="/dashboard/profile">Edit profile</Link></Button>}
    </div>

    {!!badges.data?.length && <div className="mt-8 flex flex-wrap gap-2">
      {badges.data.map(b => b.badges && <Pill key={b.badges.id}><span title={b.badges.description}>{b.badges.name}</span></Pill>)}
    </div>}

    <section className="mt-14 border-t pt-10">
      <h2 className="text-2xl font-normal tracking-tight">Creations & tools</h2>
      {!showCreations ? <p className="mt-4 text-sm text-muted-foreground">This creator keeps their repository private.</p>
        : !creations.data?.length ? <EmptyState mood="sleepy" title="Nothing shared yet" text="Public creations and tools will show up here." />
        : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creations.data.map(c => <article key={c.id} className="flex flex-col rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2"><Pill>{kindLabel(c.kind)}</Pill>{c.visibility === 'private' && <Pill><Lock className="size-3" />Private</Pill>}</div>
            <h3 className="mt-3 text-lg">{c.title}</h3>
            {c.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>}
            <div className="mt-auto flex gap-2 pt-4">
              {c.external_url && <Button asChild size="sm" variant="glass" className="rounded-full"><a href={c.external_url} target="_blank" rel="noreferrer"><ExternalLink />Open</a></Button>}
              {c.file_path && <Button size="sm" variant="glass" className="rounded-full" onClick={() => download(c.file_path!)}><Download />{c.file_name ?? 'Download'}</Button>}
            </div>
          </article>)}
        </div>}
    </section>
  </main>;
}
