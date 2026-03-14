import 'server-only';
import * as React from 'react';
import { Bot, CheckCircle2, TrendingUp, Users, AlertCircle } from 'lucide-react';

// ✅ Corrección 1: Importamos supabaseServer correctamente
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { PageShell } from '@/components/layout/PageShell';
import { agentGenerate } from '@/lib/agentAI.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 🤖 Función que usa IA para darle un resumen ejecutivo al Founder (Tú)
async function generateExecutiveBrief(stats: {
  openTasks: number; activeLeads: number; staleDeals: number; potentialRevenue: number;
}): Promise<string> {
  return agentGenerate({
    systemPrompt: `Eres el "Agente CEO" de KCE (Knowing Cultures Enterprise), asistente personal del fundador Juancho.
Escribe un resumen ejecutivo matutino de 3-4 párrafos: motivador, directo y accionable.
1. Saluda a Juancho de forma energética.
2. Resume el estado de la agencia con los datos recibidos.
3. Di exactamente en qué debe enfocarse hoy.
4. Tono: "vamos a comernos el mundo hoy".`,
    userMessage: JSON.stringify(stats),
    temperature: 0.7,
    maxTokens: 500,
    fallback: `¡Buenos días Juancho! Tienes ${stats.openTasks} tareas abiertas, ${stats.activeLeads} leads activos y €${Math.round(stats.potentialRevenue)} en juego. ${stats.staleDeals} negocios llevan más de 3 días sin tocar — ahí está la oportunidad. ¡A por ello!`,
  });
}

export default async function CommandCenterPage() {
  // ✅ Corrección 1: Usamos la función correcta
  const supabase = getSupabaseAdmin() as any;

  // Recopilar datos reales de la base de datos para el Agente CEO
  const [{ count: openTasks }, { count: activeLeads }, { data: deals }] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('stage, updated_at, amount_minor').not('stage', 'in', '(won,lost)'),
  ]);

  type DealRow = { stage: string; updated_at: string; amount_minor: number | null };

  const staleDeals = (deals as DealRow[] || []).filter(
    (d) => Date.now() - new Date(d.updated_at).getTime() > 3 * 24 * 60 * 60 * 1000
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

  // 🤖 Llamamos al Agente CEO
  const aiBriefing = await generateExecutiveBrief(stats);

  return (
    // ✅ Corrección 2: Eliminamos title y description de PageShell, y los ponemos como HTML nativo
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-8 p-4 pb-20 sm:p-6">
        
        <div>
          <h1 className="font-heading text-3xl text-brand-blue">Command Center KCE</h1>
          <p className="mt-2 text-[color:var(--color-text)]/70">Tu base de operaciones impulsada por IA.</p>
        </div>

        {/* 🤖 Tarjeta del Agente CEO */}
        <div className="overflow-hidden rounded-3xl border border-brand-blue/20 bg-gradient-to-br from-[var(--color-surface)] to-brand-blue/5 shadow-pop">
          <div className="border-b border-brand-blue/10 bg-brand-blue px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-brand-yellow" />
              <h2 className="font-heading text-xl">Agente CEO - Reporte Matutino</h2>
            </div>
          </div>
          <div className="p-6 md:p-8 text-[color:var(--color-text)]">
            <div className="whitespace-pre-wrap text-sm leading-relaxed md:text-base">
              {aiBriefing}
            </div>
          </div>
        </div>

        {/* 📊 Métricas Rápidas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tareas Abiertas" value={stats.openTasks} icon={CheckCircle2} color="text-brand-blue" />
          <StatCard title="Leads Activos" value={stats.activeLeads} icon={Users} color="text-emerald-500" />
          <StatCard title="Pipeline Potencial" value={`€${stats.potentialRevenue.toLocaleString()}`} icon={TrendingUp} color="text-brand-yellow" />
          <StatCard title="Negocios en Riesgo" value={stats.staleDeals} icon={AlertCircle} color={stats.staleDeals > 0 ? 'text-red-500' : 'text-emerald-500'} />
        </div>

        {/* 🚦 Botones de Acción Rápida para Juancho */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
          <h3 className="font-heading text-lg text-brand-blue mb-4">Accesos de Operación</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <ActionLink href="/admin/tasks" title="Mis Tareas" desc="Revisa lo que tienes pendiente hoy." />
            <ActionLink href="/admin/outbound" title="Bandeja de Salida" desc="Revisa correos redactados por la IA." />
            <ActionLink href="/admin/deals/board" title="Pipeline de Ventas" desc="Mueve tus prospectos al cierre." />
          </div>
        </div>

      </div>
    </PageShell>
  );
}

// Subcomponentes UI
function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-soft flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{title}</p>
        <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{value}</p>
      </div>
      <div className={`rounded-full bg-[var(--color-surface-2)] p-3 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

function ActionLink({ href, title, desc }: any) {
  return (
    <a href={href} className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:-translate-y-1 hover:shadow-pop block">
      <h4 className="font-semibold text-[var(--color-text)] group-hover:text-brand-blue">{title}</h4>
      <p className="mt-1 text-xs text-[var(--color-text)]/70">{desc}</p>
    </a>
  );
}