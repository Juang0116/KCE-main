'use client';

import Link from 'next/link';
import { 
  ArrowRight, 
  BadgeCheck, 
  Blocks, 
  LifeBuoy, 
  ShieldCheck, 
  WalletCards,
  Sparkles 
} from 'lucide-react';
import clsx from 'clsx';

const lanes = [
  {
    icon: WalletCards,
    eyebrow: 'Revenue Truth',
    title: 'Charge → Booking → Assets',
    body: 'Cada venta debe ser una historia continua: Stripe, booking, invoice y email sincronizados.',
    href: '/admin/revenue',
    label: 'Abrir Revenue',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Release Gate',
    title: 'QA + Verify + Recovery',
    iconColor: 'text-brand-blue',
    body: 'Valida preflight, RC Verify y recovery de bookings antes de escalar tráfico.',
    href: '/admin/qa',
    label: 'Abrir QA',
  },
  {
    icon: Blocks,
    eyebrow: 'Delivery Ops',
    title: 'Bookings + Soporte',
    body: 'Asegura que el viajero recibió sus activos y que soporte tiene el contexto completo.',
    href: '/admin/bookings',
    label: 'Ver Bookings',
  },
  {
    icon: LifeBuoy,
    eyebrow: 'Traveler Continuity',
    title: 'Account Confidence',
    body: 'La cuenta del viajero debe ser premium: reservas claras y descargas sin fricción.',
    href: '/account/bookings',
    label: 'Abrir Account',
  },
] as const;

const checklist = [
  'Compra real/test termina con booking visible y activos descargables.',
  'Flujo completo en mobile sin ruido visual ni scroll lateral.',
  'Support y Revenue usan el mismo lenguaje para recuperar casos.',
  'La operación sabe qué revisar antes de escalar campañas.',
] as const;

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export default function ReleaseGradeDeck({
  title = 'Release-Grade Confidence Layer',
  description = 'Garantiza que KCE opere como una empresa de clase mundial: revenue claro, recuperación definida y confianza absoluta antes del escalado.',
  compact = false,
}: Props) {
  return (
    <section className="overflow-hidden rounded-brand-2xl border border-brand-dark/10 bg-[linear-gradient(135deg,rgba(9,31,68,0.98),rgba(20,78,168,0.95)_55%,rgba(216,176,74,0.25))] text-white shadow-hard">
      <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
        
        {/* Main Content: The Four Pillars */}
        <div className="p-6 md:p-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <BadgeCheck className="h-3.5 w-3.5 fill-brand-yellow text-brand-dark" />
              Release Grade
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {title}
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-white/70">
              {description}
            </p>
          </header>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {lanes.map((lane) => {
              const Icon = lane.icon;
              return (
                <article 
                  key={lane.title} 
                  className="group flex flex-col rounded-brand-lg border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-brand-dark/50 shadow-soft group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5 text-brand-blue" />
                    </span>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        {lane.eyebrow}
                      </div>
                      <h3 className="mt-1 font-heading text-lg font-bold text-white">
                        {lane.title}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-white/60">
                    {lane.body}
                  </p>
                  
                  <div className="mt-6">
                    <Link
                      href={lane.href}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/20 active:scale-95"
                    >
                      {lane.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Tactical Hardening */}
        <aside className="relative flex flex-col border-t border-white/10 bg-brand-dark/30 p-8 backdrop-blur-xl xl:border-l xl:border-t-0 md:p-10">
          <div className="relative z-10">
            <header className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/60">
                Launch Confidence
              </div>
              <Sparkles className="h-4 w-4 text-brand-blue/40" />
            </header>
            
            <h3 className="mt-4 font-heading text-2xl font-bold text-white leading-tight">
              Checklist de Solidez <br/> Operativa
            </h3>
            
            <div className="mt-8 space-y-3">
              {checklist.map((item, idx) => (
                <div 
                  key={item} 
                  className="group flex items-start gap-4 rounded-brand border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10"
                >
                  <span className="mt-0.5 text-[10px] font-black text-brand-blue/40 group-hover:text-brand-blue transition-colors">
                    0{idx + 1}
                  </span>
                  <p className="text-[13px] leading-relaxed text-white/80">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            {!compact && (
              <div className="mt-10 rounded-2xl bg-brand-blue/20 p-5 border border-brand-blue/30">
                <p className="text-[12px] leading-relaxed text-brand-blue/80 font-medium italic">
                  "No buscamos solo sumar features, sino que cada parte del loop comercial sea más confiable y premium antes de presionar el acelerador."
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}