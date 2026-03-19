'use client';

import clsx from 'clsx';
import { 
  Zap, 
  UserCheck, 
  ShieldAlert, 
  LayoutDashboard, 
  CheckCircle2,
  TrendingUp 
} from 'lucide-react';

type LaunchLane = {
  kicker: string;
  title: string;
  body: string;
  icon: any;
  highlight?: boolean;
};

const lanes: LaunchLane[] = [
  {
    kicker: '01 · Traffic Discipline',
    title: 'Scale only lanes that sustain delivery',
    icon: TrendingUp,
    body: 'Empuja páginas de mercado y tráfico pagado solo cuando los bookings, el revenue y el soporte se lean como un sistema calmo y recuperable.',
  },
  {
    kicker: '02 · Operator Readiness',
    title: 'Keep teams reading the same truth',
    icon: UserCheck,
    body: 'Antes de escalar, confirma que los equipos admin pueden verificar pagos y activos de viaje sin saltar entre paneles desconectados.',
    highlight: true,
  },
  {
    kicker: '03 · Premium Continuity',
    title: 'The promise must survive purchase',
    icon: ShieldAlert,
    body: 'El éxito no es solo adquisición. Significa que la cuenta y el soporte se sientan premium cuando los viajeros lleguen en volumen.',
  },
] as const;

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export default function LaunchExecutionSystemDeck({
  title = 'Launch Execution System',
  description = 'Usa esta capa final para conectar la presión del mercado, la claridad del operador y la calma del viajero antes de dar el release por listo.',
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
        
        {/* Panel Izquierdo: Branding y Metas */}
        <div className="relative flex flex-col justify-center bg-brand-dark p-8 text-white md:p-12">
          {/* Capa de profundidad con los colores de marca */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/30 via-transparent to-brand-yellow/15 opacity-40" />
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
              <Zap className="h-3 w-3 fill-brand-yellow" />
              Launch Execution
            </div>
            
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-5xl">
              {title}
            </h2>
            
            <p className="max-w-xl text-base leading-relaxed text-white/70">
              {description}
            </p>

            {/* Badges de Verificación */}
            <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
              {['Revenue Truth', 'Operator Calm', 'Traveler Confidence'].map((label) => (
                <div 
                  key={label} 
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] font-bold text-white/90 backdrop-blur-md"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-yellow/70" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel Derecho: Carriles Operativos */}
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
                    ? 'border-transparent bg-brand-dark text-white shadow-pop'
                    : 'border-brand-dark/5 bg-surface text-main hover:border-brand-blue/20 hover:shadow-soft'
                )}
              >
                {isHighlighted && (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/40 to-brand-yellow/10 opacity-30" />
                )}

                <div className="relative z-10 flex flex-1 flex-col">
                  <header className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[10px] font-bold uppercase tracking-widest',
                      isHighlighted ? 'text-brand-yellow' : 'text-brand-blue/60'
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

                  {/* Indicador de Status/Progreso */}
                  <div className="mt-6 flex items-center gap-2">
                    <div className={clsx(
                      'h-1.5 w-full rounded-full overflow-hidden',
                      isHighlighted ? 'bg-white/10' : 'bg-brand-dark/5'
                    )}>
                      <div className={clsx(
                        'h-full w-2/3 rounded-full',
                        isHighlighted ? 'bg-brand-yellow' : 'bg-brand-blue'
                      )} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}