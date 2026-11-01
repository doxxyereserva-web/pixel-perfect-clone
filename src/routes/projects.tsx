import { createFileRoute } from '@tanstack/react-router';
import { Eyebrow, Footer, Reveal } from '@/components/agata/primitives';
import { Mascot } from '@/components/agata/Logo';
import { projectModules } from '@/lib/platform';
import { useI18n } from '@/lib/i18n';

export const Route = createFileRoute('/projects')({
  head: () => ({ meta: [
    { title: 'Projects — Ágata' },
    { name: 'description', content: 'How Ágata projects are organised: purpose, guide, MCP connection, skills, models and Lovable API.' },
    { property: 'og:title', content: 'Projects — Ágata' },
    { property: 'og:description', content: 'Every Ágata project has a purpose, guide, MCP connection, skills, models and API.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Projects,
});

function Projects() {
  const { t } = useI18n();
  return <main>
    <section className="section-shell pb-16 pt-36 sm:pt-44"><Eyebrow>Ágata / {t('projects')}</Eyebrow><div className="mt-5 flex flex-col justify-between gap-10 lg:flex-row lg:items-end"><div><h1 className="category-title font-normal">The anatomy<br />of a project.</h1><p className="mt-6 max-w-md leading-relaxed text-muted-foreground">No projects are published yet. When they are, each one will follow this structure.</p></div><Mascot mood="reading" className="size-36 sm:size-44" /></div></section>
    <section className="section-shell"><ol className="border-t">{projectModules.map(m => <Reveal key={m.title}><li className="grid gap-4 border-b py-10 sm:grid-cols-[1fr_1.4fr] sm:items-baseline"><h2 className="flex items-center gap-3 text-2xl font-normal"><m.icon className="size-5 text-mineral" />{m.title}</h2><p className="leading-relaxed text-muted-foreground">{m.text}</p></li></Reveal>)}</ol>
      <p className="mt-8 inline-flex rounded-full bg-secondary px-3 py-1 text-xs text-mineral">{t('soon')}</p></section>
    <Footer />
  </main>;
}
