'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Layers,
  Activity
} from 'lucide-react';

type CenterLane = {
  kicker: string;
  title: string;
  body: string;
  href: string;
  label: string;
  icon: any;
  highlight?: boolean;
};

const lanes: CenterLane[] = [
  {
    kicker: '01 · Launch Truth',
    title: 'Open the day from one master view',
    icon: ShieldCheck,
    body: 'Inicia con QA, revenue y bookings integrados. Verifica que el tráfico y los pagos coincidan antes de escalar la presión comercial.',
    href: '/admin/qa',
    label: 'Open QA Desk',
  },
  {
    kicker: '02 · Commercial Pressure',
    title: 'Push growth with quality hold',
    icon: TrendingUp,
    body: 'Marketing y Sales deben reforzar la misma promesa premium. Escala solo las líneas que se sientan curadas y recuperables.',
    href: '/admin/marketing',
    label: 'Review Growth',
    highlight: true,
  },
  {
    kicker: '03 · Operator Calm',
    title: 'Protect delivery while volume grows',
    icon: Users,
    body: 'Si los bookings y el soporte post-compra se mantienen legibles, KCE escala con confianza en lugar de sumar caos operativo.',
    href: '/admin/bookings',
    label: 'Inspect Bookings',
  },
];

const commandLinks = [
  { href: '/admin/qa', label: 'QA' },
  { href: '/admin/revenue', label: 'Revenue' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/marketing', label: 'Marketing' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/ai', label: 'AI' },
] as const;

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export default function FinalCommandCenterDeck({
  title = 'Final Command Center',
  description = 'Usa este deck coordinado para decidir qué empujar, qué proteger y qué arreglar. El objetivo: que la demanda, la entrega y la calma coincidan en la misma verdad premium.',
  compact = false,
  className,
}: Props) {
  return (
    <section
      className={clsx(
        'overflow-hidden rounded-brand-2xl border border-brand-dark/10 bg-surface shadow-hard',
        className,
      )}
    >
      <div className={clsx('grid gap-0 lg:grid-cols-[0.98fr_1.02fr]', compact ? 'min-h-0' : 'min-h-[22rem]')}>
        
        {/* Panel Izquierdo: Command Hub */}
        <div className="relative flex flex-col justify-center bg-brand-dark p-8 text-white md:p-10">
          {/* Brand Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/30 via-transparent to-brand-yellow/10 opacity-40" />
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <Activity className="h-3 w-3 animate-pulse" />
              Command Center
            </div>
            
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-5xl">
              {title}
            </h2>
            
            <p className="max-w-xl text-base leading-relaxed text-white/70">
              {description}
            </p>

            {/* Quick Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              {['Open Truth', 'Push Calm', 'Revenue', 'Recovery'].map((label) => (
                <div key={label} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white/80">
                  {label}
                </div>
              ))}
            </div>

            {/* Sub-navigation Links */}
            <nav className="flex flex-wrap gap-2 pt-4">
              {commandLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Panel Derecho: Operational Lanes */}
        <div className="grid gap-4 bg-surface-2 p-6 md:grid-cols-3 md:p-8">
          {lanes.map((lane) => {
            const Icon = lane.icon;
            const isHighlighted = lane.highlight;

            return (
              <article
                key={lane.title}
                className={clsx(
                  'group relative flex flex-col rounded-brand border p-6 transition-all duration-300',
                  isHighlighted
                    ? 'border-transparent bg-brand-blue text-white shadow-pop'
                    : 'border-brand-dark/5 bg-surface text-main hover:border-brand-blue/20 hover:shadow-soft'
                )}
              >
                {isHighlighted && (
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20" />
                )}

                <div className="relative z-10 flex flex-1 flex-col">
                  <header className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[10px] font-bold uppercase tracking-[0.15em]',
                      isHighlighted ? 'text-brand-blue' : 'text-brand-blue'
                    )}>
                      {lane.kicker}
                    </span>
                    <Icon className={clsx(
                      'h-4 w-4 transition-transform group-hover:scale-110',
                      isHighlighted ? 'text-white/40' : 'text-brand-blue/20'
                    )} />
                  </header>

                  <h3 className="mt-4 font-heading text-lg font-bold leading-tight tracking-tight">
                    {lane.title}
                  </h3>

                  <p className={clsx(
                    'mt-3 flex-1 text-[13px] leading-relaxed',
                    isHighlighted ? 'text-white/75' : 'text-muted'
                  )}>
                    {lane.body}
                  </p>

                  <Link
                    href={lane.href}
                    className={clsx(
                      'mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95',
                      isHighlighted
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-brand-blue text-white shadow-soft hover:bg-brand-blue/90'
                    )}
                  >
                    {lane.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}