'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { ShieldCheck, Eye, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
  accountHref?: string;
};

type Lane = {
  eyebrow: string;
  title: string;
  body: string;
  icon: any;
  highlight?: boolean;
};

const lanes: Lane[] = [
  {
    eyebrow: 'Launch Now',
    title: 'Push traffic only when the traveler path feels effortless',
    icon: Activity,
    body: 'Home, tours, matcher y checkout deben leerse como una sola promesa. Si un paso se siente improvisado, arréglalo antes de escalar.',
    highlight: true,
  },
  {
    eyebrow: 'Watch Next',
    title: 'Protect post-purchase confidence after payment',
    icon: Eye,
    body: 'Success, booking y soporte deben mantener el mismo tono y contexto para que el viajero nunca se sienta abandonado tras pagar.',
  },
  {
    eyebrow: 'Operate',
    title: 'Let revenue, QA & sales tell the same story',
    icon: ShieldCheck,
    body: 'El equipo debe responder rápido: qué está ganando, qué es frágil y qué debe arreglarse antes de presionar más fuerte.',
  },
];

const launchChecklist = [
  ['Traffic lanes', 'Verifica que las páginas de mercado y rutas premium aterricen en el CTA correcto para visitantes fríos.'],
  ['Mobile proof', 'Revisa el flujo vertical en móvil para asegurar que no haya fricción o drift horizontal en el checkout.'],
  ['Revenue proof', 'Confirma que RC Verify, bookings y email reflejen la misma sesión pagada antes de subir el volumen.'],
  ['Operator proof', 'Marketing y Sales deben conocer el siguiente movimiento sin tener que abrir cinco paneles no relacionados.'],
] as const;

export default function LaunchConfidenceDeck({
  compact = false,
  title = 'Launch Confidence Closeout',
  description = 'Usa este bloque como el último filtro comercial: lanza solo cuando el UX, el revenue y la confianza operativa estén alineados.',
  accountHref = '/es/account/bookings',
}: Props) {
  return (
    <section className="overflow-hidden rounded-brand-2xl border border-brand-dark/10 bg-surface shadow-hard">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Main Content Area */}
        <div className="p-6 md:p-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <ShieldCheck className="h-3 w-3" />
              Last Premium Polish
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
            compact ? 'md:grid-cols-1 xl:grid-cols-3' : 'md:grid-cols-3'
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
                  <div className={clsx(
                    'text-[10px] font-bold uppercase tracking-widest',
                    lane.highlight ? 'text-brand-blue' : 'text-muted'
                  )}>
                    {lane.eyebrow}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <h3 className="font-heading text-lg font-bold leading-tight">
                      {lane.title}
                    </h3>
                    <Icon className={clsx(
                      'h-5 w-5 opacity-40',
                      lane.highlight ? 'text-white' : 'text-brand-blue'
                    )} />
                  </div>

                  <p className={clsx(
                    'mt-3 flex-1 text-sm leading-relaxed',
                    lane.highlight ? 'text-white/80' : 'text-muted'
                  )}>
                    {lane.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Checklist de confianza */}
        <aside className="relative flex flex-col bg-brand-dark p-8 text-white md:p-10">
          {/* Overlay sutil de marca */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-yellow/5 opacity-30" />
          
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              <CheckCircle2 className="h-3 w-3" />
              Launch Confidence Order
            </div>
            
            <div className="mt-8 flex-1 space-y-4">
              {launchChecklist.map(([heading, copy]) => (
                <div key={heading} className="rounded-brand border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
                  <p className="text-sm font-bold text-brand-blue">{heading}</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">{copy}</p>
                </div>
              ))}
            </div>

            {/* Quick Access Links */}
            <nav className="mt-10 flex flex-wrap gap-2">
              {[
                { href: '/admin/qa', label: 'QA' },
                { href: '/admin/revenue', label: 'REV' },
                { href: '/admin/marketing', label: 'MKTG' },
                { href: '/admin/sales', label: 'SALE' },
                { href: accountHref, label: 'ACC' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
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