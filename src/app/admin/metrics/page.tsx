import 'server-only';

import Link from 'next/link';
import { AdminMetricsClient } from './AdminMetricsClient';
import type { Metadata } from 'next';
import { Activity, Target, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Métricas | KCE',
  robots: { index: false, follow: false },
};

export default function AdminMetricsPage() {
  return (
    <main className="space-y-10 pb-20">
      
      {/* HEADER EJECUTIVO (HERO) */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-brand-dark p-8 md:p-12 text-white shadow-2xl transition-transform hover:scale-[1.01] duration-500">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/90 to-brand-blue/20"></div>

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md shadow-sm">
            <Activity className="h-3 w-3" /> Data to Action Framework
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-5xl drop-shadow-md">
            Métricas Comerciales
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-light leading-relaxed text-white/80 md:text-base">
            Funnel comercial y señales de Revenue Ops para detectar dónde acelerar, dónde insistir y qué campañas se están enfriando. Úsalo como panel de detección antes de ejecutar acción manual.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admin/sales" className="flex items-center gap-2 rounded-full border border-brand-blue/50 bg-brand-blue px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md hover:shadow-lg">
              Sales Cockpit <ArrowRight className="h-3 w-3"/>
            </Link>
            <Link href="/admin/deals" className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-brand-dark">Deals</Link>
            <Link href="/admin/outbound" className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-brand-dark">Outbound</Link>
            <Link href="/admin/revenue" className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-brand-dark">Revenue</Link>
          </div>
        </div>
      </section>

      {/* METODOLOGÍA (CARDS) */}
      <div>
        <div className="mb-6 flex items-center gap-3 px-2">
          <Target className="h-6 w-6 text-brand-blue" />
          <h2 className="font-heading text-2xl text-[var(--color-text)]">Ciclo de Optimización</h2>
        </div>
        
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-colors hover:border-brand-blue/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-3 flex items-center gap-1.5">Paso 1</div>
            <div className="font-heading text-xl text-[var(--color-text)] mb-2">Detectar</div>
            <p className="text-xs font-light leading-relaxed text-[var(--color-text)]/70">Identifica una sola señal crítica. Encuentra la fuga en el embudo: start, proposal, checkout, reply o paid.</p>
          </div>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-colors hover:border-brand-blue/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-3 flex items-center gap-1.5">Paso 2</div>
            <div className="font-heading text-xl text-[var(--color-text)] mb-2">Hipótesis</div>
            <p className="text-xs font-light leading-relaxed text-[var(--color-text)]/70">Si la señal cae, decide si el problema es el mensaje, el timing del bot, la oferta o fricción en la UI.</p>
          </div>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-colors hover:border-brand-blue/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-3 flex items-center gap-1.5">Paso 3</div>
            <div className="font-heading text-xl text-[var(--color-text)] mb-2">Ejecutar</div>
            <p className="text-xs font-light leading-relaxed text-[var(--color-text)]/70">Abre el panel correcto (Deals, Outbound, Templates) y mueve una sola variable a la vez para medir su impacto.</p>
          </div>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-colors hover:border-brand-blue/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-3 flex items-center gap-1.5">Paso 4</div>
            <div className="font-heading text-xl text-[var(--color-text)] mb-2">Confirmar</div>
            <p className="text-xs font-light leading-relaxed text-[var(--color-text)]/70">Regresa a esta pantalla días después para comprobar si el ajuste táctico movió la aguja en checkout o paid.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-5 text-sm font-light text-brand-dark/80 flex items-center gap-3">
        <Zap className="h-5 w-5 text-brand-yellow shrink-0"/>
        <span>Ritmo recomendado: si el loop de optimización no cambia la señal después de dos iteraciones, el problema estructural está en la cadencia o el precio.</span>
      </div>
      
      {/* RENDER DEL CLIENT COMPONENT DE MÉTRICAS */}
      <AdminMetricsClient />
    </main>
  );
}