// src/app/api/admin/leads/brief/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { agentGenerate } from '@/lib/agentAI.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20; // Margen de tiempo para la generación con IA

export async function GET(req: NextRequest) {
  // 1. Autenticación y validación de permisos
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const db = admin as any; // Bypass temporal de types para evitar error "never"

    // 2. Extracción paralela de métricas clave para el Cockpit
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [
      totalLeadsRes,
      newLeadsRes,
      stageBreakdownRes,
      recentLeadsRes,
    ] = await Promise.all([
      db.from('leads').select('*', { count: 'exact', head: true }),
      db.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      db.from('deals').select('stage').not('stage', 'in', '(won,lost)'),
      db.from('leads').select('source, language, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    // Verificación temprana de errores en la base de datos
    const dbError = totalLeadsRes.error || newLeadsRes.error || stageBreakdownRes.error || recentLeadsRes.error;
    if (dbError) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/leads/brief', message: dbError.message },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error al consultar las métricas comerciales', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    const totalLeads = totalLeadsRes.count ?? 0;
    const newLeads = newLeadsRes.count ?? 0;

    // 3. Procesamiento, agrupación y limpieza de datos
    const stages: Record<string, number> = {};
    for (const row of (stageBreakdownRes.data || [])) {
      const stageName = row.stage || 'unknown';
      stages[stageName] = (stages[stageName] || 0) + 1;
    }

    const sources = (recentLeadsRes.data || []).reduce((acc: Record<string, number>, row: any) => {
      const sourceName = row.source || 'direct';
      acc[sourceName] = (acc[sourceName] || 0) + 1;
      return acc;
    }, {});

    // 4. Generación de Resumen Ejecutivo con Inteligencia Artificial
    const fallbackText = `Pipeline: ${totalLeads} leads totales, ${newLeads} nuevos esta semana. Etapas activas: ${Object.entries(stages).map(([k,v]) => `${k}(${v})`).join(', ') || 'sin datos'}. Acción: revisa deals sin actividad en los últimos 3 días.`;

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
      fallback: fallbackText,
    });

    // 5. Registro de auditoría operativa
    await logEvent(
      'admin.brief_generated',
      { requestId, totalLeads, newLeads, hasBrief: !!brief },
      { source: 'admin', dedupeKey: `brief_generated:${new Date().toISOString().split('T')[0]}` } // Evita saturar logs si se recarga la página mucho en un día
    );

    return NextResponse.json(
      { 
        ok: true, 
        brief, 
        snapshot: { totalLeads, newLeads, stages, sources }, 
        requestId 
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar brief';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/leads/brief', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}