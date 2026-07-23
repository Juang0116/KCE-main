/* src/app/admin/launch-hq/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Rocket,
  Activity,
  Zap,
  ShieldCheck,
  Terminal,
  Sparkles,
  Target,
  Globe,
  ArrowUpRight,
  Cpu,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Launch HQ | KCE Ops',
  description: 'Centro de mando y despliegue estratégico para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default function LaunchHqPage() {
  const launchPads = [
    {
      title: 'Intelligence Lab',
      desc: 'Calibrar modelos de IA y flujos de RAG.',
      href: '/admin/ai/lab',
      icon: Cpu,
      color: 'text-brand-blue',
    },
    {
      title: 'Revenue Pipeline',
      desc: 'Supervisar cierres y acelerar checkouts.',
      href: '/admin/deals/board',
      icon: Zap,
      color: 'text-brand-yellow',
    },
    {
      title: 'System Forensics',
      desc: 'Auditoría de eventos y trazas del Kernel.',
      href: '/admin/events',
      icon: Activity,
      color: 'text-emerald-500',
    },
    {
      title: 'Experience Editor',
      desc: 'Configurar nuevos tours y expediciones.',
      href: '/admin/tours',
      icon: Globe,
      color: 'text-sky-500',
    },
  ];

  return (
    <main className="animate-in fade-in slide-in-from-bottom-6 mx-auto max-w-7xl space-y-12 p-4 pb-24 duration-1000 md:p-6">
      {/* 01. HEADER: MISSION CONTROL */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
            <Rocket className="h-4 w-4" /> Operational Command
          </div>
          <h1 className="font-heading text-5xl leading-none tracking-tighter text-main md:text-7xl">
            Launch <span className="font-light italic text-brand-yellow">HQ</span>
          </h1>
          <p className="max-w-2xl text-lg font-light leading-relaxed text-muted">
            Bienvenido al núcleo de operaciones de Knowing Cultures. Desde aquí coordinas el
            despliegue de experiencias y la inteligencia comercial del sistema.
          </p>
        </div>

        <div className="hidden items-center gap-6 rounded-[2rem] bg-brand-dark px-8 py-4 text-white shadow-pop lg:flex">
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">
              System Integrity
            </p>
            <p className="font-mono text-xs text-brand-yellow">Lvl 0 - Verified</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <ShieldCheck className="h-8 w-8 text-brand-blue" />
        </div>
      </header>

      {/* 02. SYSTEM STATUS BAR */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'IA Nodes', val: 'Active', icon: Cpu },
          { label: 'Market Signal', val: 'Nominal', icon: BarChart3 },
          { label: 'Security', val: 'E2EE', icon: ShieldCheck },
          { label: 'Latency', val: '14ms', icon: Zap },
        ].map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-brand-dark/5 bg-surface p-5 shadow-soft dark:border-white/5"
          >
            <s.icon className="h-5 w-5 text-brand-blue opacity-40" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                {s.label}
              </p>
              <p className="text-xs font-bold text-main">{s.val}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 03. LAUNCH PADS (GRID DE ACCIONES) */}
      <section className="grid gap-6 md:grid-cols-2">
        {launchPads.map((pad, i) => (
          <Link
            key={i}
            href={pad.href}
            className="group relative overflow-hidden rounded-[3rem] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop dark:border-white/5"
          >
            {/* Background Icon Decor */}
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] transition-transform duration-700 group-hover:scale-110">
              <pad.icon className={`h-48 w-48 ${pad.color}`} />
            </div>

            <div className="relative z-10 space-y-6">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface-2 shadow-inner transition-all duration-500 group-hover:bg-brand-dark group-hover:text-brand-yellow dark:border-white/5`}
              >
                <pad.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="flex items-center gap-3 font-heading text-3xl tracking-tight text-main">
                  {pad.title}{' '}
                  <ArrowUpRight className="h-5 w-5 translate-x-[-10px] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </h3>
                <p className="mt-2 font-light leading-relaxed text-muted">{pad.desc}</p>
              </div>
              <div className="flex items-center gap-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-brand-blue opacity-60">
                Ingresar al Módulo <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* 04. STRATEGIC INSIGHT PANEL */}
      <section className="relative overflow-hidden rounded-[3.5rem] border border-brand-blue/10 bg-brand-blue/5 p-10 md:p-16">
        <div className="absolute right-0 top-0 p-12 opacity-[0.05]">
          <Target className="h-64 w-64 text-brand-blue" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-12 md:flex-row">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-3 rounded-full bg-brand-blue/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
              <Sparkles className="h-4 w-4" /> Global Expansion Protocol
            </div>
            <h2 className="font-heading text-4xl tracking-tighter text-main md:text-5xl">
              Preparado para el próximo <span className="font-light italic">Despegue?</span>
            </h2>
            <p className="text-lg font-light leading-relaxed text-muted">
              &quot;El éxito de Knowing Cultures no reside en la automatización, sino en la
              personalización de cada rincón del mundo. Usa esta consola para mantener el estándar
              de guante blanco.&quot;
            </p>
          </div>
          <Button className="h-16 rounded-full bg-brand-dark px-12 text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95">
            Nueva Expedición
          </Button>
        </div>
      </section>

      {/* 05. FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-4 w-4" /> HQ Command Node v5.1
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Activity className="h-4 w-4" /> Real-time Operations Active
        </div>
      </footer>
    </main>
  );
}
