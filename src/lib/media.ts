import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const HOUR = 60 * 60;

/** Resolves a stored profile-media path (or an external URL) to a displayable URL. */
export function useMediaUrl(path?: string | null) {
  return useQuery({
    queryKey: ['media', path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      if (/^https?:\/\//.test(path!)) return path!;
      const { data, error } = await supabase.storage.from('profile-media').createSignedUrl(path!, 6 * HOUR);
      if (error) throw error;
      return data.signedUrl;
    },
  }).data;
}

export async function uploadProfileMedia(userId: string, file: File, kind: 'avatar' | 'banner') {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('profile-media').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function uploadCreationFile(userId: string, file: File) {
  if (file.size > 50 * 1024 * 1024) throw new Error('Files must be 50 MB or smaller.');
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from('creations').upload(path, file, { contentType: file.type || 'application/octet-stream' });
  if (error) throw error;
  return { path, name: file.name };
}

export async function creationDownloadUrl(path: string) {
  const { data, error } = await supabase.storage.from('creations').createSignedUrl(path, 10 * 60, { download: true });
  if (error) throw error;
  return data.signedUrl;
}
