import { useState, type ReactNode } from 'react';
import { Mascot, type Expression } from './Logo';
import { useMediaUrl } from '@/lib/media';
import type { Database } from '@/integrations/supabase/types';

export type CreationKind = Database['public']['Enums']['creation_kind'];
export type WorkspaceRole = Database['public']['Enums']['workspace_role'];

export const creationKinds: { value: CreationKind; label: string }[] = [
  { value: 'script', label: 'Script' },
  { value: 'vfx', label: 'VFX' },
  { value: 'model', label: '3D model' },
  { value: 'tool', label: 'Tool' },
  { value: 'resource', label: 'Resource' },
];
export const kindLabel = (k: CreationKind) => creationKinds.find(c => c.value === k)?.label ?? k;

export const roleLabels: Record<WorkspaceRole, string> = { owner: 'Owner', admin: 'Admin', member: 'Member', viewer: 'Viewer' };

export function PageHeader({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
    <div><h1 className="text-2xl font-normal tracking-tight sm:text-3xl">{title}</h1>{text && <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">{text}</p>}</div>
    {action}
  </div>;
}

export function EmptyState({ mood = 'curious', title, text, action }: { mood?: Expression; title: string; text: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center py-12 text-center">
    <Mascot mood={mood} className="size-16" />
    <p className="mt-4 text-base">{title}</p>
    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{text}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>;
}

export function Avatar({ path, name, className = 'size-10' }: { path?: string | null; name?: string | null; className?: string }) {
  const url = useMediaUrl(path);
  const [failed, setFailed] = useState<string | null>(null);
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return url && failed !== url
    ? <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(url)} className={`shrink-0 rounded-full object-cover ${className}`} />
    : <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-mineral ${className}`}>{initial}</span>;
}

export function Banner({ path, className = '' }: { path?: string | null; className?: string }) {
  const url = useMediaUrl(path);
  return <div className={`profile-banner overflow-hidden ${className}`}>{url && <img src={url} alt="" className="size-full object-cover" />}</div>;
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground">{children}</span>;
}

export function errorMessage(e: unknown) {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return 'Something went wrong. Try again.';
}
