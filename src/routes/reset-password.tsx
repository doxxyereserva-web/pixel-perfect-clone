import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mascot } from '@/components/agata/Logo';
import { errorMessage } from '@/components/agata/account';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'Set a new password — Ágata' },
    { name: 'description', content: 'Choose a new password for your Ágata account.' },
    { property: 'og:title', content: 'Set a new password — Ágata' },
    { property: 'og:description', content: 'Choose a new password for your Ágata account.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) setReady(true);
    const { data } = supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    toast.success('Password updated.');
    navigate({ to: '/dashboard' });
  }

  return <main className="section-shell flex min-h-screen items-center justify-center pt-24">
    <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
      <Mascot mood={ready ? 'reading' : 'curious'} className="size-14" />
      <h1 className="mt-4 text-3xl font-normal tracking-tight">Set a new password</h1>
      {ready ? <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-1.5"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <Button disabled={busy} className="h-11 rounded-full">Save password</Button>
      </form> : <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Open this page from the reset link in your email.</p>}
    </div>
  </main>;
}
