import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mascot } from '@/components/agata/Logo';
import { errorMessage } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { safeRedirect, useAuth } from '@/lib/auth';

type Mode = 'signin' | 'signup' | 'forgot';

export const Route = createFileRoute('/auth')({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode; redirect?: string } => ({
    mode: s.mode === 'signup' || s.mode === 'forgot' ? s.mode : undefined,
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
  }),
  head: () => ({ meta: [
    { title: 'Sign in — Ágata' },
    { name: 'description', content: 'Sign in or create your Ágata account to manage your profile, creations, workspaces and projects.' },
    { property: 'og:title', content: 'Sign in — Ágata' },
    { property: 'og:description', content: 'Your Ágata account: profile, creations, workspaces and projects.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: AuthPage,
});

const REDIRECT_KEY = 'agata-after-auth';

function AuthPage() {
  const search = Route.useSearch();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>(search.mode ?? 'signin');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', username: '' });

  useEffect(() => { if (search.redirect) sessionStorage.setItem(REDIRECT_KEY, safeRedirect(search.redirect)); }, [search.redirect]);
  useEffect(() => {
    if (loading || !user) return;
    const target = safeRedirect(sessionStorage.getItem(REDIRECT_KEY) ?? search.redirect);
    sessionStorage.removeItem(REDIRECT_KEY);
    router.history.replace(target);
  }, [user, loading, router, search.redirect]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function social(provider: 'google' | 'apple') {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) { toast.error(errorMessage(result.error)); setBusy(false); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const username = form.username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(username)) throw new Error('Usernames use 3–24 letters, numbers or underscores.');
        const { error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { emailRedirectTo: new URL(`/auth?redirect=${encodeURIComponent(safeRedirect(sessionStorage.getItem(REDIRECT_KEY) ?? search.redirect))}`, window.location.origin).href, data: { username } } });
        if (error) throw error;
        setSent('Check your inbox to confirm your email, then sign in.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent('If that email has an account, a reset link is on its way.');
      }
    } catch (err) { toast.error(errorMessage(err)); }
    setBusy(false);
  }

  const title = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';

  return <main className="section-shell grid min-h-screen items-center gap-12 pb-16 pt-32 lg:grid-cols-[1fr_440px]">
    <div className="hidden lg:block">
      <Mascot mood={mode === 'signup' ? 'excited' : mode === 'forgot' ? 'curious' : 'love'} className="size-40" />
      <h1 className="mt-10 max-w-md text-6xl font-normal leading-[1.05] tracking-tight">Your space<br />to build.</h1>
      <p className="mt-6 max-w-sm leading-relaxed text-muted-foreground">One account for your profile, your creations, your workspaces and every project you take on.</p>
    </div>

    <div className="w-full rounded-lg border bg-card p-7 shadow-sm sm:p-9">
      <Mascot mood="love" className="size-14 lg:hidden" />
      <h2 className="mt-4 text-3xl font-normal tracking-tight lg:mt-0">{title}</h2>

      {sent ? <div className="mt-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{sent}</p>
        <Button variant="glass" className="mt-6 rounded-full" onClick={() => { setSent(null); setMode('signin'); }}>Back to sign in</Button>
      </div> : <>
        {mode !== 'forgot' && <div className="mt-7 grid gap-2">
          <Button type="button" variant="glass" disabled={busy} className="h-11 rounded-full" onClick={() => social('google')}><GoogleIcon /> Continue with Google</Button>
          <Button type="button" variant="glass" disabled={busy} className="h-11 rounded-full" onClick={() => social('apple')}><AppleIcon /> Continue with Apple</Button>
          <div className="my-3 flex items-center gap-3 text-[11px] text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
        </div>}

        <form onSubmit={submit} className={`grid gap-4 ${mode === 'forgot' ? 'mt-7' : ''}`}>
          {mode === 'signup' && <div className="grid gap-1.5"><Label htmlFor="username">Username</Label><Input id="username" required autoComplete="username" value={form.username} onChange={set('username')} placeholder="yourname" /></div>}
          <div className="grid gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></div>
          {mode !== 'forgot' && <div className="grid gap-1.5">
            <div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>{mode === 'signin' && <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setMode('forgot')}>Forgot?</button>}</div>
            <Input id="password" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} />
          </div>}
          <Button type="submit" disabled={busy} className="mt-2 h-11 rounded-full">{mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? <>New to Ágata? <button className="text-foreground underline-offset-4 hover:underline" onClick={() => setMode('signup')}>Create an account</button></>
            : <>Already have an account? <button className="text-foreground underline-offset-4 hover:underline" onClick={() => setMode('signin')}>Sign in</button></>}
        </p>
      </>}
    </div>
  </main>;
}

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1a5.95 5.95 0 0 1 0-11.9c1.85 0 3.1.79 3.8 1.47l2.6-2.5A9.5 9.5 0 0 0 12 2.5a9.5 9.5 0 1 0 0 19c5.48 0 9.12-3.85 9.12-9.28 0-.62-.07-1.1-.17-1.6Z" /></svg>;
}
function AppleIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M16.37 12.6c-.02-2.3 1.88-3.4 1.97-3.46a4.24 4.24 0 0 0-3.34-1.8c-1.42-.15-2.77.83-3.5.83-.72 0-1.83-.81-3.01-.79a4.46 4.46 0 0 0-3.77 2.28c-1.61 2.79-.41 6.92 1.16 9.18.77 1.1 1.68 2.35 2.88 2.3 1.16-.05 1.6-.75 3-.75s1.79.75 3.01.72c1.25-.02 2.04-1.12 2.8-2.23a9.9 9.9 0 0 0 1.27-2.6 4.04 4.04 0 0 1-2.47-3.68ZM14.08 5.85A4.1 4.1 0 0 0 15.04 2.9a4.17 4.17 0 0 0-2.72 1.4 3.9 3.9 0 0 0-.98 2.85 3.45 3.45 0 0 0 2.74-1.3Z" /></svg>;
}
