import { createOpenAI } from '@ai-sdk/openai';
import { stepCountIs, streamText, type ModelMessage, type ToolSet } from 'ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { decryptSecret } from './crypto.server';
import type { AiProvider, ModelChoice } from './ai-models';

const baseUrls: Record<AiProvider, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta/openai',
  openrouter: 'https://openrouter.ai/api/v1',
};

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

/** Runs one completion on Ágata's built-in models or on the caller's own provider key. */
export async function runModel(opts: { supabase: SupabaseClient<Database>; userId: string; choice: ModelChoice; system: string; messages: ChatTurn[] }) {
  const messages: ModelMessage[] = opts.messages.map(m => ({ role: m.role, content: m.content }));

  if (opts.choice.source === 'builtin') {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) throw new Error('Ágata AI is not configured.');
    const provider = createOpenAI({ baseURL: 'https://ai.gateway.lovable.dev/v1', apiKey, headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' } });
    try {
      const result = streamText({
        model: provider.responses(opts.choice.model),
        system: opts.system,
        messages,
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: 'low', store: false, include: ['reasoning.encrypted_content'] } },
      });
      return await result.text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/429/.test(msg)) throw new Error('Ágata AI is busy right now. Try again in a moment.');
      if (/402/.test(msg)) throw new Error('Ágata AI credits have run out.');
      throw new Error('Ágata AI could not answer. Try again.');
    }
  }

  const { data: row } = await opts.supabase.from('user_ai_keys').select('key_encrypted').eq('user_id', opts.userId).eq('provider', opts.choice.source).maybeSingle();
  if (!row) throw new Error(`Add your ${opts.choice.source} key in Connections first.`);
  const apiKey = await decryptSecret(row.key_encrypted);
  const provider = createOpenAI({ baseURL: baseUrls[opts.choice.source], apiKey, headers: opts.choice.source === 'openrouter' ? { 'X-Title': 'Agata' } : undefined });
  try {
    const result = streamText({ model: provider.chat(opts.choice.model), system: opts.system, messages });
    return await result.text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Your ${opts.choice.source} key returned an error: ${msg.slice(0, 300)}`);
  }
}

export type ToolCallReport = { connection: string; tool: string; ok: boolean };

/** Runs a completion that may call external MCP tools (multi-step, bounded). */
export async function runModelWithTools(opts: { supabase: SupabaseClient<Database>; userId: string; choice: ModelChoice; system: string; messages: ChatTurn[]; tools: ToolSet }) {
  const messages: ModelMessage[] = opts.messages.map(m => ({ role: m.role, content: m.content }));
  const base = { system: opts.system, messages, tools: opts.tools, stopWhen: stepCountIs(6) } as const;

  if (opts.choice.source === 'builtin') {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) throw new Error('Ágata AI is not configured.');
    const provider = createOpenAI({ baseURL: 'https://ai.gateway.lovable.dev/v1', apiKey, headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' } });
    try {
      const result = streamText({ ...base, model: provider.responses(opts.choice.model) });
      const [text, steps] = await Promise.all([result.text, result.steps]);
      return { text, toolCalls: collectToolCalls(steps) };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/429/.test(msg)) throw new Error('Ágata AI is busy right now. Try again in a moment.');
      if (/402/.test(msg)) throw new Error('Ágata AI credits have run out.');
      throw new Error('Ágata AI could not answer. Try again.');
    }
  }

  const { data: row } = await opts.supabase.from('user_ai_keys').select('key_encrypted').eq('user_id', opts.userId).eq('provider', opts.choice.source).maybeSingle();
  if (!row) throw new Error(`Add your ${opts.choice.source} key in Connections first.`);
  const apiKey = await decryptSecret(row.key_encrypted);
  const provider = createOpenAI({ baseURL: baseUrls[opts.choice.source], apiKey, headers: opts.choice.source === 'openrouter' ? { 'X-Title': 'Agata' } : undefined });
  try {
    const result = streamText({ ...base, model: provider.chat(opts.choice.model) });
    const [text, steps] = await Promise.all([result.text, result.steps]);
    return { text, toolCalls: collectToolCalls(steps) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Your ${opts.choice.source} key returned an error: ${msg.slice(0, 300)}`);
  }
}

function collectToolCalls(steps: { toolCalls?: { toolName: string }[]; toolResults?: { toolName: string }[] }[]): ToolCallReport[] {
  const reports: ToolCallReport[] = [];
  for (const step of steps) {
    for (const call of step.toolCalls ?? []) {
      const done = (step.toolResults ?? []).some(r => r.toolName === call.toolName);
      const [connection, ...rest] = call.toolName.split('__');
      reports.push({ connection: connection ?? '', tool: rest.join('__') || call.toolName, ok: done });
    }
  }
  return reports;
}
