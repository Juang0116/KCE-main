// src/app/admin/metrics/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Activity, Target, Zap, ArrowRight, 
  Terminal, ShieldCheck, Sparkles, 
  Layers, BarChart3, Search, TrendingUp
} from 'lucide-react';

import { AdminMetricsClient } from './AdminMetricsClient';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Commercial Intelligence | Admin KCE',
  description: 'Telemetría comercial de alto mando y optimización de funnel para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminMetricsPage:
 * Shell de servidor para la inteligencia comercial.
 * Establece el marco estratégico antes de montar el motor de telemetría dinámico.
 */
export default async function AdminMetricsPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-7xl space-y-12 p-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. HEADER DE ALTO MANDO (HERO VAULT) */}
      <section className="relative overflow-hidden rounded-[3.5rem] bg-brand-dark p-10 md:p-16 text-white shadow-2xl group">
        {/* Capas de Textura y Gradiente */}
        <div className="absolute inset-0 opacity-10 bg-[url('/images/grid-pattern.svg')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark to-brand-blue/30"></div>
        
        <div className="relative z-10 space-y-8">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-yellow backdrop-blur-xl shadow-inner">
              <Terminal className="h-3.5 w-3.5" /> Intelligence Lane: /commercial-vault
            </div>
            <h1 className="font-heading text-5xl md:text-7xl leading-[1.1] text-white">
              Executive <span className="text-brand-yellow italic font-light">Analytics</span>
            </h1>
            <p className="max-w-3xl text-lg font-light leading-relaxed text-white/60 italic">
              Unidad de telemetría profunda. Decodifica el funnel de KCE, identifica fugas de capital 
              y calibra el motor de crecimiento con precisión forense.
            </p>
          </header>

          {/* Acceso Rápido a Nodos de Acción */}
          <nav className="flex flex-wrap gap-4 pt-4">
            <Link href="/admin/sales" className="group/btn flex items-center gap-3 rounded-2xl bg-brand-blue px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-brand-blue/90 hover:scale-[1.02] shadow-xl">
              Sales Cockpit <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            {[
              { href: '/admin/deals', label: 'Deals', icon: TrendingUp },
              { href: '/admin/outbound', label: 'Outbound', icon: Zap },
              { href: '/admin/revenue', label: 'Revenue', icon: BarChart3 },
            ].map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-white/80 transition-all hover:bg-white hover:text-brand-dark"
              >
                <link.icon className="h-4 w-4 opacity-50" /> {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Elemento Decorativo de Fondo */}
        <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-110 transition-transform duration-1000">
           <BarChart3 className="h-96 w-96 text-white" />
        </div>
      </section>

      {/* 02. PROTOCOLO DE OPTIMIZACIÓN */}
      <section className="space-y-8">
        <header className="flex items-center gap-4 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-3xl text-brand-blue">Ciclo de Ejecución Táctica</h2>
        </header>
        
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { s: '01', t: 'Detectar', d: 'Identifica la señal de fuga: ¿Es en views, inicios de checkout o pagos finales?' },
            { s: '02', t: 'Hipótesis', d: 'Decide si el problema es el mensaje, el bot, la oferta o fricción técnica en la UI.' },
            { s: '03', t: 'Ejecutar', d: 'Abre el nodo correcto (Deals, Outbound, Templates) y ajusta una sola variable.' },
            { s: '04', t: 'Confirmar', d: 'Regresa en 48h para verificar si el ajuste movió la aguja en el revenue.' }
          ].map((step, i) => (
            <div key={i} className="group rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-blue/20">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/5 text-[10px] font-mono font-bold text-brand-blue border border-brand-blue/10">
                {step.s}
              </div>
              <h3 className="font-heading text-xl text-brand-dark mb-3 group-hover:text-brand-blue transition-colors">{step.t}</h3>
              <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/60 italic">
                {step.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 03. ALERTA DE RITMO OPERATIVO */}
      <div className="rounded-[2.5rem] border border-brand-yellow/20 bg-brand-yellow/5 p-8 flex items-start md:items-center gap-6 shadow-inner">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow text-brand-dark shadow-md">
           <Zap className="h-6 w-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-yellow/80">Ritmo Estratégico</p>
          <p className="text-base font-light text-brand-dark/80 italic">
            "Si el loop de optimización no cambia la señal después de dos iteraciones, el problema estructural 
            está en la cadencia comercial o el price-fit del producto."
          </p>
        </div>
      </div>

      <hr className="border-[var(--color-border)] opacity-50" />
      
      {/* 04. MOTOR DE TELEMETRÍA (CLIENT COMPONENT) */}
      <section className="relative">
         <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-yellow opacity-10" />
         <AdminMetricsClient />
      </section>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Data Sovereignty
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Analytics Engine v4.2
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Commercial Intelligence Node
        </div>
      </footer>
      
    </main>
  );
}