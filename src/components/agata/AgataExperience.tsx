import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, EyeOff, MessageCircle, X } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Mascot, type Expression } from './Logo';

const Experience = createContext<{ access: () => void }>({ access: () => {} });
export const useAgata = () => useContext(Experience);

export function AgataExperience({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [help, setHelp] = useState(false);
  const [hover, setHover] = useState(false);
  useEffect(() => { setHidden(localStorage.getItem('agata-mascot-hidden') === 'true'); }, []);
  const hide = (value: boolean) => { setHidden(value); setHelp(false); localStorage.setItem('agata-mascot-hidden', String(value)); };
  /** Idle greets, hover makes her ponder the question, an open panel gets an eye-roll. */
  const mood: Expression = help ? 'annoyed' : hover ? 'wonder' : 'greet';
  /** Signed-out visitors go to sign-in; signed-in users go straight to their space. */
  const access = () => navigate({ to: user ? '/dashboard' : '/auth' });
  return <Experience.Provider value={{ access }}>
    {children}
    <aside className="companion fixed bottom-5 right-5 z-30">
      {help && !hidden && <div className="fixed inset-x-3 top-20 rounded-lg border bg-card p-5 shadow-lg sm:static sm:mb-3 sm:w-72">
        <div className="flex items-center justify-between"><p className="text-sm font-medium">Need help?</p><Button variant="ghost" size="icon" aria-label="Close" onClick={() => setHelp(false)}><X /></Button></div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">I'm here to assist you. Ágata is in development — here's what's coming.</p>
        <Button variant="ghost" asChild className="mt-3 w-full justify-start px-0 text-mineral"><Link to="/projects" onClick={() => setHelp(false)}>How projects work <ArrowRight /></Link></Button>
        <Button variant="ghost" asChild className="w-full justify-start px-0"><Link to="/workspaces" onClick={() => setHelp(false)}>Workspaces and teams <ArrowRight /></Link></Button>
        <Button variant="ghost" className="mt-3 h-7 px-0 text-xs text-muted-foreground" onClick={() => hide(true)}><EyeOff /> Hide mascot</Button>
      </div>}
      {hidden
        ? <Button variant="glass" size="icon" className="float-right rounded-full" aria-label="Show mascot" title="Show mascot" onClick={() => hide(false)}><MessageCircle /></Button>
        : <div className="flex items-end justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground" aria-label="Hide mascot" title="Hide mascot" onClick={() => hide(true)}><EyeOff className="size-3" /></Button>
            <Button variant="ghost" aria-label="Ask Ágata" title="Ask Ágata" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={() => setHelp(v => !v)} className="companion-bubble h-auto rounded-full p-0"><span key={mood} className="companion-mood"><Mascot mood={mood} className="size-[84px]" /></span></Button>
          </div>}
    </aside>
  </Experience.Provider>;
}
