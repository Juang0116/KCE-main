'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { 
  ShieldCheck, 
  Database, 
  UserCheck, 
  ClipboardCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
};

const lanes = [
  {
    eyebrow: 'Truth source',
    title: 'Revenue, bookings y account deben contar la misma historia',
    icon: Database,
    body: 'Antes de mover tráfico, comprueba que checkout, booking, invoice y account reflejan la misma reserva sin interpretaciones manuales.',
  },
  {
    eyebrow: 'Traveler confidence',
    title: 'La experiencia post-compra debe sentirse premium',
    icon: Sparkles,
    body: 'Success y Account tienen que ayudar al viajero a encontrar activos y pedir soporte sin ruido visual ni fricción.',
  },
  {
    eyebrow: 'Operator confidence',
    title: 'El equipo debe saber exactamente dónde actuar',
    icon: UserCheck,
    body: 'QA, Revenue y Marketing deben dejar claro qué revisar y cuándo un release ya está listo para vender con confianza.',
  },
] as const;

const checklist = [
  ['QA + RC Verify', 'Ejecuta Production Preflight y una verificación real de compra antes de declarar el Release Candidate.'],
  ['Delivery assets', 'Comprueba booking, invoice y calendar con un caso real. Si algo falla, usa heal/retry de inmediato.'],
  ['Account confidence', 'Verifica que el viajero pueda descargar activos y volver al tour sin perder el contexto de su sesión.'],
  ['Growth safety', 'Confirma que el funnel completo resiste tráfico internacional masivo y no solo navegación local de pruebas.'],
] as const;

export default function ReleaseCandidateFinalDeck({
  compact = false,
  title = 'Release Candidate Final View',
  description = 'Este deck junta el último tramo de hardening, polish y confianza operativa para asegurar que KCE está listo para vender sin improvisación.',
}: Props) {
  return (
    <section className="overflow-hidden rounded-brand-2xl border border-brand-dark/10 bg-surface shadow-hard">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Contenido Principal: Pilares de Lanzamiento */}
        <div className="p-6 md:p-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <ShieldCheck className="h-3 w-3" />
              Release Candidate Final
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
                  className="group flex flex-col rounded-brand-lg border border-brand-dark/5 bg-surface-2 p-6 transition-all duration-300 hover:border-brand-blue/20 hover:bg-surface hover:shadow-soft"
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/50">
                    {lane.eyebrow}
                  </div>
                  <Icon className="mt-4 h-5 w-5 text-brand-blue opacity-40 group-hover:opacity-100 transition-opacity" />
                  <h3 className="mt-3 font-heading text-lg font-bold leading-tight text-brand-blue">
                    {lane.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {lane.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        {/* Aside: Closeout Checklist */}
        <aside className="relative flex flex-col bg-brand-dark p-8 text-white md:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-yellow/5 opacity-30" />
          
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              <ClipboardCheck className="h-3 w-3 text-brand-yellow" />
              Closeout Order
            </div>
            
            <div className="mt-8 flex-1 space-y-4">
              {checklist.map(([heading, copy]) => (
                <div key={heading} className="rounded-brand border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
                  <p className="text-sm font-bold text-brand-yellow">{heading}</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">{copy}</p>
                </div>
              ))}
            </div>

            {/* Quick Access Navigation */}
            <nav className="mt-10 flex flex-wrap gap-2">
              {[
                { href: '/admin/qa', label: 'QA Desk' },
                { href: '/admin/revenue', label: 'Revenue Ops' },
                { href: '/admin/bookings', label: 'Booking Ops' },
                { href: '/es/account/bookings', label: 'Account' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-white/60 transition hover:bg-white/15 hover:text-white"
                >
                  {link.label}
                  <ArrowRight className="h-2.5 w-2.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </section>
  );
}