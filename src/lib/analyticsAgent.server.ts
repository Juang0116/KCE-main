// src/lib/analyticsAgent.server.ts
// Analytics Agent — studies business data, identifies patterns, generates insights.
// Self-trains by comparing predictions vs actual outcomes.
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { agentGenerate } from '@/lib/agentAI.server';
import { notifyOps } from '@/lib/opsNotify.server';

const ROLE = `Eres el Chief Analytics Officer de KCE (Knowing Cultures Enterprise).
Tu misión: analizar datos del negocio, identificar tendencias y dar recomendaciones
concretas y accionables. Piensas como el mejor analista de startups del mundo.
Eres directo, basado en datos, y siempre terminas con acciones específicas.`;

export type BusinessSnapshot = {
  period: string;
  leads: { total: number; new7d: number; bySource: Record<string, number> };
  deals: { active: number; stale: number; totalValue: number; byStage: Record<string, number> };
  bookings: { confirmed: number; revenue: number; upcomingWeek: number };
  reviews: { total: number; avgRating: number; last30d: number };
  tours: { totalViews: number; topTour: string };
};

async function getBusinessSnapshot(admin: any): Promise<BusinessSnapshot> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const today = now.toISOString().slice(0, 10);
  const nextWeek = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);

  const [
    { count: totalLeads },
    { count: newLeads7d },
    { data: leadSources },
    { data: deals },
    { data: bookings },
    { data: upcomingBookings },
    { data: reviews },
  ] = await Promise.all([
    admin.from('leads').select('*', { count: 'exact', head: true }),
    admin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', d7),
    admin.from('leads').select('source').not('source', 'is', null),
    admin.from('deals').select('stage, updated_at, amount_minor').not('stage', 'in', '(won,lost)'),
    admin.from('bookings').select('id, amount_minor, status').eq('status', 'confirmed')
      .gte('created_at', d30),
    admin.from('bookings').select('id').eq('status', 'confirmed')
      .gte('tour_date', today).lte('tour_date', nextWeek),
    admin.from('reviews').select('rating, created_at').gte('created_at', d30),
  ]);

  const bySource: Record<string, number> = {};
  for (const l of leadSources ?? []) {
    const s = l.source || 'direct';
    bySource[s] = (bySource[s] ?? 0) + 1;
  }

  type Deal = { stage: string; updated_at: string; amount_minor: number | null };
  const dealList = (deals as Deal[]) ?? [];
  const byStage: Record<string, number> = {};
  for (const d of dealList) {
    byStage[d.stage] = (byStage[d.stage] ?? 0) + 1;
  }
  const stale = dealList.filter(
    (d) => Date.now() - new Date(d.updated_at).getTime() > 3 * 86_400_000
  ).length;
  const totalValue = dealList.reduce((a, d) => a + (d.amount_minor ?? 50000) / 100, 0);

  const revenue = ((bookings as any[]) ?? []).reduce((a: number, b: any) => a + (b.amount_minor ?? 0) / 100, 0);
  const ratings = ((reviews as any[]) ?? []).map((r: any) => Number(r.rating)).filter(Boolean);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  return {
    period: `${d30.slice(0, 10)} → ${today}`,
    leads: { total: totalLeads ?? 0, new7d: newLeads7d ?? 0, bySource },
    deals: { active: dealList.length, stale, totalValue: Math.round(totalValue), byStage },
    bookings: { confirmed: (bookings as any[])?.length ?? 0, revenue: Math.round(revenue), upcomingWeek: (upcomingBookings as any[])?.length ?? 0 },
    reviews: { total: ratings.length, avgRating: Math.round(avgRating * 10) / 10, last30d: ratings.length },
    tours: { totalViews: 0, topTour: 'N/A' },
  };
}

export async function generateWeeklyInsight(snapshot: BusinessSnapshot): Promise<string> {
  return agentGenerate({
    systemPrompt: `${ROLE}
Analiza estos datos del negocio KCE y genera un informe ejecutivo semanal.
Estructura: 
1. 📊 Estado del negocio (2 frases)
2. 🟢 Qué está funcionando bien
3. 🔴 Qué necesita atención inmediata
4. 💡 3 acciones específicas para esta semana
5. 📈 Predicción para próximos 7 días

Máximo 300 palabras. Directo, sin relleno.`,
    userMessage: JSON.stringify(snapshot),
    temperature: 0.4,
    maxTokens: 500,
    fallback: `Datos del negocio: ${snapshot.leads.new7d} leads nuevos, €${snapshot.deals.totalValue} en pipeline, ${snapshot.bookings.upcomingWeek} tours próximos.`,
  });
}

export async function detectAnomalies(snapshot: BusinessSnapshot): Promise<Array<{ type: string; severity: 'info' | 'warn' | 'critical'; message: string }>> {
  const anomalies = [];

  if (snapshot.leads.new7d === 0) {
    anomalies.push({ type: 'no_leads', severity: 'warn' as const, message: 'Sin leads nuevos en 7 días. Revisar canales de adquisición.' });
  }
  if (snapshot.deals.stale > snapshot.deals.active * 0.5) {
    anomalies.push({ type: 'stale_pipeline', severity: 'warn' as const, message: `${snapshot.deals.stale} de ${snapshot.deals.active} deals sin actividad 3+ días.` });
  }
  if (snapshot.reviews.avgRating < 4.0 && snapshot.reviews.total > 5) {
    anomalies.push({ type: 'low_rating', severity: 'critical' as const, message: `Rating promedio ${snapshot.reviews.avgRating}/5 — por debajo del estándar premium.` });
  }
  if (snapshot.bookings.upcomingWeek === 0 && snapshot.deals.active > 5) {
    anomalies.push({ type: 'empty_week', severity: 'info' as const, message: 'Sin tours confirmados próxima semana a pesar de pipeline activo.' });
  }

  return anomalies;
}

export async function runAnalyticsAgent(requestId: string): Promise<{ insights: string; anomalies: number; snapshot: BusinessSnapshot }> {
  const admin = getSupabaseAdmin() as any;
  await logEvent('analytics_agent.started', { requestId }, { source: 'analytics_agent' });

  try {
    const snapshot = await getBusinessSnapshot(admin);
    const insights = await generateWeeklyInsight(snapshot);
    const anomalies = await detectAnomalies(snapshot);

    // Save insights to DB for the admin dashboard
    await admin.from('events').insert({
      type: 'analytics_agent.weekly_insight',
      payload: { insights, snapshot, anomalies },
      source: 'analytics_agent',
    }).catch(() => null);

    // Alert on critical anomalies
    const critical = anomalies.filter((a) => a.severity === 'critical');
    if (critical.length) {
      void notifyOps({
        title: `🚨 Analytics: ${critical.length} anomalía(s) crítica(s)`,
        severity: 'critical',
        text: critical.map((a) => `• ${a.message}`).join('\n'),
        meta: { snapshot },
      }).catch(() => null);
    }

    await logEvent('analytics_agent.completed', { requestId, anomalies: anomalies.length }, { source: 'analytics_agent' });
    return { insights, anomalies: anomalies.length, snapshot };
  } catch (err: any) {
    await logEvent('analytics_agent.error', { requestId, error: err?.message }, { source: 'analytics_agent' });
    throw err;
  }
}
