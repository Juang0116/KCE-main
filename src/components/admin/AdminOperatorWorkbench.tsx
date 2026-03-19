import Link from 'next/link';
import { ArrowUpRight, Activity } from 'lucide-react';

type QuickAction = {
  href: string;
  label: string;
  tone?: 'primary' | 'default';
};

type Signal = {
  label: string;
  value: string;
  note: string;
  trend?: 'up' | 'down' | 'neutral'; // Opcional para dar más contexto visual
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: QuickAction[];
  signals?: Signal[];
};

export default function AdminOperatorWorkbench({
  eyebrow,
  title,
  description,
  actions = [],
  signals = [],
}: Props) {
  return (
    <section className="rounded-brand border border-surface-2 bg-surface p-6 shadow-soft transition-all duration-300 hover:shadow-pop lg:p-8">
      {/* Header del Workbench */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
            <Activity className="h-3 w-3" />
            {eyebrow}
          </div>
          
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-blue md:text-4xl">
            {title}
          </h2>
          
          <p className="max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            {description}
          </p>
        </div>

        {/* Acciones Rápidas */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={`${action.href}:${action.label}`}
                href={action.href}
                className={`
                  inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all active:scale-95
                  ${action.tone === 'primary' 
                    ? 'bg-brand-blue text-white shadow-soft hover:bg-brand-blue/90' 
                    : 'border border-brand-dark/10 bg-surface-2 text-main hover:bg-brand-dark/5'
                  }
                `}
              >
                {action.label}
                {action.tone === 'primary' && <ArrowUpRight className="h-3.5 w-3.5" />}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Grid de Señales / Métricas */}
      {signals.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {signals.map((signal) => (
            <article
              key={`${signal.label}:${signal.value}`}
              className="group rounded-2xl border border-brand-dark/5 bg-surface-2 p-5 transition-colors hover:border-brand-blue/20 hover:bg-surface"
            >
              <header className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  {signal.label}
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-brand-blue/40 group-hover:bg-brand-blue animate-pulse" />
              </header>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-brand-blue">
                  {signal.value}
                </span>
              </div>

              <p className="mt-2 text-xs font-medium leading-relaxed text-muted/80">
                {signal.note}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}