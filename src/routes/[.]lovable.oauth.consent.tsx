import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/agata/Logo';
import { supabase } from '@/integrations/supabase/client';

type Details = { client?: { name?: string; client_name?: string; redirect_uri?: string; uri?: string } | null; redirect_uri?: string; scope?: string; redirect_url?: string; redirect_to?: string; user?: { email?: string } };
type Decision = { data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: Details | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<Decision>;
  denyAuthorization: (id: string) => Promise<Decision>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute('/.lovable/oauth/consent')({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ authorization_id: typeof s['authorization_id'] === 'string' ? s['authorization_id'] : '' }),
  head: () => ({ meta: [
    { title: 'Connect an app — Ágata' },
    { name: 'description', content: 'Approve or deny an app’s request to use Ágata on your behalf.' },
    { property: 'og:title', content: 'Connect an app — Ágata' },
    { property: 'og:description', content: 'Approve or deny an app’s request to use Ágata on your behalf.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error('This link is missing its authorization request.');
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: '/auth', search: { redirect: location.pathname + location.searchStr } });
    return { email: data.session.user.email };
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get('authorization_id')!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => <main className="section-shell grid min-h-screen place-items-center pt-24">
    <div className="max-w-md text-center"><Mascot mood="alert" className="mx-auto size-16" />
      <h1 className="mt-5 text-2xl font-normal">This request can’t be completed</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}. It may have expired — start the connection again from your app.</p></div>
  </main>,
});

const scopeLabel: Record<string, string> = { openid: 'Confirm who you are', email: 'Share your email address', profile: 'Share your basic profile' };

function Consent() {
  const details = Route.useLoaderData();
  const { email } = Route.useRouteContext();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = details?.client?.name ?? details?.client?.client_name ?? 'An app';
  const redirectUri = details?.redirect_uri ?? details?.client?.redirect_uri ?? details?.client?.uri;
  const scopes = (details?.scope ?? 'openid email profile').split(/\s+/).filter(Boolean);

  async function decide(approve: boolean) {
    setBusy(true); setError(null);
    const { data, error } = approve ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError('The sign-in service did not return where to go next.'); return; }
    window.location.href = target;
  }

  return <main className="section-shell grid min-h-screen place-items-center pb-16 pt-28">
    <div className="w-full max-w-md rounded-lg border bg-card p-7 shadow-sm sm:p-9">
      <ShieldCheck className="size-6 text-mineral" />
      <h1 className="mt-4 text-2xl font-normal tracking-tight">Connect {client} to Ágata</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{client} will be able to use Ágata as you: read your projects, edit their guides and vault notes, and fetch skills.</p>
      {redirectUri && <p className="mt-3 break-all text-xs text-muted-foreground">Returns to {redirectUri}</p>}
      <ul className="mt-5 grid gap-2 border-y py-4 text-sm">{scopes.map(s => <li key={s}>{scopeLabel[s] ?? `Additional permission requested: ${s}`}</li>)}</ul>
      <p className="mt-4 text-xs text-muted-foreground">Signed in as <span translate="no">{email}</span>. This does not bypass Ágata’s project permissions.</p>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-6 grid gap-2">
        <Button disabled={busy} className="h-11 rounded-full" onClick={() => decide(true)}>Approve</Button>
        <Button disabled={busy} variant="ghost" className="h-11 rounded-full" onClick={() => decide(false)}>Cancel connection</Button>
      </div>
    </div>
  </main>;
}
