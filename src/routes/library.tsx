import { createFileRoute, Link } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { AssetLibrary } from '@/components/agata/AssetLibrary';
import { Eyebrow, Footer } from '@/components/agata/primitives';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute('/library')({ head: () => pageHead('Particle and 3D asset library', 'Explore original slash, intro, explosion and gunfire presets plus licensed Kenney model packs and individual 3D assets for Roblox workflows.'), component: Library });
function Library() {
  return <main><section className="section-shell pb-8 pt-36 sm:pt-44"><Eyebrow>Ágata / Creative resources</Eyebrow><div className="mt-5 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-4xl font-normal sm:text-6xl">Asset library</h1><p className="mt-4 text-sm text-muted-foreground">Slash, intro, explosion & gunfire · 940 models across 8 CC0 packs</p></div><Button asChild variant="glass"><Link to="/dashboard/creations"><Upload />My uploads</Link></Button></div></section><section className="section-shell"><AssetLibrary /></section><Footer /></main>;
}