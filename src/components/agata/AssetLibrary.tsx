import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Eye, Play, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { libraryAssets, type LibraryAsset } from '@/lib/asset-library';
import { vfxPresets, type VfxPreset } from '@/lib/vfx-presets';

function ParticlePreview({ preset, image }: { preset: VfxPreset; image: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const el = canvas.current; if (!el) return;
    const ctx = el.getContext('2d'); if (!ctx) return;
    const sprite = new Image(); sprite.src = image;
    let frame = 0; let start = performance.now();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particles = Array.from({ length: Math.min(preset.count, 60) }, (_, i) => ({ angle: i * 2.399, speed: 25 + (i % 7) * 12 }));
    function draw(now: number) {
      if (!ctx || !el) return;
      const elapsed = ((now - start) / 1000) % (preset.lifetime + .7);
      const t = reduced ? preset.lifetime * .25 : Math.min(elapsed * .5, preset.lifetime * .8);
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.globalAlpha = Math.max(0, 1 - t / preset.lifetime);
      if (sprite.complete && sprite.naturalWidth) for (const p of particles) {
        const d = preset.speed * p.speed * t / 10;
        const size = preset.sprite === 'ring' ? 50 + t * 220 : preset.sprite === 'slash' ? 210 : preset.sprite === 'smoke' ? 75 + t * 40 : 22;
        ctx.drawImage(sprite, el.width / 2 + Math.cos(p.angle) * d - size / 2, el.height / 2 + Math.sin(p.angle) * d - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      if (!reduced) frame = requestAnimationFrame(draw);
    }
    sprite.onload = () => { start = performance.now(); frame = requestAnimationFrame(draw); };
    if (sprite.complete && sprite.naturalWidth) { start = performance.now(); frame = requestAnimationFrame(draw); }
    return () => { cancelAnimationFrame(frame); sprite.onload = null; };
  }, [preset, image, run]);
  return <div><canvas ref={canvas} width={640} height={340} aria-label={`${preset.title} illustrative particle preview`} className="aspect-[32/17] w-full rounded-lg bg-foreground" /><div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Illustrative 2D preview · not a Roblox render</p><Button size="icon" variant="ghost" title="Replay preview" aria-label="Replay preview" onClick={() => setRun(v => v + 1)}><Play /></Button></div></div>;
}

export function AssetLibrary() {
  const [type, setType] = useState('All');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<LibraryAsset | null>(null);
  const items = libraryAssets.filter(a => (type === 'All' || a.type === type) && (category === 'All' || a.category === category) && `${a.title} ${a.category} ${a.creator}`.toLowerCase().includes(query.toLowerCase().trim()));
  const categories = [...new Set(libraryAssets.filter(a => type === 'All' || a.type === type).map(a => a.category))];
  const preset = vfxPresets.find(p => p.id === selected?.preset);
  return <div>
    <div className="flex flex-wrap gap-2 border-b pb-5">{['All', 'VFX particles', '3D models', '3D packs'].map(t => <Button key={t} size="sm" variant={type === t ? 'default' : 'ghost'} aria-pressed={type === t} onClick={() => { setType(t); setCategory('All'); }}>{t}</Button>)}</div>
    <div className="my-5 flex flex-wrap items-center justify-between gap-3"><div className="relative w-full sm:max-w-sm"><Search className="absolute start-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search assets" placeholder="Search particles, models, packs…" value={query} onChange={e => setQuery(e.target.value)} className="ps-9" /></div><Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Asset category" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All categories</SelectItem>{categories.map(c => <SelectItem value={c} key={c}>{c}</SelectItem>)}</SelectContent></Select><span className="text-xs text-muted-foreground">{items.length} resources</span></div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map(a => <article key={a.id} className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card"><div className={a.preset ? 'bg-hero-background' : 'bg-secondary'}><img loading="lazy" src={a.image} alt={a.preset ? `${a.title} included particle sprite` : `${a.title} original asset preview`} className="aspect-[4/3] w-full object-contain p-3" /></div><div className="flex flex-1 flex-col p-4"><p className="flex justify-between gap-2 text-xs text-mineral"><span>{a.category}</span><span>{a.license}</span></p><h3 className="mt-2 text-lg font-normal">{a.title}</h3><p className="mt-1 text-xs text-muted-foreground">{a.creator} · {a.format}{a.count > 1 ? ` · ${a.count} models` : ''}</p><div className="mt-auto flex gap-2 pt-4"><Button size="sm" variant="glass" aria-label={`Preview ${a.title}`} onClick={() => setSelected(a)}><Eye />Preview</Button><Button asChild size="icon" variant="ghost" title={`Download ${a.title}`}><a href={a.download} download aria-label={`Download ${a.title}`}><Download /></a></Button></div></div></article>)}</div>
    {!items.length && <p className="py-16 text-center text-muted-foreground">No resources match your search.</p>}
    <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelected(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">{selected && <><DialogTitle className="text-2xl font-normal">{selected.title}</DialogTitle><DialogDescription>{selected.creator} · {selected.license} · {selected.format}</DialogDescription>{preset ? <ParticlePreview preset={preset} image={selected.image} /> : <img src={selected.image} alt={`${selected.title} original preview`} className="aspect-[4/3] max-h-[45dvh] w-full rounded-lg bg-secondary object-contain" />}<p className="text-sm leading-relaxed text-muted-foreground">{selected.notes}</p><div className="flex flex-wrap gap-2"><Button asChild><a href={selected.download} download><Download />Download {selected.count > 1 ? 'pack' : 'asset'}</a></Button><Button asChild variant="glass"><a href={selected.source} target="_blank" rel="noopener noreferrer"><ExternalLink />{preset ? 'Roblox reference' : 'Original source'}</a></Button></div></>}</DialogContent></Dialog>
  </div>;
}