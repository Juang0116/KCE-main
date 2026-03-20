'use client';

import clsx from 'clsx';
import { Trophy, Star, ShieldCheck, Compass, Zap, CheckCircle2 } from 'lucide-react';

type DominanceLane = {
  kicker: string;
  title: string;
  body: string;
  icon: any;
  highlight?: boolean;
};

const lanes: DominanceLane[] = [
  {
    kicker: '01 · Demand quality',
    title: 'Scale the lanes that still feel curated',
    icon: Compass,
    body: 'No recompenses el tráfico ruidoso. Prioriza las rutas de intención y mercados que protegen la confianza y el comportamiento de compra calmado.',
  },
  {
    kicker: '02 · Conversion authority',
    title: 'Make the close feel inevitable',
    icon: Star,
    body: 'La señal premium debe sobrevivir desde el shortlist hasta el pago: ayuda humana y confianza deben reforzar la misma promesa.',
    highlight: true,
  },
  {
    kicker: '03 · Operator calm',
    title: 'Keep delivery readable under pressure',
    icon: ShieldCheck,
    body: 'Un sistema dominante se mantiene claro. Revenue, bookings y soporte deben leerse como una sola verdad operativa bajo presión.',
  },
];

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export default function FinalDominanceSystemDeck({
  title = 'Final Dominance System',
  description = 'Usa esta capa de cierre para confirmar que KCE puede atraer, calificar, cerrar y recuperar con el mismo ritmo premium antes de escalar internacionalmente.',
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
      <div className={clsx('grid gap-0 lg:grid-cols-[0.95fr_1.05fr]', compact ? 'min-h-0' : 'min-h-[22rem]')}>
        
        {/* Lado Izquierdo: Branding de Dominancia */}
        <div className="relative flex flex-col justify-center bg-brand-dark p-8 text-white md:p-12">
          {/* Capa de profundidad visual */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/40 via-transparent to-brand-yellow/15 opacity-40" />
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <Trophy className="h-3 w-3" />
              Final Dominance
            </div>
            
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-5xl">
              {title}
            </h2>
            
            <p className="max-w-xl text-base leading-relaxed text-white/70">
              {description}
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              {['Demand fit', 'Close authority', 'Operator calm'].map((label) => (
                <div 
                  key={label} 
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-white/90 backdrop-blur-md"
                >
                  <CheckCircle2 className="h-3 w-3 text-brand-blue/70" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Carriles de Ejecución */}
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
                      'text-[10px] font-bold uppercase tracking-widest',
                      isHighlighted ? 'text-brand-blue' : 'text-brand-blue/60'
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
                    'mt-3 text-[13px] leading-relaxed',
                    isHighlighted ? 'text-white/75' : 'text-muted'
                  )}>
                    {lane.body}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className={clsx(
                  'mt-6 h-1 w-6 rounded-full transition-all group-hover:w-10',
                  isHighlighted ? 'bg-brand-yellow' : 'bg-brand-blue/20'
                )} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}