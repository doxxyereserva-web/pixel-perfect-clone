import { Link } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'framer-motion';
import type React from 'react';
import type { ReactNode } from 'react';
import { Wordmark } from './Logo';

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} style={{ transformPerspective: 1000, transformOrigin: '50% 100%' }} initial={reduced ? false : { opacity: 0, y: 40, rotateX: 28, scale: .96, filter: 'blur(6px)' }} whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)' }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .9, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}
export function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    e.currentTarget.style.setProperty('--rx', `${-y * 10}deg`); e.currentTarget.style.setProperty('--ry', `${x * 12}deg`);
    e.currentTarget.style.setProperty('--mx', `${(x + .5) * 100}%`); e.currentTarget.style.setProperty('--my', `${(y + .5) * 100}%`);
  };
  const onLeave = (e: React.PointerEvent<HTMLDivElement>) => { e.currentTarget.style.setProperty('--rx', '0deg'); e.currentTarget.style.setProperty('--ry', '0deg'); };
  return <div className={`tilt-3d ${className ?? ''}`} onPointerMove={onMove} onPointerLeave={onLeave}>{children}</div>;
}
export function Eyebrow({ children }: { children: ReactNode }) { return <p className="text-xs font-medium text-mineral">{children}</p>; }
const footerLink = 'text-sm text-muted-foreground transition-colors hover:text-foreground';
export function Footer() {
  const year = new Date().getFullYear();
  return <footer className="section-shell mt-24 border-t pt-16 pb-28">
    <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <Link to="/"><Wordmark /></Link>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">A Roblox development platform organised by projects, workspaces and teams. Create beyond limits.</p>
      </div>
      <nav aria-label="Platform"><p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground">Platform</p><ul className="mt-4 space-y-3">
        <li><Link to="/projects" className={footerLink}>Projects</Link></li>
        <li><Link to="/workspaces" className={footerLink}>Workspaces</Link></li>
        <li><Link to="/skills" className={footerLink}>Skills library</Link></li>
      </ul></nav>
      <nav aria-label="Account"><p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground">Account</p><ul className="mt-4 space-y-3">
        <li><Link to="/auth" className={footerLink}>Sign in</Link></li>
        <li><Link to="/auth" className={footerLink}>Create account</Link></li>
        <li><Link to="/reset-password" className={footerLink}>Reset password</Link></li>
      </ul></nav>
      <nav aria-label="Legal"><p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground">Legal</p><ul className="mt-4 space-y-3">
        <li><Link to="/terms" className={footerLink}>Terms of Service</Link></li>
        <li><Link to="/privacy" className={footerLink}>Privacy Policy</Link></li>
        <li><Link to="/privacy" hash="cookies" className={footerLink}>Cookies</Link></li>
      </ul></nav>
    </div>
    <div className="mt-14 flex flex-col justify-between gap-4 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-start">
      <p>© {year} Ágata. All rights reserved.</p>
      <p className="max-w-xl md:text-right">Ágata is not affiliated with, endorsed by, or sponsored by Roblox Corporation. Roblox and related marks are trademarks of Roblox Corporation. All other trademarks belong to their respective owners.</p>
    </div>
  </footer>;
}

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { id?: string; heading: string; body: string[] }[] }) {
  return <main>
    <article className="section-shell max-w-3xl pt-36 pb-16">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-mineral">Legal</p>
      <h1 className="mt-4 text-4xl font-normal tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated {updated}</p>
      <div className="mt-14 space-y-12">{sections.map((s, i) => <section key={s.heading} id={s.id} className="scroll-mt-28">
        <h2 className="text-lg font-medium">{i + 1}. {s.heading}</h2>
        {s.body.map((p) => <p key={p} className="mt-3 leading-relaxed text-muted-foreground">{p}</p>)}
      </section>)}</div>
    </article>
    <Footer />
  </main>;
}
