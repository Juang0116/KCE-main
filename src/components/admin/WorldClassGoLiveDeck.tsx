'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { 
  Globe, 
  ShieldCheck, 
  Users, 
  Zap, 
  ArrowUpRight, 
  CheckCircle2,
  Lock
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
    eyebrow: 'Go-live truth',
    title: 'Push only the experience you can protect',
    icon: Lock,
    body: 'Un lanzamiento world-class significa que la promesa sobrevive a todo el camino: discover, tours, booking y soporte alineados.',
    highlight: true,
    links: [
      { href: '/admin/qa', label: 'QA Desk' },
      { href: '/admin/revenue', label: 'Revenue' },
      { href: '/admin/bookings', label: 'Bookings' },
    ],
  },
  {
    eyebrow: 'Market confidence',
    title: 'Scale the lanes that stay premium',
    icon: Globe,
    body: 'No trates el crecimiento como solo más páginas. Escala solo los mercados que convierten limpiamente en el handoff humano.',
    links: [
      { href: '/discover', label: 'Discover' },
      { href: '/admin/marketing', label: 'Marketing' },
      { href: '/admin/sales', label: 'Sales' },
    ],
  },
  {
    eyebrow: 'Traveler trust',
    title: 'Coherent quality after the booking',
    icon: Users,
    body: 'El pulido debe aparecer donde la confianza importa: success, booking center y account deben sentirse calmados y premium.',
    links: [
      { href: '/es/account/bookings', label: 'Account' },
      { href: '/booking/demo?t=local-dev', label: 'Booking View' },
      { href: '/es/checkout/success', label: 'Success' },
    ],
  },
];

const playbook = [
  ['Protect the premium path', 'Revisa mobile primero, luego la verdad del revenue y el handoff humano. La confianza se pierde en la fricción.'],
  ['Scale with one story', 'Mantén a marketing, ventas y soporte hablando la misma promesa. Cada carril debe saber qué revisar y cómo recuperar.'],
  ['Finish the loop', 'Un lanzamiento es world-class solo cuando el viajero se mueve de la inspiración a la compra sin confusión ni duplicidad.'],
] as const;

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
};

export default function WorldClassGoLiveDeck({
  compact = false,
  title = 'World-Class Go-Live System',
  description = 'Usa este lente de pulido final antes de abrir tráfico pesado: el sitio, el equipo y el journey pagado deben sentirse coordinados y premium.',
}: Props) {
  return (
    <section className="overflow-hidden rounded-brand-2xl border border-brand-dark/10 bg-surface shadow-hard">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Panel de Control: Estrategia de Lanzamiento */}
        <div className="p-6 md:p-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <Zap className="h-3 w-3 fill-brand-blue" />
              World-Class Polish
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
                  <header className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[10px] font-bold uppercase tracking-widest',
                      lane.highlight ? 'text-brand-yellow' : 'text-brand-blue/60'
                    )}>
                      {lane.eyebrow}
                    </span>
                    <Icon className={clsx(
                      'h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity',
                      lane.highlight ? 'text-white' : 'text-brand-blue'
                    )} />
                  </header>

                  <h3 className="mt-4 font-heading text-lg font-bold leading-tight">
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
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Aside: Playbook y Verificación */}
        <aside className="relative flex flex-col bg-brand-dark p-8 text-white md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(216,176,74,0.15),transparent)] opacity-50" />
          
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-yellow" />
              Go-Live Playbook
            </div>
            
            <div className="mt-8 flex-1 space-y-4">
              {playbook.map(([heading, copy]) => (
                <div key={heading} className="group rounded-brand border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-brand-yellow/40 group-hover:text-brand-yellow transition-colors" />
                    <p className="text-sm font-bold text-white">{heading}</p>
                  </div>
                  <p className="mt-2 pl-7 text-[13px] leading-relaxed text-white/60">{copy}</p>
                </div>
              ))}
            </div>

            <nav className="mt-10 flex flex-wrap gap-2">
              {[
                { href: '/admin/qa', label: 'QA' },
                { href: '/admin/marketing', label: 'MKTG' },
                { href: '/admin/sales', label: 'SALE' },
                { href: '/admin/bookings', label: 'BOOK' },
                { href: '/discover', label: 'DISC' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60 transition hover:bg-white/15 hover:text-white"
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