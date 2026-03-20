'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { 
  Target, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';

type Lane = {
  eyebrow: string;
  title: string;
  body: string;
  icon: any;
  links: Array<{ href: string; label: string }>;
  highlight?: boolean;
};

const lanes: Lane[] = [
  {
    eyebrow: 'Acquire',
    title: 'Open precise intent lanes before scaling',
    icon: Target,
    body: 'El tráfico se multiplica cuando las páginas de mercado y el catálogo premium hablan la misma promesa. Expande solo lo que puedes nutrir.',
    links: [
      { href: '/discover', label: 'Discover' },
      { href: '/discover/uk', label: 'UK Market' },
      { href: '/discover/luxury', label: 'Luxury' },
    ],
  },
  {
    eyebrow: 'Convert',
    title: 'Every path ends in checkout or handoff',
    icon: Zap,
    body: 'El crecimiento importa cuando el viajero fluye de contenido a tour, de quiz a humano, sin perder la confianza en el proceso.',
    links: [
      { href: '/quiz', label: 'Matcher' },
      { href: '/tours', label: 'Tours' },
      { href: '/admin/sales', label: 'Sales' },
    ],
    highlight: true,
  },
  {
    eyebrow: 'Protect',
    title: 'Align revenue truth and delivery',
    icon: ShieldCheck,
    body: 'Dominas el mercado cuando escalas sin improvisar: sesiones conciliadas, bookings persistentes y soporte con contexto rápido.',
    links: [
      { href: '/admin/qa', label: 'QA Desk' },
      { href: '/admin/revenue', label: 'Revenue' },
      { href: '/admin/bookings', label: 'Bookings' },
    ],
  },
];

const launchMoves = [
  ['Push today', 'Elige un carril de mercado, uno de intención y uno de revenue para empujar hoy en lugar de dispersar al equipo.'],
  ['Measure tonight', 'Lee marketing, sales y revenue juntos para que la historia de la sesión coincida en los tres paneles.'],
  ['Scale next', 'Solo escala el carril que mantenga saludable tanto la adquisición como la confianza post-compra.'],
] as const;

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
};

export default function MarketDominationPlaybookDeck({
  compact = false,
  title = 'Market Domination Playbook',
  description = 'Usa este playbook cuando KCE deje de solo lanzar features y empiece a actuar como una máquina de crecimiento internacional coordinada.',
}: Props) {
  return (
    <section className="overflow-hidden rounded-brand-2xl border border-brand-dark/10 bg-surface shadow-hard">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Lado Izquierdo: Playbook Core */}
        <div className="p-6 md:p-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <RefreshCw className="h-3 w-3 animate-spin-slow" />
              Market Domination Polish
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-blue md:text-4xl">
              {title}
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-muted">
              {description}
            </p>
          </header>

          <div className={clsx(
            'mt-10 grid gap-5',
            compact ? 'xl:grid-cols-1 2xl:grid-cols-3' : 'md:grid-cols-3'
          )}>
            {lanes.map((lane) => {
              const Icon = lane.icon;
              return (
                <article
                  key={lane.title}
                  className={clsx(
                    'group relative flex flex-col rounded-brand-lg border p-6 transition-all duration-300',
                    lane.highlight
                      ? 'border-transparent bg-brand-blue text-white shadow-pop'
                      : 'border-brand-dark/5 bg-surface-2 text-main hover:border-brand-blue/20'
                  )}
                >
                  <div className={clsx(
                    'text-[10px] font-bold uppercase tracking-widest',
                    lane.highlight ? 'text-brand-blue' : 'text-muted'
                  )}>
                    {lane.eyebrow}
                  </div>
                  
                  <h3 className="mt-4 font-heading text-lg font-bold leading-tight tracking-tight">
                    {lane.title}
                  </h3>
                  
                  <p className={clsx(
                    'mt-3 flex-1 text-[13px] leading-relaxed',
                    lane.highlight ? 'text-white/75' : 'text-muted'
                  )}>
                    {lane.body}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {lane.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className={clsx(
                          'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all',
                          lane.highlight
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-surface border border-brand-dark/5 text-brand-blue hover:bg-brand-blue/5'
                        )}
                      >
                        {link.label}
                        <ArrowUpRight className="h-2.5 w-2.5 opacity-50" />
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Lado Derecho: Tactical Moves */}
        <aside className="relative flex flex-col bg-brand-dark p-8 text-white md:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-yellow/5 opacity-30" />
          
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              <ChevronRight className="h-3 w-3 text-brand-blue" />
              Launch Playbook
            </div>
            
            <div className="mt-8 flex-1 space-y-4">
              {launchMoves.map(([heading, copy]) => (
                <div key={heading} className="rounded-brand border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
                  <p className="text-sm font-bold text-brand-blue">{heading}</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">{copy}</p>
                </div>
              ))}
            </div>

            <nav className="mt-10 flex flex-wrap gap-2">
              {[
                { href: '/admin/marketing', label: 'MKTG' },
                { href: '/admin/sales', label: 'SALE' },
                { href: '/admin/revenue', label: 'REV' },
                { href: '/admin/qa', label: 'QA' },
                { href: '/discover', label: 'DISC' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </section>
  );
}