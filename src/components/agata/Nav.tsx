import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Globe, Menu, Moon, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { languages, useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Wordmark } from './Logo';
import { useTheme } from './theme';
import { useAgata } from './AgataExperience';

export function LanguageSelect({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return <label className={`relative flex items-center ${className}`}><Globe className="pointer-events-none absolute start-3 size-4 text-foreground/60" /><span className="sr-only">Language</span>
    <select translate="no" value={lang} onChange={e => setLang(e.target.value)} className="h-9 appearance-none rounded-full bg-transparent ps-9 pe-3 text-xs text-foreground/75 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
      {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
    </select></label>;
}

export function Nav() {
  const [open, setOpen] = useState(false); const { theme, toggle } = useTheme(); const agata = useAgata(); const { t } = useI18n(); const { user } = useAuth();
  const accessLabel = user ? t('enter') : t('access');
  const links = [{ to: '/projects' as const, label: t('projects') }, { to: '/workspaces' as const, label: t('workspaces') }, { to: '/library' as const, label: 'Library' }, { to: '/skills' as const, label: 'Skills' }];
  return <><header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5"><nav className="liquid mx-auto flex h-16 max-w-[1240px] items-center justify-between rounded-full px-4 sm:px-6">
    <Link to="/" aria-label="Ágata home" onClick={() => setOpen(false)}><Wordmark /></Link>
    <div className="hidden items-center gap-1 md:flex">{links.map(l => <Button asChild variant="ghost" key={l.to} className="rounded-full text-xs text-foreground/70 hover:text-foreground"><Link to={l.to} activeProps={{ className: 'bg-accent text-foreground' }}>{l.label}</Link></Button>)}</div>
    <div className="flex items-center gap-1">
      <LanguageSelect className="hidden sm:flex" />
      <Button variant="glass" size="icon" className="rounded-full" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Switch theme">{theme === 'dark' ? <Sun /> : <Moon />}</Button>
      <Button onClick={agata.access} className="ml-1 hidden rounded-full px-5 text-xs sm:inline-flex">{accessLabel}</Button>
      <Button variant="glass" size="icon" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} className="rounded-full md:hidden" onClick={() => setOpen(v => !v)}>{open ? <X /> : <Menu />}</Button>
    </div></nav></header>
    {open && <div className="fixed inset-0 z-30 bg-background/95 px-7 pt-28 backdrop-blur-xl md:hidden"><div className="mx-auto max-w-xl">
      {links.map(l => <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="flex items-center justify-between border-b py-5 text-2xl"><span>{l.label}</span><span /></Link>)}
      <LanguageSelect className="mt-6" />
      <Button className="mt-6 rounded-full" onClick={() => { setOpen(false); agata.access(); }}>{accessLabel}</Button>
    </div></div>}</>;
}
