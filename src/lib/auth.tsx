import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

const AuthCtx = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

/** Single app-wide session listener; refreshes the router and cache on identity changes. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT' && event !== 'USER_UPDATED') return;
      router.invalidate();
      if (event !== 'SIGNED_OUT') queryClient.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return <AuthCtx.Provider value={{ user, loading }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: '/auth', replace: true });
  };
}

/** Only allow canonical same-origin paths (query and hash kept) as post-login destinations. */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return '/dashboard';
  const origin = 'https://app.invalid';
  try {
    const target = new URL(value, origin);
    if (target.origin !== origin || target.pathname.startsWith('//')) return '/dashboard';
    return target.pathname + target.search + target.hash;
  } catch {
    return '/dashboard';
  }
}
