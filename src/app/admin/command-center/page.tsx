import 'server-only';
import * as React from 'react';
import { 
  Bot, CheckCircle2, TrendingUp, Users, 
  AlertCircle, Sparkles, ArrowUpRight, 
  Layers, Zap, Terminal, Mail, Kanban, 
  LayoutDashboard, FileText, ChevronRight,
  Activity, ShieldCheck, Cpu, Target,
  type LucideIcon 
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
  openTasks: number; activeLeads: number; staleDeals: number; potentialRevenue: number;
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
    adminAny.from('deals').select('stage, updated_at, amount_minor').not('stage', 'in', '(won,lost)'),
  ]);

  type DealRow = { stage: string; updated_at: string; amount_minor: number | null };

  const staleThreshold = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const staleDeals = (deals as DealRow[] || []).filter(
    (d) => new Date(d.updated_at).getTime() < staleThreshold
  ).length;

  const potentialRevenue = (deals as DealRow[] || [])
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
      <div className="mx-auto max-w-7xl space-y-12 p-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* 01. CABECERA INSTITUCIONAL */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
               <Terminal className="h-3.5 w-3.5" /> Core Node: /command-center
            </div>
            <h1 className="font-heading text-5xl md:text-7xl text-main tracking-tighter">
               Command <span className="text-brand-blue italic font-light">Center</span>
            </h1>
            <p className="mt-4 text-base text-muted font-light italic flex items-center gap-2">
               <ShieldCheck className="h-4 w-4 text-green-500" /> Operatividad del Sistema: Nominal (100%) · Bienvenido, Juancho.
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="rounded-full shadow-sm px-8 h-12 text-[10px] font-bold uppercase tracking-widest border-brand-dark/10">
               Configuración de Nodo
             </Button>
          </div>
        </header>

        {/* 02. 🤖 THE CEO INTELLIGENCE LAYER */}
        <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-blue/20 bg-brand-dark p-1 shadow-pop transition-all hover:shadow-brand-blue/10">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] transition-transform hover:scale-110 duration-1000 pointer-events-none">
             <Bot className="h-80 w-80 text-brand-blue" />
          </div>
          
          <div className="relative z-10 bg-brand-dark px-8 py-12 md:px-16 md:py-20 rounded-[3.2rem]">
            <div className="mb-10 flex items-center gap-5">
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow text-brand-dark shadow-xl shadow-brand-yellow/20">
                  <Sparkles className="h-8 w-8" />
               </div>
               <div>
                  <h2 className="font-heading text-3xl text-white tracking-tight">Agente CEO</h2>
                  <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand-blue/60 mt-1">Briefing Matutino Estratégico</p>
               </div>
            </div>
            
            <div className="max-w-4xl">
              <div className="whitespace-pre-wrap text-xl md:text-2xl font-light leading-relaxed text-white/90 italic border-l-2 border-brand-yellow/30 pl-8">
                {aiBriefing}
              </div>
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-8 border-t border-white/5 pt-10">
               <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                  <Cpu className="h-4 w-4 text-brand-blue opacity-50" /> Inferencia Neural Activa
               </div>
               <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                  <Target className="h-4 w-4 text-brand-yellow opacity-50" /> Focus Mode: Revenue Recovery
               </div>
            </div>
          </div>
        </section>

        {/* 03. 📊 KPI DASHBOARD (LOS SENSORES) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tareas Abiertas" value={stats.openTasks} icon={CheckCircle2} colorClass="text-brand-blue" />
          <StatCard title="Leads Activos" value={stats.activeLeads} icon={Users} colorClass="text-green-600 dark:text-green-400" />
          <StatCard title="Pipeline Est." value={`€${Math.round(stats.potentialRevenue).toLocaleString()}`} icon={TrendingUp} colorClass="text-brand-blue" />
          <StatCard 
            title="Deals en Riesgo" 
            value={stats.staleDeals} 
            icon={AlertCircle} 
            colorClass={stats.staleDeals > 0 ? 'text-red-600' : 'text-green-600'} 
            alert={stats.staleDeals > 0}
          />
        </div>

        {/* 04. 🚦 CONSOLA DE OPERACIONES (EL ESCRITORIO) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-16 shadow-soft relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 opacity-[0.01] pointer-events-none">
             <LayoutDashboard className="h-96 w-96 text-brand-blue" />
          </div>
          
          <div className="relative z-10">
            <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-8">
               <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                     <Layers className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-3xl text-main tracking-tight">Consola Táctica</h3>
               </div>
               <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">Acceso Nivel 0 · Root</span>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ActionLink href="/admin/tasks" icon={CheckCircle2} title="Mis Tareas" desc="Gestión de urgencias y compromisos del día." />
              <ActionLink href="/admin/agents" icon={Bot} title="Agentes IA" desc="Supervisión de la fuerza laboral sintética." />
              <ActionLink href="/admin/conversations" icon={Mail} title="CRM Mensajería" desc="Control de hilos y respuestas de alta fidelidad." />
              <ActionLink href="/admin/deals" icon={Kanban} title="Sales Pipeline" desc="Conversión hacia el cierre de expediciones." />
              <ActionLink href="/admin/marketing" icon={Zap} title="Growth Hub" desc="Automatización y seguimiento de campañas." />
              <ActionLink href="/admin/content" icon={FileText} title="Authority Engine" desc="Gestión de blog y SEO semántico." />
            </div>
          </div>
        </section>

        {/* 05. 🛰️ TELEMETRÍA EN VIVO (EL LATIDO) */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-6">
             <Activity className="h-5 w-5 text-brand-blue animate-pulse" />
             <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-muted opacity-60">Live System Heartbeat & Logistics</div>
          </div>
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface/50 p-2 shadow-sm backdrop-blur-md">
             <CommandCenterLivePanel />
          </div>
        </section>

        {/* 06. FOOTER DE MARCA INSTITUCIONAL */}
        <footer className="pt-20 text-center opacity-40 transition-opacity hover:opacity-100 duration-500">
           <div className="mb-6 flex justify-center gap-10">
              <ShieldCheck className="h-5 w-5 text-muted" />
              <Activity className="h-5 w-5 text-brand-blue" />
              <Cpu className="h-5 w-5 text-muted" />
           </div>
           <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-main italic">
              Knowing Cultures S.A.S. · Intelligence Unit · MMXXVI
           </p>
           <p className="text-[9px] font-mono text-muted mt-4 uppercase tracking-widest">
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
    <div className={`group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-soft transition-all hover:shadow-pop hover:-translate-y-1 duration-300 ${alert ? 'border-red-500/20 bg-red-50/30 dark:bg-red-950/10' : ''}`}>
      <div className="flex items-center justify-between mb-10">
        <div className={`rounded-2xl p-4 bg-surface-2 ${colorClass} transition-all group-hover:scale-110 shadow-inner border border-brand-dark/5 dark:border-white/5`}>
          {Icon && <Icon className="h-7 w-7" />}
        </div>
        {alert && (
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2 opacity-60">{title}</p>
        <p className={`text-5xl font-heading tracking-tight ${alert ? 'text-red-600' : 'text-main'}`}>{value}</p>
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
    <a href={href} className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-sm transition-all hover:shadow-pop hover:-translate-y-2 duration-500">
      <div className="flex items-start justify-between mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all shadow-inner border border-brand-dark/5 dark:border-white/5">
          {Icon && <Icon className="h-7 w-7" />}
        </div>
        <ArrowUpRight className="h-6 w-6 text-muted opacity-30 group-hover:opacity-100 group-hover:text-brand-blue transition-all" />
      </div>
      <div>
        <h4 className="font-heading text-2xl text-main group-hover:text-brand-blue transition-colors tracking-tight">{title}</h4>
        <p className="mt-3 text-sm font-light text-muted leading-relaxed group-hover:text-main transition-colors">{desc}</p>
      </div>
      <div className="mt-8 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] text-brand-blue opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
          Acceder al Módulo <ChevronRight className="h-3 w-3" />
      </div>
    </a>
  );
}