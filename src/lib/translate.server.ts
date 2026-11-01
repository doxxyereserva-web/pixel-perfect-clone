import { createOpenAI } from '@ai-sdk/openai';
import { streamText, Output, NoObjectGeneratedError } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const MODEL = 'openai/gpt-6-astra';

function publicClient() {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  return createClient<Database>(process.env['SUPABASE_URL']!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
      h.set('apikey', key);
      return fetch(input, { ...init, headers: h });
    } },
  });
}

async function aiTranslate(texts: string[], languageName: string): Promise<string[]> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error('Translation is not configured.');
  const provider = createOpenAI({
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    apiKey,
    headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
  });
  const result = streamText({
    model: provider.responses(MODEL),
    instructions: `You translate website UI strings into ${languageName}. Return exactly one translation per input, in the same order. Keep it natural, concise and in the tone of a modern creative product. Never translate the brand names "Ágata", "Roblox", "Google", "Apple", nor usernames, emails, URLs, or code. Preserve punctuation, leading/trailing symbols, numbers and placeholders. If a string is already in ${languageName}, return it unchanged.`,
    prompt: JSON.stringify(texts),
    output: Output.object({ schema: z.object({ translations: z.array(z.string()) }) }),
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: 'low', include: ['reasoning.encrypted_content'] } },
  });
  try {
    const out = await result.output;
    return out.translations;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) throw new Error('Translation failed.');
    throw e;
  }
}

export async function translateStrings(lang: string, languageName: string, texts: string[]) {
  const db = publicClient();
  const { data: cached } = await db.from('ui_translations').select('source, translated').eq('lang', lang).in('source', texts);
  const map: Record<string, string> = {};
  for (const r of cached ?? []) map[r.source] = r.translated;
  const missing = texts.filter((t) => !(t in map));
  if (missing.length) {
    const translated = await aiTranslate(missing, languageName);
    if (translated.length === missing.length) {
      const rows = missing.map((source, i) => ({ lang, source, translated: translated[i] ?? source }));
      for (const r of rows) map[r.source] = r.translated;
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      await supabaseAdmin.from('ui_translations').upsert(rows, { onConflict: 'lang,source', ignoreDuplicates: true });
    }
  }
  return map;
}
