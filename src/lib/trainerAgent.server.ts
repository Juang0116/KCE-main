// src/lib/trainerAgent.server.ts
// Trainer Agent — analyzes outcomes, improves prompts, self-trains the system.
// Studies: which emails get replies, which proposals convert, what content ranks.
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { agentGenerate } from '@/lib/agentAI.server';

const ROLE = `Eres el Chief AI Trainer de KCE. Tu misión es mejorar continuamente 
el rendimiento de todos los agentes de IA analizando resultados reales.
Estudias qué mensajes convierten, qué contenido funciona, qué propuestas cierran deals.
Eres metódico, basado en datos, y sabes exactamente qué ajustes mejorarán los resultados.`;

export type TrainingInsight = {
  agent: string;
  finding: string;
  improvement: string;
  impact: 'high' | 'medium' | 'low';
};

export async function analyzeEmailPerformance(admin: any): Promise<TrainingInsight[]> {
  const insights: TrainingInsight[] = [];

  // Analyze outbound messages: which ones got replies vs ignored
  const { data: messages } = await admin
    .from('crm_outbound_messages')
    .select('channel, subject, outcome, replied_at, metadata, created_at')
    .not('outcome', 'eq', 'none')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!messages || messages.length < 10) return insights;

  const replied = messages.filter((m: any) => m.outcome === 'replied' || m.replied_at);
  const replyRate = replied.length / messages.length;

  if (replyRate < 0.1) {
    const analysis = await agentGenerate({
      systemPrompt: `${ROLE}
Analiza estos datos de emails y sugiere mejoras específicas para el asunto y cuerpo.
Devuelve SOLO un párrafo con la mejora concreta.`,
      userMessage: `Reply rate: ${Math.round(replyRate * 100)}%\nMuestra de asuntos: ${messages.slice(0, 5).map((m: any) => m.subject).join(' | ')}`,
      temperature: 0.4,
      maxTokens: 150,
      fallback: 'Personalizar más los asuntos con nombre y destino específico del cliente.',
    });

    insights.push({
      agent: 'sales_agent',
      finding: `Reply rate bajo: ${Math.round(replyRate * 100)}%`,
      improvement: analysis,
      impact: 'high',
    });
  }

  return insights;
}

export async function analyzeConversionFunnel(admin: any): Promise<TrainingInsight[]> {
  const insights: TrainingInsight[] = [];

  const { data: deals } = await admin
    .from('deals')
    .select('stage, created_at, updated_at, amount_minor')
    .order('created_at', { ascending: false })
    .limit(200);

  if (!deals || deals.length < 5) return insights;

  type Deal = { stage: string; created_at: string; updated_at: string; amount_minor: number | null };
  const dl = deals as Deal[];
  const won = dl.filter((d) => d.stage === 'won').length;
  const total = dl.length;
  const convRate = won / total;

  if (convRate < 0.15) {
    insights.push({
      agent: 'sales_agent',
      finding: `Conversion rate: ${Math.round(convRate * 100)}% (objetivo: 15%+)`,
      improvement: 'Agregar urgencia real (fechas disponibles limitadas) y prueba social en propuestas.',
      impact: 'high',
    });
  }

  // Find bottleneck stage
  const stageCount: Record<string, number> = {};
  for (const d of dl) stageCount[d.stage] = (stageCount[d.stage] ?? 0) + 1;
  const bottleneck = Object.entries(stageCount).sort(([,a],[,b]) => b-a)[0];
  if (bottleneck && bottleneck[0] !== 'won' && bottleneck[0] !== 'lost') {
    insights.push({
      agent: 'sales_agent',
      finding: `Cuello de botella en etapa: ${bottleneck[0]} (${bottleneck[1]} deals)`,
      improvement: `Crear template específico para mover deals de ${bottleneck[0]} a la siguiente etapa.`,
      impact: 'medium',
    });
  }

  return insights;
}

export async function saveTrainingInsights(admin: any, insights: TrainingInsight[]): Promise<void> {
  if (!insights.length) return;

  for (const insight of insights) {
    // Save as AI playbook snippet for agents to use
    await admin.from('ai_playbook_snippets').insert({
      key: `trainer.${insight.agent}.${Date.now()}`,
      title: insight.finding,
      content: insight.improvement,
      impact: insight.impact,
      source: 'trainer_agent',
      enabled: false, // Human reviews before enabling
      created_at: new Date().toISOString(),
    }).catch(() => null);
  }
}

export async function runTrainerAgent(requestId: string): Promise<{ insights: TrainingInsight[]; saved: number }> {
  const admin = getSupabaseAdmin() as any;
  await logEvent('trainer_agent.started', { requestId }, { source: 'trainer_agent' });

  try {
    const [emailInsights, conversionInsights] = await Promise.all([
      analyzeEmailPerformance(admin),
      analyzeConversionFunnel(admin),
    ]);

    const allInsights = [...emailInsights, ...conversionInsights];
    await saveTrainingInsights(admin, allInsights);

    await logEvent('trainer_agent.completed', {
      requestId,
      insights: allInsights.length,
      high: allInsights.filter((i) => i.impact === 'high').length,
    }, { source: 'trainer_agent' });

    return { insights: allInsights, saved: allInsights.length };
  } catch (err: any) {
    await logEvent('trainer_agent.error', { requestId, error: err?.message }, { source: 'trainer_agent' });
    throw err;
  }
}
