import { createFileRoute } from '@tanstack/react-router';
import { Eyebrow, Footer, Reveal } from '@/components/agata/primitives';
import { Mascot } from '@/components/agata/Logo';
import { workspaceSpaces } from '@/lib/platform';
import { useI18n } from '@/lib/i18n';

export const Route = createFileRoute('/workspaces')({
  head: () => ({ meta: [
    { title: 'Workspaces & teams — Ágata' },
    { name: 'description', content: 'Workspaces, teams, roles and studios for organising Roblox projects on Ágata.' },
    { property: 'og:title', content: 'Workspaces & teams — Ágata' },
    { property: 'og:description', content: 'Workspaces, teams, roles and studios on Ágata.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Workspaces,
});

function Workspaces() {
  const { t } = useI18n();
  return <main>
    <section className="section-shell pb-16 pt-36 sm:pt-44"><Eyebrow>Ágata / {t('workspaces')}</Eyebrow><div className="mt-5 flex flex-col justify-between gap-10 lg:flex-row lg:items-end"><div><h1 className="category-title font-normal">Room to build,<br />together.</h1><p className="mt-6 max-w-md leading-relaxed text-muted-foreground">From your own corner to a whole studio.</p></div><Mascot mood="excited" className="size-36 sm:size-44" /></div></section>
    <section className="section-shell grid gap-5 sm:grid-cols-2">{workspaceSpaces.map((s, i) => <Reveal key={s.title} delay={(i % 2) * .06} className="mascot-tile rounded-lg p-9"><s.icon className="size-6 text-mineral" /><h2 className="mt-10 text-2xl font-normal">{s.title}</h2><p className="mt-3 leading-relaxed text-muted-foreground">{s.text}</p></Reveal>)}</section>
    <section className="section-shell"><p className="mt-8 inline-flex rounded-full bg-secondary px-3 py-1 text-xs text-mineral">{t('soon')}</p></section>
    <Footer />
  </main>;
}
