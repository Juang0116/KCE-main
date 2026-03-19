'use client';

import Link from 'next/link';
import { 
  TrendingUp, 
  Target, 
  CreditCard, 
  RefreshCw, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

const routeLinks = [
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/tasks', label: 'Tasks' },
  { href: '/admin/outbound', label: 'Outbound' },
  { href: '/admin/revenue', label: 'Revenue' },
  { href: '/admin/qa', label: 'QA / Release' },
];

const controlPillars = [
  {
    title: '1 · Capturar',
    icon: Target,
    body: 'Leads, tickets y wishlist deben terminar con owner claro y acción visible.',
  },
  {
    title: '2 · Calificar',
    icon: TrendingUp,
    body: 'Pasar rápido de intención difusa a propuesta, deal o checkout directo.',
  },
  {
    title: '3 · Cobrar',
    icon: CreditCard,
    body: 'Checkout, webhook e invoice deben sentirse como una sola ruta de revenue.',
  },
  {
    title: '4 · Reconfirmar',
    icon: RefreshCw,
    body: 'Cada movimiento vuelve a métricas para validar si el loop comercial se movió.',
  },
];

export function CommercialControlDeck({
  eyebrow = 'Commercial Command',
  title,
  description,
  primaryHref = '/admin/sales',
  primaryLabel = 'Sales Cockpit',
  secondaryHref = '/admin/qa',
  secondaryLabel = 'Release Desk',
}: Props) {
  return (
    <section className="rounded-brand-2xl border border-brand-dark/10 bg-surface p-6 shadow-hard transition-all duration-300 md:p-8">
      {/* Header & Quick Links */}
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue"></span>
            </span>
            {eyebrow}
          </div>
          
          <h1 className="font-heading text-3xl font-bold tracking-tight text-main md:text-5xl">
            {title}
          </h1>
          
          <p className="max-w-xl text-base leading-relaxed text-muted">
            {description}
          </p>

          <nav className="flex flex-wrap gap-2 pt-2">
            {routeLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-1.5 rounded-full border border-brand-dark/5 bg-surface-2 px-4 py-2 text-[11px] font-bold text-main transition-all hover:-translate-y-0.5 hover:border-brand-blue/30 hover:bg-surface"
              >
                {link.label}
                <ChevronRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Pillars Grid */}
        <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
          {controlPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="group rounded-brand-lg border border-brand-dark/5 bg-surface-2 p-5 transition-colors hover:bg-surface hover:shadow-soft"
            >
              <pillar.icon className="h-5 w-5 text-brand-blue/40 transition-colors group-hover:text-brand-blue" />
              <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted">
                {pillar.title}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-main/80">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Action Block & Daily Loop */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        {/* Rhythm Block */}
        <div className="relative overflow-hidden rounded-brand-2xl bg-brand-blue p-8 text-white shadow-pop">
          {/* Sutil gradiente de profundidad */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20" />
          
          <div className="relative z-10 space-y-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
              Go-to-close rhythm
            </div>
            <h3 className="max-w-lg text-2xl font-bold leading-tight md:text-3xl">
              Opera como cabina comercial: detectar → mover → verificar → entregar.
            </h3>
            <p className="max-w-xl text-sm leading-relaxed text-white/70">
              Cada lead, reserva y tarea debe quedar conectada a una acción clara. 
              KCE brilla cuando eliminamos la memoria manual del loop.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-yellow px-6 py-3 text-sm font-bold text-brand-dark transition-transform hover:-translate-y-1 active:scale-95 shadow-soft"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryHref}
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* Daily Loop List */}
        <div className="rounded-brand-2xl border border-brand-dark/5 bg-surface-2 p-8 shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Daily Control Loop
          </div>
          <ul className="mt-6 space-y-5">
            {[
              { time: 'Morning', task: 'Calienta qualified / proposal / checkout.' },
              { time: 'Midday', task: 'Desbloquea replies y tasks vencidas.' },
              { time: 'Afternoon', task: 'Confirma revenue y activos post-compra.' }
            ].map((item) => (
              <li key={item.time} className="flex items-start gap-4">
                <span className="flex h-6 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-[10px] font-bold text-brand-blue">
                  {item.time}
                </span>
                <p className="text-sm text-main/80">{item.task}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}