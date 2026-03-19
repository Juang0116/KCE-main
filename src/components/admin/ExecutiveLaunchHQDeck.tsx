'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Rocket, ShieldCheck, BarChart3, Globe, ArrowRight } from 'lucide-react';

type HqLink = {
  title: string;
  body: string;
  href: string;
  tone?: 'dark';
  icon: any;
};

const lanes: HqLink[] = [
  {
    title: 'Launch Truth',
    body: 'Abre QA y revenue primero. Si los checks, pagos y entrega no coinciden, mantén la presión hasta que el sistema esté calmo.',
    href: '/admin/qa',
    tone: 'dark',
    icon: ShieldCheck,
  },
  {
    title: 'Commercial Pressure',
    body: 'Escala ventas y marketing solo cuando las líneas de leads se vean calificadas, premium y recuperables.',
    href: '/admin/sales',
    icon: BarChart3,
  },
  {
    title: 'Delivery Calm',
    body: 'Bookings y soporte deben ser legibles antes de escalar tráfico o empujar agresivamente mercados internacionales.',
    href: '/admin/bookings',
    icon: Globe,
  },
  {
    title: 'Market Next',
    body: 'Usa las vías de campaña para decidir qué publicar, qué escalar y qué mantener en espera para después.',
    href: '/admin/marketing',
    icon: Rocket,
  },
];

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
};

export default function ExecutiveLaunchHQDeck({
  compact = false,
  title = 'Executive Launch HQ',
  description = 'Un carril de mando único para decidir qué escalar, qué proteger y qué arreglar antes de empujar KCE con más fuerza.',
}: Props) {
  return (
    <section className="rounded-brand-2xl border border-brand-dark/10 bg-surface p-6 shadow-hard md:p-8">
      {/* Header Section */}
      <div className={clsx(
        'flex flex-col gap-6', 
        compact ? 'md:flex-row md:items-end md:justify-between' : 'xl:flex-row xl:items-start xl:justify-between'
      )}>
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
            <Rocket className="h-3 w-3" />
            Executive HQ
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-blue md:text-4xl">
            {title}
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link 
            href="/admin/launch-hq" 
            className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 active:scale-95"
          >
            Open Launch HQ
          </Link>
          <Link 
            href="/admin/command-center" 
            className="rounded-xl border border-brand-dark/10 bg-surface-2 px-6 py-2.5 text-sm font-bold text-main transition-all hover:bg-surface"
          >
            Command Center
          </Link>
        </div>
      </div>

      {/* Lanes Grid */}
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {lanes.map((lane) => {
          const Icon = lane.icon;
          const isDark = lane.tone === 'dark';

          return (
            <article
              key={lane.title}
              className={clsx(
                'group relative flex flex-col rounded-brand border p-6 transition-all duration-300',
                isDark
                  ? 'border-transparent bg-brand-dark text-white shadow-hard'
                  : 'border-brand-dark/5 bg-surface-2 text-main hover:border-brand-blue/20 hover:bg-surface hover:shadow-pop'
              )}
            >
              {/* Overlay sutil para la versión Dark */}
              {isDark && (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/30 via-transparent to-brand-yellow/10 opacity-30" />
              )}

              <div className="relative z-10 flex flex-1 flex-col">
                <header className="flex items-center justify-between">
                  <span className={clsx(
                    'text-[10px] font-bold uppercase tracking-widest',
                    isDark ? 'text-brand-yellow' : 'text-muted'
                  )}>
                    Launch Lane
                  </span>
                  <Icon className={clsx(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    isDark ? 'text-white/40' : 'text-brand-blue/30'
                  )} />
                </header>

                <h3 className={clsx(
                  'mt-4 font-heading text-xl font-bold tracking-tight',
                  isDark ? 'text-white' : 'text-brand-blue'
                )}>
                  {lane.title}
                </h3>

                <p className={clsx(
                  'mt-3 flex-1 text-sm leading-relaxed',
                  isDark ? 'text-white/70' : 'text-muted'
                )}>
                  {lane.body}
                </p>

                <Link
                  href={lane.href}
                  className={clsx(
                    'mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95',
                    isDark
                      ? 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                      : 'bg-brand-blue text-white shadow-soft hover:bg-brand-blue/90'
                  )}
                >
                  Open Lane
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}