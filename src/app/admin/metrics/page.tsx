/* src/app/admin/metrics/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity,
  Target,
  Zap,
  ArrowRight,
  Terminal,
  ShieldCheck,
  Sparkles,
  Layers,
  BarChart3,
  TrendingUp,
  Cpu,
  Globe,
  Database,
} from 'lucide-react';

import { AdminMetricsClient } from './AdminMetricsClient';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Commercial Analytics | KCE Ops',
  description:
    'Telemetría comercial de alto mando y optimización de funnel para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminMetricsPage:
 * Shell de servidor para la inteligencia comercial.
 * Establece el marco estratégico antes de montar el motor de telemetría dinámico.
 */
export default async function AdminMetricsPage() {
  // 🔒 Verificación de seguridad de nivel operativo
  await requireAdmin();

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl space-y-12 p-4 pb-32 duration-1000 md:p-6">
      {/* 01. HEADER DE ALTO MANDO (MISSION CONTROL) */}
      <section className="group relative overflow-hidden rounded-[3.5rem] bg-brand-dark p-10 text-white shadow-pop md:p-20">
        {/* Capas de Textura y Profundidad */}
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-repeat opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark to-brand-blue/40"></div>

        <div className="relative z-10 space-y-10">
          <header className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-yellow shadow-inner backdrop-blur-xl">
              <Terminal className="h-4 w-4" /> Intelligence Lane: /commercial-vault-01
            </div>
            <h1 className="font-heading text-5xl leading-[0.9] tracking-tighter text-white md:text-8xl">
              Executive <span className="font-light italic text-brand-yellow">Analytics</span>
            </h1>
            <p className="max-w-2xl border-l-2 border-brand-yellow/20 pl-8 text-lg font-light italic leading-relaxed text-white/60 md:text-xl">
              Unidad de telemetría profunda. Decodifica el funnel de KCE, identifica fugas de
              capital y calibra el motor de crecimiento con precisión forense.
            </p>
          </header>

          {/* Navegación Táctica de Módulos Relacionados */}
          <nav className="flex flex-wrap gap-4 pt-6">
            <Link
              href="/admin/deals/board"
              className="group/btn flex items-center gap-4 rounded-[1.5rem] bg-brand-blue px-10 py-5 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:scale-[1.02] hover:bg-brand-blue/90"
            >
              Pipeline Control{' '}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1.5" />
            </Link>
            {[
              { href: '/admin/deals', label: 'Deals Master' },
              { href: '/admin/marketing', label: 'Marketing Intel' },
              { href: '/admin/revenue', label: 'Revenue Truth' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-white/80 shadow-sm transition-all hover:bg-white hover:text-brand-dark hover:shadow-pop"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Decoración Forense */}
        <div className="pointer-events-none absolute -bottom-20 -right-20 opacity-[0.03] transition-transform duration-1000 group-hover:scale-110">
          <BarChart3 className="h-[30rem] w-[30rem] text-white" />
        </div>
      </section>

      {/* 02. CICLO DE OPTIMIZACIÓN (RUNBOOK) */}
      <section className="space-y-10">
        <header className="flex items-center gap-5 px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-3xl tracking-tight text-main">
              Protocolo de Optimización Táctica
            </h2>
            <p className="mt-1 text-sm font-light text-muted">
              Sigue el loop analítico para escalar la rentabilidad del nodo.
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            {
              s: '01',
              t: 'Detección',
              d: 'Identifica la señal de fuga: ¿Es en visualizaciones, inicios de checkout o pagos finales?',
            },
            {
              s: '02',
              t: 'Hipótesis',
              d: 'Decide si el problema es el mensaje de la IA, el bot, la oferta o fricción técnica en la pasarela.',
            },
            {
              s: '03',
              t: 'Ejecución',
              d: 'Abre el nodo correcto (Deals, CRM, Editor) y ajusta una sola variable de impacto.',
            },
            {
              s: '04',
              t: 'Validación',
              d: 'Regresa en 48h para verificar si el ajuste movió la aguja del revenue en el tablero.',
            },
          ].map((step, i) => (
            <div
              key={i}
              className="group rounded-[2.5rem] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop dark:border-white/5"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 font-mono text-xs font-bold text-brand-blue shadow-inner">
                {step.s}
              </div>
              <h3 className="mb-4 font-heading text-2xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
                {step.t}
              </h3>
              <p className="text-sm font-light italic leading-relaxed text-muted opacity-80">
                {step.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 03. ALERTA ESTRATÉGICA */}
      <section className="relative flex flex-col items-center gap-10 overflow-hidden rounded-[3rem] border border-brand-yellow/30 bg-brand-yellow/5 p-10 shadow-inner md:flex-row">
        <div className="pointer-events-none absolute -right-6 top-0 opacity-[0.03]">
          <Zap className="h-40 w-40 text-brand-yellow" />
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.8rem] bg-brand-yellow text-brand-dark shadow-pop transition-transform active:scale-95">
          <Zap className="h-8 w-8 animate-pulse fill-current" />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand-dark/50">
            Pulse Signal: Operational Advice
          </p>
          <p className="text-xl font-light italic leading-relaxed text-main">
            &quot;Si el loop de optimización no cambia la señal después de dos iteraciones, el
            problema estructural no es técnico, sino de cadencia comercial o price-fit del producto
            en el mercado actual.&quot;
          </p>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-dark/10 to-transparent dark:via-white/10" />

      {/* 04. MOTOR DE TELEMETRÍA DINÁMICO */}
      <section className="relative px-2">
        {/* Acento de integridad visual lateral */}
        <div className="absolute -left-6 top-0 h-full w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />

        {/* El cliente maneja toda la lógica de filtrado y visualización de datos */}
        <AdminMetricsClient />
      </section>

      {/* 05. FOOTER DE SOBERANÍA DE DATOS */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Data Sovereignty Verified
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Layers className="h-4 w-4 text-brand-yellow" /> Analytics Node v4.2
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-blue">
          <Sparkles className="h-4 w-4" /> Commercial Intelligence Core
        </div>
      </footer>
    </main>
  );
}
