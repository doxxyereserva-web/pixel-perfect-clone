import { createServerFn } from '@tanstack/react-start';
import { languages } from './i18n';

const MAX_ITEMS = 60;
const MAX_LEN = 600;

export const translateBatch = createServerFn({ method: 'POST' })
  .inputValidator((input: { lang: string; texts: string[] }) => {
    const lang = languages.find((l) => l.code === input?.lang);
    if (!lang || lang.code === 'en') throw new Error('Unsupported language');
    if (!Array.isArray(input.texts)) throw new Error('Invalid texts');
    const texts = [...new Set(input.texts.filter((t) => typeof t === 'string' && t.trim() && t.length <= MAX_LEN))].slice(0, MAX_ITEMS);
    return { lang: lang.code, name: lang.name, texts };
  })
  .handler(async ({ data }) => {
    if (!data.texts.length) return {} as Record<string, string>;
    const { translateStrings } = await import('./translate.server');
    return translateStrings(data.lang, data.name, data.texts);
  });
