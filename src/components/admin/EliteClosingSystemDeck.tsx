'use client';

import clsx from 'clsx';
import { ShieldCheck, Zap, RotateCcw, CheckCircle2 } from 'lucide-react';

type ClosingLane = {
  kicker: string;
  title: string;
  body: string;
  icon: any;
  highlight?: boolean;
};

const lanes: ClosingLane[] = [
  {
    kicker: '01 · Close cleaner',
    title: 'Guide traffic into calmer buying lanes',
    icon: Zap,
    body: 'Empuja las páginas con mejor conversión y paths de handoff en lugar de forzar un mismo ritmo de checkout.',
  },
  {
    kicker: '02 · Deliver with confidence',
    title: 'Keep bookings & assets reading the same truth',
    icon: ShieldCheck,
    body: 'El funnel premium solo se sostiene si el revenue, la entrega y el soporte se sienten coordinados post-pago.',
    highlight: true,
  },
  {
    kicker: '03 · Recover without panic',
    title: 'Make rescue paths look intentional',
    icon: RotateCcw,
    body: 'Si un viajero duda, el fallback de rescate debe ser rápido, comercialmente controlado y de alta calidad.',
  },
];

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export default function EliteClosingSystemDeck({
  title = 'Elite Closing System',
  description = 'Usa esta capa final para conectar la presión de conversión con la calma operativa antes de dar un lanzamiento por exitoso.',
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
      <div className={clsx('grid gap-0 lg:grid-cols-[0.9fr_1.1fr]', compact ? 'min-h-0' : 'min-h-[22rem]')}>
        
        {/* Panel Izquierdo: Manifiesto */}
        <div className="relative flex flex-col justify-center bg-brand-dark p-8 text-white md:p-12">
          {/* Overlay de branding institucional */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/40 via-transparent to-brand-yellow/10 opacity-40" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
              <CheckCircle2 className="h-3 w-3" />
              Elite Operational Layer
            </div>
            
            <h2 className="mt-6 font-heading text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {title}
            </h2>
            
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {['Traffic fit', 'Delivery calm', 'Recovery speed'].map((label) => (
                <div 
                  key={label} 
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur-md"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel Derecho: Lanes de ejecución */}
        <div className="grid gap-4 bg-surface-2 p-6 md:grid-cols-3 md:p-8">
          {lanes.map((lane) => {
            const Icon = lane.icon;
            return (
              <article
                key={lane.title}
                className={clsx(
                  'group relative flex flex-col rounded-brand border p-6 transition-all duration-300',
                  lane.highlight
                    ? 'border-transparent bg-brand-blue text-white shadow-pop'
                    : 'border-brand-dark/5 bg-surface text-main hover:border-brand-blue/20 hover:shadow-soft'
                )}
              >
                {lane.highlight && (
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20" />
                )}

                <div className="relative z-10 flex flex-1 flex-col">
                  <header className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[10px] font-bold uppercase tracking-widest',
                      lane.highlight ? 'text-brand-yellow' : 'text-brand-blue'
                    )}>
                      {lane.kicker}
                    </span>
                    <Icon className={clsx(
                      'h-4 w-4 transition-transform group-hover:scale-110',
                      lane.highlight ? 'text-white/40' : 'text-brand-blue/30'
                    )} />
                  </header>

                  <h3 className="mt-4 font-heading text-lg font-bold leading-tight tracking-tight">
                    {lane.title}
                  </h3>
                  
                  <p className={clsx(
                    'mt-3 text-[13px] leading-relaxed',
                    lane.highlight ? 'text-white/70' : 'text-muted'
                  )}>
                    {lane.body}
                  </p>
                </div>

                {/* Decoración de status */}
                <div className={clsx(
                  'mt-6 h-1 w-6 rounded-full transition-all group-hover:w-10',
                  lane.highlight ? 'bg-brand-yellow' : 'bg-brand-blue/20'
                )} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}