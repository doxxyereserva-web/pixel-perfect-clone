import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { SkillLibrary } from '@/components/agata/project/SkillLibrary';
import { Eyebrow, Footer } from '@/components/agata/primitives';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/skills')({
  head: () => ({ meta: [
    { title: 'Creative skills library — Ágata' },
    { name: 'description', content: 'Ready-to-use Roblox VFX, Blender modeling, UV/PBR, rigging and optimization skills grounded in official documentation and CC0 material references.' },
    { property: 'og:title', content: 'Creative skills library — Ágata' },
    { property: 'og:description', content: 'Download reference-grounded creative skills for Claude Code, Codex and Gemini CLI.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Skills,
});

function Skills() {
  return <main><section className="section-shell pb-8 pt-36 sm:pt-44"><Eyebrow>Ágata / Creative tools</Eyebrow><div className="mt-5 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-4xl font-normal sm:text-6xl">Skills library</h1><p className="mt-4 text-sm text-muted-foreground">VFX · 3D modeling · Materials · Animation · Optimization</p></div><Button asChild variant="glass"><Link to="/dashboard/projects">My projects<ArrowUpRight /></Link></Button></div></section><section className="section-shell"><SkillLibrary /></section><Footer /></main>;
}