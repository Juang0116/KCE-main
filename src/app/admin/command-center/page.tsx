import 'server-only';
import * as React from 'react';
import {
  Bot,
  CheckCircle2,
  TrendingUp,
  Users,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Layers,
  Zap,
  Terminal,
  Mail,
  Kanban,
  LayoutDashboard,
  FileText,
  ChevronRight,
  Activity,
  ShieldCheck,
  Cpu,
  Target,
  type LucideIcon,
} from 'lucide-react';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { PageShell } from '@/components/layout/PageShell';
import CommandCenterLivePanel from './CommandCenterLivePanel';
import { agentGenerate } from '@/lib/agentAI.server';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 🤖 AGENTE CEO: La voz de mando de KCE.
 */
async function generateExecutiveBrief(stats: {
  openTasks: number;
  activeLeads: number;
  staleDeals: number;
  potentialRevenue: number;
}): Promise<string> {
  return agentGenerate({
    systemPrompt: `Eres el "Agente CEO" de KCE (Knowing Cultures S.A.S.), el copiloto estratégico de Juancho.
Escribe un briefing matutino de alta energía, directo y sofisticado.
1. Saludo breve con autoridad.
2. Análisis de los datos: tareas, leads y revenue (€${stats.potentialRevenue.toLocaleString()}).
3. El "Focus del Día": Prioriza la recuperación de deals estancados (${stats.staleDeals}).
4. Cierre inspirador de "guante blanco".
Tono: Premium, vibrante, enfocado en ejecución de élite.`,
    userMessage: JSON.stringify(stats),
    temperature: 0.8,
    maxTokens: 500,
    fallback: `¡Día de ejecución, Juancho! Tienes ${stats.openTasks} tareas en el radar y €${Math.round(stats.potentialRevenue)} en pipeline. Hay ${stats.staleDeals} negocios en zona fría — dales calor hoy. Vamos por el cierre.`,
  });
}

export default async function CommandCenterPage() {
  const sb = getSupabaseAdmin();
  const adminAny = sb as any;

  // Telemetría en Tiempo Real
  const [{ count: openTasks }, { count: activeLeads }, { data: deals }] = await Promise.all([
    adminAny.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    adminAny.from('leads').select('*', { count: 'exact', head: true }),
    adminAny
      .from('deals')
      .select('stage, updated_at, amount_minor')
      .not('stage', 'in', '(won,lost)'),
  ]);

  type DealRow = { stage: string; updated_at: string; amount_minor: number | null };

  const staleThreshold = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const staleDeals = ((deals as DealRow[]) || []).filter(
    (d) => new Date(d.updated_at).getTime() < staleThreshold,
  ).length;

  const potentialRevenue = ((deals as DealRow[]) || [])
    .filter((d) => d.stage === 'qualified' || d.stage === 'proposal')
    .reduce((acc, d) => acc + (d.amount_minor || 50000) / 100, 0);

  const stats = {
    openTasks: openTasks || 0,
    activeLeads: activeLeads || 0,
    staleDeals,
    potentialRevenue,
  };

  const aiBriefing = await generateExecutiveBrief(stats);

  return (
    <PageShell>
      <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl space-y-12 p-6 pb-32 duration-1000">
        {/* 01. CABECERA INSTITUCIONAL */}
        <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
              <Terminal className="h-3.5 w-3.5" /> Core Node: /command-center
            </div>
            <h1 className="font-heading text-5xl tracking-tighter text-main md:text-7xl">
              Command <span className="font-light italic text-brand-blue">Center</span>
            </h1>
            <p className="mt-4 flex items-center gap-2 text-base font-light italic text-muted">
              <ShieldCheck className="h-4 w-4 text-green-500" /> Operatividad del Sistema: Nominal
              (100%) · Bienvenido, Juancho.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm"
            >
              Configuración de Nodo
            </Button>
          </div>
        </header>

        {/* 02. 🤖 THE CEO INTELLIGENCE LAYER */}
        <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-blue/20 bg-brand-dark p-1 shadow-pop transition-all hover:shadow-brand-blue/10">
          {/* Decoración de fondo */}
          <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-[0.05] transition-transform duration-1000 hover:scale-110">
            <Bot className="h-80 w-80 text-brand-blue" />
          </div>

          <div className="relative z-10 rounded-[3.2rem] bg-brand-dark px-8 py-12 md:px-16 md:py-20">
            <div className="mb-10 flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow text-brand-dark shadow-xl shadow-brand-yellow/20">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-heading text-3xl tracking-tight text-white">Agente CEO</h2>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.4em] text-brand-blue/60">
                  Briefing Matutino Estratégico
                </p>
              </div>
            </div>

            <div className="max-w-4xl">
              <div className="whitespace-pre-wrap border-l-2 border-brand-yellow/30 pl-8 text-xl font-light italic leading-relaxed text-white/90 md:text-2xl">
                {aiBriefing}
              </div>
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-8 border-t border-white/5 pt-10">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                <Cpu className="h-4 w-4 text-brand-blue opacity-50" /> Inferencia Neural Activa
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                <Target className="h-4 w-4 text-brand-yellow opacity-50" /> Focus Mode: Revenue
                Recovery
              </div>
            </div>
          </div>
        </section>

        {/* 03. 📊 KPI DASHBOARD (LOS SENSORES) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tareas Abiertas"
            value={stats.openTasks}
            icon={CheckCircle2}
            colorClass="text-brand-blue"
          />
          <StatCard
            title="Leads Activos"
            value={stats.activeLeads}
            icon={Users}
            colorClass="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Pipeline Est."
            value={`€${Math.round(stats.potentialRevenue).toLocaleString()}`}
            icon={TrendingUp}
            colorClass="text-brand-blue"
          />
          <StatCard
            title="Deals en Riesgo"
            value={stats.staleDeals}
            icon={AlertCircle}
            colorClass={stats.staleDeals > 0 ? 'text-red-600' : 'text-green-600'}
            alert={stats.staleDeals > 0}
          />
        </div>

        {/* 04. 🚦 CONSOLA DE OPERACIONES (EL ESCRITORIO) */}
        <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft dark:border-white/5 md:p-16">
          <div className="pointer-events-none absolute -bottom-20 -right-20 opacity-[0.01]">
            <LayoutDashboard className="h-96 w-96 text-brand-blue" />
          </div>

          <div className="relative z-10">
            <div className="mb-12 flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-8 dark:border-white/5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-3xl tracking-tight text-main">Consola Táctica</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                Acceso Nivel 0 · Root
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ActionLink
                href="/admin/tasks"
                icon={CheckCircle2}
                title="Mis Tareas"
                desc="Gestión de urgencias y compromisos del día."
              />
              <ActionLink
                href="/admin/agents"
                icon={Bot}
                title="Agentes IA"
                desc="Supervisión de la fuerza laboral sintética."
              />
              <ActionLink
                href="/admin/conversations"
                icon={Mail}
                title="CRM Mensajería"
                desc="Control de hilos y respuestas de alta fidelidad."
              />
              <ActionLink
                href="/admin/deals"
                icon={Kanban}
                title="Sales Pipeline"
                desc="Conversión hacia el cierre de expediciones."
              />
              <ActionLink
                href="/admin/marketing"
                icon={Zap}
                title="Growth Hub"
                desc="Automatización y seguimiento de campañas."
              />
              <ActionLink
                href="/admin/content"
                icon={FileText}
                title="Authority Engine"
                desc="Gestión de blog y SEO semántico."
              />
            </div>
          </div>
        </section>

        {/* 05. 🛰️ TELEMETRÍA EN VIVO (EL LATIDO) */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-6">
            <Activity className="h-5 w-5 animate-pulse text-brand-blue" />
            <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-muted opacity-60">
              Live System Heartbeat & Logistics
            </div>
          </div>
          <div className="bg-surface/50 rounded-[var(--radius-3xl)] border border-brand-dark/5 p-2 shadow-sm backdrop-blur-md dark:border-white/5">
            <CommandCenterLivePanel />
          </div>
        </section>

        {/* 06. FOOTER DE MARCA INSTITUCIONAL */}
        <footer className="pt-20 text-center opacity-40 transition-opacity duration-500 hover:opacity-100">
          <div className="mb-6 flex justify-center gap-10">
            <ShieldCheck className="h-5 w-5 text-muted" />
            <Activity className="h-5 w-5 text-brand-blue" />
            <Cpu className="h-5 w-5 text-muted" />
          </div>
          <p className="text-[10px] font-bold uppercase italic tracking-[0.6em] text-main">
            Knowing Cultures S.A.S. · Intelligence Unit · MMXXVI
          </p>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-widest text-muted">
            Ref: GLOBAL_COMMAND_NODE_BOG
          </p>
        </footer>
      </div>
    </PageShell>
  );
}

/* --- SUB-COMPONENTES UI REFINADOS --- */

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  alert?: boolean;
};

function StatCard({ title, value, icon: Icon, colorClass, alert }: StatCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-pop dark:border-white/5 ${alert ? 'border-red-500/20 bg-red-50/30 dark:bg-red-950/10' : ''}`}
    >
      <div className="mb-10 flex items-center justify-between">
        <div
          className={`rounded-2xl bg-surface-2 p-4 ${colorClass} border border-brand-dark/5 shadow-inner transition-all group-hover:scale-110 dark:border-white/5`}
        >
          {Icon && <Icon className="h-7 w-7" />}
        </div>
        {alert && (
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
          </div>
        )}
      </div>
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
          {title}
        </p>
        <p
          className={`font-heading text-5xl tracking-tight ${alert ? 'text-red-600' : 'text-main'}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

type ActionLinkProps = {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
};

function ActionLink({ href, title, desc, icon: Icon }: ActionLinkProps) {
  return (
    <a
      href={href}
      className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-pop dark:border-white/5"
    >
      <div className="mb-8 flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface-2 text-brand-blue shadow-inner transition-all group-hover:bg-brand-blue group-hover:text-white dark:border-white/5">
          {Icon && <Icon className="h-7 w-7" />}
        </div>
        <ArrowUpRight className="h-6 w-6 text-muted opacity-30 transition-all group-hover:text-brand-blue group-hover:opacity-100" />
      </div>
      <div>
        <h4 className="font-heading text-2xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
          {title}
        </h4>
        <p className="mt-3 text-sm font-light leading-relaxed text-muted transition-colors group-hover:text-main">
          {desc}
        </p>
      </div>
      <div className="mt-8 flex translate-x-[-10px] items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] text-brand-blue opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
        Acceder al Módulo <ChevronRight className="h-3 w-3" />
      </div>
    </a>
  );
}
