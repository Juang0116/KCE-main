'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Wind, ShieldCheck, CreditCard, UserCheck, ArrowRight } from 'lucide-react';

type Step = {
  label: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: any;
  emphasis?: boolean;
};

const steps: Step[] = [
  {
    label: 'Step 01',
    title: 'Reduce noise before scale',
    icon: Wind,
    body: 'Corta chequeos duplicados. Mantén el reporte de lanzamiento lo suficientemente simple para que cualquier operador sepa qué revisar primero.',
    href: '/admin/qa',
    cta: 'Open QA',
    emphasis: true,
  },
  {
    label: 'Step 02',
    title: 'Confirm paid truth fast',
    icon: CreditCard,
    body: 'Revenue, bookings y account deben contar la misma historia sin saltar entre paneles o adivinar el siguiente movimiento.',
    href: '/admin/revenue',
    cta: 'Open Revenue',
  },
  {
    label: 'Step 03',
    title: 'Keep the traveler path calm',
    icon: UserCheck,
    body: 'El centro de reservas y la cuenta del cliente deben ser un carril premium: activos visibles, soporte claro y seguimiento fácil.',
    href: '/es/account/bookings',
    cta: 'Open Account',
  },
];

const rails = [
  ['Launch fewer messages, better', 'Cuando todo es urgente, se pierde la narrativa. Elige un carril de mercado y uno de soporte que importen esta semana.'],
  ['Make recovery obvious', 'Si una reserva falla, la acción correctiva debe ser visible de inmediato en QA, Revenue o Bookings.'],
  ['Protect confidence after the click', 'El crecimiento internacional solo escala si el viajero se siente guiado después del pago, no solo antes.'],
] as const;

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
};

export default function GoLiveSimplificationDeck({
  compact = false,
  title = 'Go-Live Simplification System',
  description = 'Haz que KCE sea fácil de operar bajo presión: menos señales compitiendo, acciones más claras y un viaje del viajero más tranquilo.',
}: Props) {
  return (
    <section className="overflow-hidden rounded-brand-2xl border border-brand-dark/10 bg-surface shadow-hard">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        
        {/* Main Content Area */}
        <div className="p-6 md:p-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <Wind className="h-3 w-3" />
              Launch Simplification
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
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className={clsx(
                    'group relative flex flex-col rounded-brand-lg border p-6 transition-all duration-300',
                    step.emphasis
                      ? 'border-transparent bg-brand-blue text-white shadow-pop'
                      : 'border-brand-dark/5 bg-surface-2 text-main hover:border-brand-blue/20 hover:bg-surface'
                  )}
                >
                  <div className={clsx(
                    'text-[10px] font-bold uppercase tracking-widest',
                    step.emphasis ? 'text-brand-blue' : 'text-muted'
                  )}>
                    {step.label}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <h3 className="font-heading text-lg font-bold leading-tight">
                      {step.title}
                    </h3>
                    <Icon className={clsx(
                      'h-5 w-5 opacity-40',
                      step.emphasis ? 'text-white' : 'text-brand-blue'
                    )} />
                  </div>

                  <p className={clsx(
                    'mt-3 flex-1 text-sm leading-relaxed',
                    step.emphasis ? 'text-white/70' : 'text-muted'
                  )}>
                    {step.body}
                  </p>

                  <div className="mt-6">
                    <Link
                      href={step.href}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95',
                        step.emphasis
                          ? 'bg-white/10 text-white hover:bg-white/20'
                          : 'bg-brand-blue text-white hover:bg-brand-blue/90 shadow-soft'
                      )}
                    >
                      {step.cta}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Operator Rules */}
        <aside className="relative overflow-hidden bg-brand-dark p-8 text-white md:p-10">
          {/* Subtle branding glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-yellow/5 opacity-30" />
          
          <div className="relative z-10 flex h-full flex-col">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Operator Rules
            </div>
            
            <div className="mt-8 flex-1 space-y-4">
              {rails.map(([heading, copy]) => (
                <div key={heading} className="rounded-brand border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
                  <p className="text-sm font-bold text-brand-blue">{heading}</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">{copy}</p>
                </div>
              ))}
            </div>

            <nav className="mt-10 flex flex-wrap gap-2">
              {[
                { href: '/admin/qa', label: 'QA' },
                { href: '/admin/revenue', label: 'REV' },
                { href: '/admin/bookings', label: 'BKNG' },
                { href: '/admin/sales', label: 'SALE' },
                { href: '/admin/marketing', label: 'MKTG' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-tighter text-white/60 transition hover:bg-white/10 hover:text-white"
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