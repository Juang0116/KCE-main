// src/app/api/admin/leads/brief/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { agentGenerate } from '@/lib/agentAI.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin() as any;

  const [
    { count: totalLeads },
    { count: newLeads },
    { data: stageBreakdown },
    { data: recentLeads },
  ] = await Promise.all([
    admin.from('leads').select('*', { count: 'exact', head: true }),
    admin.from('leads').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86_400_000).toISOString()),
    admin.from('deals').select('stage').not('stage', 'in', '(won,lost)'),
    admin.from('leads').select('source, language, created_at')
      .order('created_at', { ascending: false }).limit(10),
  ]);

  type StageRow = { stage: string };
  const stages: Record<string, number> = {};
  for (const row of (stageBreakdown as StageRow[]) ?? []) {
    stages[row.stage] = (stages[row.stage] ?? 0) + 1;
  }

  const sources = (recentLeads ?? []).reduce((acc: Record<string, number>, r: any) => {
    const s = r.source || 'direct';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const brief = await agentGenerate({
    systemPrompt: `Eres el Agente CRM de KCE. Genera un resumen ejecutivo breve (máx 120 palabras) del pipeline comercial para el fundador. Tono directo y accionable: qué está bien, qué necesita atención hoy, 1 acción recomendada.`,
    userMessage: JSON.stringify({
      totalLeads,
      newLeadsLast7Days: newLeads,
      dealsByStage: stages,
      recentSources: sources,
      date: new Date().toLocaleDateString('es-CO'),
    }),
    temperature: 0.5,
    maxTokens: 200,
    fallback: `Pipeline: ${totalLeads ?? 0} leads totales, ${newLeads ?? 0} nuevos esta semana. Etapas activas: ${Object.entries(stages).map(([k,v]) => `${k}(${v})`).join(', ') || 'sin datos'}. Acción: revisa deals sin actividad en los últimos 3 días.`,
  });

  return NextResponse.json(
    { ok: true, brief, snapshot: { totalLeads, newLeads, stages, sources }, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
