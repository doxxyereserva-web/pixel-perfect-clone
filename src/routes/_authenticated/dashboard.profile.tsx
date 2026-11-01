import { pageHead } from '@/lib/page-head';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Camera, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, Banner, PageHeader, errorMessage } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, useMyProfile } from '@/lib/auth';
import { uploadProfileMedia } from '@/lib/media';

export const Route = createFileRoute('/_authenticated/dashboard/profile')({ head: () => pageHead('Profile settings', 'Manage your Ágata profile, public presence and creations.'), component: ProfileSettings });

function ProfileSettings() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState({ username: '', display_name: '', bio: '', is_public: true, show_creations: true });
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) setForm({ username: profile.username, display_name: profile.display_name ?? '', bio: profile.bio ?? '', is_public: profile.is_public, show_creations: profile.show_creations });
  }, [profile]);

  const badges = useQuery({
    queryKey: ['my-badges', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_badges').select('awarded_at, badges(id, name, description)').eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
  }).data;

  const save = useMutation({
    mutationFn: async (patch: Partial<typeof form> & { avatar_url?: string; banner_url?: string }) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', user!.id);
      if (error) throw error.code === '23505' ? new Error('That username is taken.') : error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', user?.id] }),
    onError: e => toast.error(errorMessage(e)),
  });

  async function upload(kind: 'avatar' | 'banner', file?: File) {
    if (!file || !user) return;
    try {
      const path = await uploadProfileMedia(user.id, file, kind);
      await save.mutateAsync(kind === 'avatar' ? { avatar_url: path } : { banner_url: path });
      toast.success(kind === 'avatar' ? 'Photo updated.' : 'Banner updated.');
    } catch (e) { toast.error(errorMessage(e)); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const username = form.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username)) return toast.error('Usernames use 3–24 letters, numbers or underscores.');
    await save.mutateAsync({ ...form, username, display_name: form.display_name.trim() || username, bio: form.bio.trim() });
    toast.success('Profile saved.');
  }

  if (!profile) return null;

  return <div>
    <PageHeader title="Profile" text="How you appear on Ágata. Your profile also works as a repository of your creations and tools — you choose what is shown."
      action={<Button asChild variant="glass" className="rounded-full"><Link to="/u/$username" params={{ username: profile.username }}>View public page <ArrowUpRight /></Link></Button>} />

    <div className="relative mt-5">
      <Banner path={profile.banner_url} className="h-32 rounded-lg sm:h-44" />
      <Button type="button" variant="glass" size="sm" className="absolute right-3 top-3 rounded-full" onClick={() => bannerInput.current?.click()}><ImagePlus /> Banner</Button>
      <div className="absolute -bottom-8 left-4 sm:left-6">
        <button type="button" onClick={() => avatarInput.current?.click()} className="group relative rounded-full ring-4 ring-background" aria-label="Change profile photo">
          <Avatar path={profile.avatar_url} name={profile.display_name ?? profile.username} className="size-16 text-xl sm:size-20" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 text-background opacity-0 transition-opacity group-hover:opacity-100"><Camera className="size-5" /></span>
        </button>
      </div>
      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={e => upload('avatar', e.target.files?.[0])} />
      <input ref={bannerInput} type="file" accept="image/*" hidden onChange={e => upload('banner', e.target.files?.[0])} />
    </div>

    <form onSubmit={submit} className="mt-14 grid max-w-2xl gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5"><Label htmlFor="display">Display name</Label><Input id="display" maxLength={60} value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} /></div>
        <div className="grid gap-1.5"><Label htmlFor="username">Username</Label><Input id="username" maxLength={24} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
      </div>
      <div className="grid gap-1.5"><Label htmlFor="bio">Bio</Label><Textarea id="bio" maxLength={400} rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="What you build, what you're good at." /></div>
      <div className="grid gap-1.5"><Label>Profile ID</Label><p className="select-all rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">{profile.id}</p></div>

      <div className="divide-y rounded-lg border">
        <Toggle id="public" label="Public profile" text="Anyone can open your profile page. When off, only you and people in your workspaces see it." checked={form.is_public} onChange={v => setForm(f => ({ ...f, is_public: v }))} />
        <Toggle id="creations" label="Show creations" text="List your public creations on your profile, like a repository." checked={form.show_creations} onChange={v => setForm(f => ({ ...f, show_creations: v }))} />
      </div>

      <Button disabled={save.isPending} className="w-fit rounded-full px-6">Save profile</Button>
    </form>

    <section className="mt-14 max-w-2xl border-t pt-8">
      <h2 className="text-lg">Badges</h2>
      {badges?.length ? <ul className="mt-4 flex flex-wrap gap-2">{badges.map(b => b.badges && <li key={b.badges.id} title={b.badges.description} className="rounded-full border bg-secondary px-3 py-1 text-xs text-mineral">{b.badges.name}</li>)}</ul>
        : <p className="mt-2 text-sm text-muted-foreground">No badges yet.</p>}
    </section>
  </div>;
}

function Toggle({ id, label, text, checked, onChange }: { id: string; label: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <div className="flex items-start justify-between gap-4 p-4">
    <div><Label htmlFor={id}>{label}</Label><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p></div>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>;
}
