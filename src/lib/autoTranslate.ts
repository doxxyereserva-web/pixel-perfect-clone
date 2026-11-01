/**
 * Translates every visible UI string on the page into the active language.
 * Walks text nodes and a few attributes, remembers the English source for each,
 * and asks the server (AI + shared cache) for anything not translated yet.
 * Opt out on any element with translate="no" or data-no-translate.
 */
type Fetcher = (lang: string, texts: string[]) => Promise<Record<string, string>>;

const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'] as const;
const SKIP = 'script,style,noscript,code,pre,textarea,[translate="no"],[data-no-translate],[contenteditable="true"]';
const HAS_LETTER = /\p{L}/u;
const CACHE_PREFIX = 'agata-tr:';

export function createAutoTranslator(fetcher: Fetcher) {
  let lang = 'en';
  let cache = new Map<string, string>();
  const source = new WeakMap<Node, string>();          // English text for a text node
  const applied = new WeakMap<Node, string>();         // value we last wrote
  const attrSource = new WeakMap<Element, Map<string, string>>();
  const attrApplied = new WeakMap<Element, Map<string, string>>();
  const pending = new Set<string>();
  const failed = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let observer: MutationObserver | undefined;

  const loadCache = (l: string) => {
    try { return new Map<string, string>(Object.entries(JSON.parse(localStorage.getItem(CACHE_PREFIX + l) ?? '{}'))); } catch { return new Map<string, string>(); }
  };
  const saveCache = () => {
    try { localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(Object.fromEntries(cache))); } catch { /* storage full */ }
  };
  const skipped = (el: Element | null) => !el || !!el.closest(SKIP);

  const translateValue = (raw: string): string | null => {
    const key = raw.trim();
    if (!key || !HAS_LETTER.test(key)) return null;
    if (lang === 'en') return raw;
    const hit = cache.get(key);
    if (hit !== undefined) return raw.replace(key, hit);
    if (!failed.has(key)) { pending.add(key); schedule(); }
    return null;
  };

  const doText = (n: Text) => {
    if (skipped(n.parentElement)) return;
    const current = n.nodeValue ?? '';
    const src = applied.get(n) === current ? source.get(n) ?? current : current;
    source.set(n, src);
    const next = lang === 'en' ? src : translateValue(src);
    if (next !== null && next !== current) { n.nodeValue = next; }
    applied.set(n, next ?? current);
  };

  const doAttrs = (el: Element) => {
    if (skipped(el)) return;
    for (const a of ATTRS) {
      const current = el.getAttribute(a);
      if (current == null) continue;
      const srcMap = attrSource.get(el) ?? new Map(); attrSource.set(el, srcMap);
      const apMap = attrApplied.get(el) ?? new Map(); attrApplied.set(el, apMap);
      const src = apMap.get(a) === current ? srcMap.get(a) ?? current : current;
      srcMap.set(a, src);
      const next = lang === 'en' ? src : translateValue(src);
      if (next !== null && next !== current) el.setAttribute(a, next);
      apMap.set(a, next ?? current);
    }
  };

  const walk = (root: Node) => {
    if (root.nodeType === Node.TEXT_NODE) { doText(root as Text); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const el = root as Element;
    if (skipped(el)) return;
    doAttrs(el);
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => n.nodeType === Node.ELEMENT_NODE && (n as Element).matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    let n = tw.nextNode();
    while (n) { if (n.nodeType === Node.TEXT_NODE) doText(n as Text); else doAttrs(n as Element); n = tw.nextNode(); }
  };

  const schedule = () => { if (!timer) timer = setTimeout(flush, 120); };
  const flush = async () => {
    timer = undefined;
    const forLang = lang;
    const batch = [...pending]; pending.clear();
    if (!batch.length || forLang === 'en') return;
    for (let i = 0; i < batch.length; i += 50) {
      const chunk = batch.slice(i, i + 50);
      try {
        const res = await fetcher(forLang, chunk);
        if (forLang !== lang) return;
        for (const k of chunk) { if (res[k] !== undefined) cache.set(k, res[k]); else failed.add(k); }
      } catch { chunk.forEach((k) => failed.add(k)); }
    }
    saveCache();
    if (forLang === lang) walk(document.body);
  };

  return {
    setLang(next: string) {
      if (next === lang) return;
      lang = next; cache = next === 'en' ? new Map() : loadCache(next);
      pending.clear(); failed.clear();
      walk(document.body);
    },
    start() {
      walk(document.body);
      observer = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === 'characterData') doText(m.target as Text);
          else if (m.type === 'attributes') doAttrs(m.target as Element);
          else m.addedNodes.forEach(walk);
        }
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    },
    stop() { observer?.disconnect(); if (timer) clearTimeout(timer); },
  };
}
