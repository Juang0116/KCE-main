import 'server-only';
import * as React from 'react';
import { 
  Bot, CheckCircle2, TrendingUp, Users, 
  AlertCircle, Sparkles, ArrowUpRight, 
  Layers, Zap, Terminal, Mail, Kanban, 
  LayoutDashboard, FileText, ChevronRight,
  Activity, ShieldCheck, Cpu, Target,
  type LucideIcon // Tipado estricto para iconos
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
 * Calibrado para dar un briefing de alta fidelidad.
 */
async function generateExecutiveBrief(stats: {
  openTasks: number; activeLeads: number; staleDeals: number; potentialRevenue: number;
}): Promise<string> {
  return agentGenerate({
    systemPrompt: `Eres el "Agente CEO" de KCE (Knowing Cultures Enterprise), el copiloto estratégico de Juancho.
Escribe un briefing matutino de alta energía, directo y sofisticado.
1. Saludo breve con autoridad.
2. Análisis de los datos: tareas, leads y revenue.
3. El "Focus del Día": Prioriza la recuperación de deals estancados.
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
  const adminAny = sb as any; // Bypass controlado para queries complejas de agregación

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
      <div className="mx-auto max-w-7xl space-y-12 p-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
        
        {/* CABECERA DE LA CENTRAL (ESTILO AEROPUERTO INTERNACIONAL) */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
               <Terminal className="h-3.5 w-3.5" /> Core Node: /command-center
            </div>
            <h1 className="font-heading text-4xl md:text-6xl text-brand-blue">
               Command <span className="text-brand-yellow italic font-light text-5xl md:text-7xl">Center</span>
            </h1>
            <p className="mt-4 text-base text-[var(--color-text)]/50 font-light italic flex items-center gap-2">
               <ShieldCheck className="h-4 w-4 text-emerald-500" /> Operatividad del Sistema: 100% · Bienvenido, Juancho.
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="rounded-full shadow-sm px-8">
               Configuración
             </Button>
          </div>
        </header>

        {/* 🤖 THE CEO INTELLIGENCE LAYER */}
        <section className="relative overflow-hidden rounded-[3.5rem] border border-brand-blue/20 bg-brand-dark p-1 shadow-2xl transition-all hover:shadow-brand-blue/10">
          <div className="absolute top-0 right-0 p-12 opacity-[0.08] transition-transform hover:scale-110 duration-1000">
             <Bot className="h-72 w-72 text-brand-yellow" />
          </div>
          <div className="relative z-10 bg-brand-dark px-10 py-12 md:px-16 md:py-20">
            <div className="mb-10 flex items-center gap-5">
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow text-brand-dark shadow-xl shadow-brand-yellow/20">
                  <Sparkles className="h-8 w-8" />
               </div>
               <div>
                  <h2 className="font-heading text-3xl text-white">Agente CEO</h2>
                  <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand-yellow/60">Briefing Matutino Estratégico</p>
               </div>
            </div>
            
            <div className="max-w-4xl">
              <div className="whitespace-pre-wrap text-xl md:text-2xl font-light leading-relaxed text-white/90 italic border-l-2 border-brand-yellow/20 pl-8">
                {aiBriefing}
              </div>
            </div>

            <div className="mt-16 flex items-center gap-6 border-t border-white/5 pt-10">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                  <Cpu className="h-3.5 w-3.5 text-brand-yellow" /> Inferencia Neural Activa
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                  <Target className="h-3.5 w-3.5 text-brand-yellow" /> Focus Mode: Revenue Recovery
               </div>
            </div>
          </div>
        </section>

        {/* 📊 KPI DASHBOARD (LOS SENSORES) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tareas Pendientes" value={stats.openTasks} icon={CheckCircle2} colorClass="text-brand-blue" />
          <StatCard title="Leads Activos" value={stats.activeLeads} icon={Users} colorClass="text-emerald-500" />
          <StatCard title="Pipeline (EUR)" value={`€${stats.potentialRevenue.toLocaleString()}`} icon={TrendingUp} colorClass="text-brand-yellow" />
          <StatCard 
            title="Deals en Riesgo" 
            value={stats.staleDeals} 
            icon={AlertCircle} 
            colorClass={stats.staleDeals > 0 ? 'text-rose-500' : 'text-emerald-500'} 
            alert={stats.staleDeals > 0}
          />
        </div>

        {/* 🚦 CONSOLA DE OPERACIONES (EL ESCRITORIO) */}
        <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-16 shadow-inner relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 opacity-[0.02]">
             <LayoutDashboard className="h-96 w-96 text-brand-blue" />
          </div>
          
          <div className="relative z-10">
            <div className="mb-12 flex items-center justify-between border-b border-[var(--color-border)] pb-8">
               <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue shadow-inner">
                     <Layers className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-3xl text-brand-blue">Consola Táctica</h3>
               </div>
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text)]/30">Acceso Nivel 0</span>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ActionLink href="/admin/tasks" icon={CheckCircle2} title="Mis Tareas" desc="Gestión de urgencias y compromisos." />
              <ActionLink href="/admin/agents" icon={Bot} title="Agentes IA" desc="Monitor de fuerza laboral sintética." />
              <ActionLink href="/admin/outbound" icon={Mail} title="Outbound" desc="Emails de alta fidelidad redactados." />
              <ActionLink href="/admin/deals/board" icon={Kanban} title="Sales Pipeline" desc="Conversión hacia el cierre de deals." />
              <ActionLink href="/admin/sequences" icon={Zap} title="Secuencias Drip" desc="Automatización de seguimiento." />
              <ActionLink href="/admin/content/posts" icon={FileText} title="Blog & Authority" desc="Creación de valor y SEO orgánico." />
            </div>
          </div>
        </section>

        {/* 🛰️ TELEMETRÍA EN VIVO (EL LATIDO) */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-6">
             <Activity className="h-5 w-5 text-brand-blue animate-pulse" />
             <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-[var(--color-text)]/30">Live System Heartbeat & Logistics</div>
          </div>
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-white/50 p-2 shadow-sm backdrop-blur-sm">
             <CommandCenterLivePanel />
          </div>
        </section>

        {/* FOOTER DE MARCA INSTITUCIONAL */}
        <footer className="pt-20 text-center opacity-30 transition-opacity hover:opacity-60 duration-500">
           <div className="mb-4 flex justify-center gap-8">
              <ShieldCheck className="h-4 w-4" />
              <Activity className="h-4 w-4" />
              <Cpu className="h-4 w-4" />
           </div>
           <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--color-text)] italic">
              Knowing Cultures Enterprise · Intelligence Unit · MMXXVI
           </p>
        </footer>
      </div>
    </PageShell>
  );
}

/* --- SUB-COMPONENTES UI REFINADOS CON TIPADO ESTRICTO --- */

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  alert?: boolean;
};

function StatCard({ title, value, icon: Icon, colorClass, alert }: StatCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-white p-10 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-1 ${alert ? 'border-rose-100 bg-rose-50/[0.05]' : ''}`}>
      <div className="flex items-center justify-between mb-8">
        <div className={`rounded-2xl p-4 bg-[var(--color-surface-2)] ${colorClass} transition-all group-hover:scale-110 shadow-inner`}>
          <Icon className="h-7 w-7" />
        </div>
        {alert && (
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/30 mb-2">{title}</p>
        <p className={`text-4xl font-heading tracking-tight ${alert ? 'text-rose-600' : 'text-brand-dark'}`}>{value}</p>
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
    <a href={href} className="group rounded-[2.5rem] border border-[var(--color-border)] bg-white p-8 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2">
      <div className="flex items-start justify-between mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        <ArrowUpRight className="h-5 w-5 text-[var(--color-text)]/10 group-hover:text-brand-blue transition-colors" />
      </div>
      <div>
        <h4 className="font-heading text-xl text-brand-blue group-hover:text-brand-yellow transition-colors">{title}</h4>
        <p className="mt-3 text-xs font-light text-[var(--color-text)]/50 leading-relaxed group-hover:text-[var(--color-text)]/80 transition-colors">{desc}</p>
      </div>
      <div className="mt-6 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-blue opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
         Abrir Módulo <ChevronRight className="h-3 w-3" />
      </div>
    </a>
  );
}