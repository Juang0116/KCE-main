'use client';

import clsx from 'clsx';
import { TrendingUp, Globe, MousePointer2, BarChart } from 'lucide-react';

type Lane = {
  eyebrow: string;
  title: string;
  body: string;
  tone?: 'light' | 'dark';
};

type Props = {
  title?: string;
  subtitle?: string;
  lanes: Lane[];
  className?: string;
};

export default function GrowthOpsDeck({
  title = 'International Growth Machine',
  subtitle = 'Convierte señales de marketing en un ritmo operativo claro a través de adquisición, nutrición y conversión.',
  lanes,
  className,
}: Props) {
  return (
    <section
      className={clsx(
        'overflow-hidden rounded-brand-2xl border border-brand-dark/10 bg-surface shadow-hard transition-all duration-300',
        className,
      )}
    >
      {/* Header con gradiente sutil de fondo */}
      <div className="relative border-b border-brand-dark/5 bg-gradient-to-b from-brand-blue/[0.02] to-transparent px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <TrendingUp className="h-3 w-3" />
              Growth Command Deck
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              {subtitle}
            </p>
          </div>
          
          {/* Badge de Status Global */}
          <div className="hidden items-center gap-4 rounded-xl border border-brand-dark/5 bg-surface-2 p-3 md:flex">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Global Reach</span>
                <span className="text-sm font-bold text-brand-blue">Active Markets</span>
             </div>
             <Globe className="h-5 w-5 text-brand-blue/40" />
          </div>
        </div>
      </div>

      {/* Grid de Lanes */}
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3 md:p-8">
        {lanes.map((lane) => {
          const isDark = lane.tone === 'dark';
          
          return (
            <div
              key={lane.title}
              className={clsx(
                'group relative flex flex-col rounded-brand-lg border p-6 transition-all duration-300 hover:-translate-y-1',
                isDark
                  ? 'border-transparent bg-brand-dark text-white shadow-pop'
                  : 'border-brand-dark/5 bg-surface-2 text-main hover:border-brand-blue/20 hover:bg-surface hover:shadow-soft',
              )}
            >
              {/* Decoración para Lane Oscura */}
              {isDark && (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/30 to-brand-yellow/10 opacity-30" />
              )}

              <div className="relative z-10 flex flex-1 flex-col">
                <header className="flex items-center justify-between">
                  <span className={clsx(
                    'text-[10px] font-bold uppercase tracking-[0.18em]',
                    isDark ? 'text-brand-yellow' : 'text-brand-blue/60'
                  )}>
                    {lane.eyebrow}
                  </span>
                  {isDark ? (
                     <MousePointer2 className="h-4 w-4 text-white/30 group-hover:text-white/60" />
                  ) : (
                     <BarChart className="h-4 w-4 text-brand-blue/20 group-hover:text-brand-blue/40" />
                  )}
                </header>

                <div className="mt-4 font-heading text-lg font-bold tracking-tight">
                  {lane.title}
                </div>
                
                <p className={clsx(
                  'mt-3 text-[13px] leading-relaxed',
                  isDark ? 'text-white/75' : 'text-muted'
                )}>
                  {lane.body}
                </p>

                {/* Footer de la tarjeta con flecha sutil */}
                <div className="mt-6 flex items-center gap-2 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
                   <span className={clsx('text-[10px] font-bold uppercase tracking-widest', isDark ? 'text-brand-yellow' : 'text-brand-blue')}>
                     View Details
                   </span>
                   <div className={clsx('h-px flex-1', isDark ? 'bg-white/10' : 'bg-brand-dark/5')} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}