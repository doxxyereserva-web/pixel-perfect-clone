import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { inspectUpload, INSPECTOR_VERSION, MAX_SCAN_BYTES } from './upload-inspection';

export const analyzeCreation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ creationId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: creation, error } = await context.supabase.from('creations').select('id, owner_id, file_path, file_name, file_bucket, security_status').eq('id', data.creationId).eq('owner_id', context.userId).maybeSingle();
    if (error || !creation?.file_path || !creation.file_name) throw new Error('Your creation file was not found.');
    if (creation.file_bucket === 'creation-checked') return { status: creation.security_status, summary: 'This immutable release was already checked.' };
    if (!['creation-quarantine', 'creations'].includes(creation.file_bucket) || !creation.file_path.startsWith(`${context.userId}/`)) throw new Error('Invalid upload location.');
    // Authorization established above; privileged writes only create a frozen release of the exact inspected bytes.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: file, error: downloadError } = await supabaseAdmin.storage.from(creation.file_bucket).download(creation.file_path);
    if (downloadError || !file) throw new Error('Unable to read uploaded file.');
    if (file.size > MAX_SCAN_BYTES) throw new Error('Files must be 50 MB or smaller.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    const sha256 = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
    const result = inspectUpload(creation.file_name, bytes);
    let releasePath: string | null = null;
    if (result.status === 'checked') {
      releasePath = `${context.userId}/${crypto.randomUUID()}/${creation.file_name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: uploadError } = await supabaseAdmin.storage.from('creation-checked').upload(releasePath, bytes, { upsert: false, contentType: 'application/octet-stream' });
      if (uploadError) throw new Error('Unable to save checked release.');
    }
    const patch = { security_status: result.status, security_summary: result.summary, scanned_sha256: sha256, visibility: 'private' as const, ...(releasePath ? { file_bucket: 'creation-checked', file_path: releasePath } : {}) };
    const { data: updated, error: updateError } = await supabaseAdmin.from('creations').update(patch).eq('id', creation.id).eq('owner_id', context.userId).eq('file_path', creation.file_path).eq('file_bucket', creation.file_bucket).eq('file_name', creation.file_name).select('id').maybeSingle();
    if (updateError || !updated) {
      if (releasePath) await supabaseAdmin.storage.from('creation-checked').remove([releasePath]);
      throw new Error('The file changed during analysis. Please analyze the current upload again.');
    }
    const { error: scanError } = await supabaseAdmin.from('creation_scans').insert({ creation_id: creation.id, owner_id: context.userId, sha256, status: result.status, summary: result.summary, findings: result.findings, scanner_version: INSPECTOR_VERSION });
    if (scanError) throw new Error('Analysis completed but its report could not be saved.');
    return result;
  });