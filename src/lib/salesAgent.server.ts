// src/lib/salesAgent.server.ts
// Sales Agent — qualifies inbound leads, drafts personalized proposals,
// moves deals through pipeline, escalates hot leads to human.
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { agentGenerate } from '@/lib/agentAI.server';
import { notifyOps } from '@/lib/opsNotify.server';

const ROLE = `Eres el Agente de Ventas Senior de KCE (Knowing Cultures Enterprise), 
agencia de turismo cultural premium en Colombia para viajeros internacionales.
Tu misión: convertir leads en clientes calificados con propuestas personalizadas.
Conoces perfectamente el catálogo KCE, precios en EUR, y el perfil del viajero ideal.
Eres consultivo, empático, y orientado a resultados. Nunca presionas, siempre propones valor.`;

export type SalesAction =
  | { type: 'qualify'; leadId: string }
  | { type: 'propose'; dealId: string }
  | { type: 'followup'; dealId: string; daysSinceContact: number }
  | { type: 'escalate'; dealId: string; reason: string };

export type SalesAgentResult = {
  processed: number;
  qualified: number;
  proposed: number;
  escalated: number;
  actions: Array<{ type: string; id: string; result: string }>;
};

// Qualifies a new lead and creates a deal with AI-assessed potential
export async function qualifyLead(lead: {
  id: string;
  email: string;
  name?: string | null;
  city?: string | null;
  budget?: string | null;
  interests?: string | null;
  language?: string | null;
  source?: string | null;
}): Promise<{ score: number; tier: 'hot' | 'warm' | 'cold'; notes: string; nextAction: string }> {
  const assessment = await agentGenerate({
    systemPrompt: `${ROLE}
Evalúa este lead de turismo. Devuelve SOLO JSON válido con este formato exacto:
{"score": 0-100, "tier": "hot|warm|cold", "notes": "análisis breve", "nextAction": "acción concreta"}

Criterios de scoring:
- hot (80-100): presupuesto alto, destino específico, viaje próximo, viajero internacional
- warm (40-79): interés claro pero sin urgencia o presupuesto indefinido
- cold (0-39): exploración vaga, sin datos concretos, o presupuesto muy bajo`,
    userMessage: JSON.stringify(lead),
    temperature: 0.3,
    maxTokens: 200,
    fallback: '{"score":50,"tier":"warm","notes":"Evaluación manual requerida","nextAction":"Contactar por email"}',
  });

  try {
    const clean = assessment.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { score: 50, tier: 'warm', notes: 'Evaluación manual requerida', nextAction: 'Contactar por email' };
  }
}

// Drafts a personalized proposal for a deal
export async function draftProposal(deal: {
  id: string;
  title: string;
  city?: string | null;
  budget?: string | null;
  interests?: string | null;
  persons?: number | null;
  dates?: string | null;
  customerName?: string | null;
  customerLanguage?: string | null;
}): Promise<string> {
  const lang = deal.customerLanguage?.slice(0, 2) || 'es';
  const isEn = lang === 'en';

  return agentGenerate({
    systemPrompt: `${ROLE}
Escribe una propuesta de viaje PERSONALIZADA y PROFESIONAL${isEn ? ' en inglés' : ' en español'}.
Incluye: saludo personalizado, 2-3 opciones de experiencias KCE relevantes para sus intereses,
valor diferencial de KCE, CTA claro para agendar una llamada o reservar.
Máximo 250 palabras. Tono: premium pero cálido.`,
    userMessage: JSON.stringify(deal),
    temperature: 0.7,
    maxTokens: 500,
    fallback: `Hola ${deal.customerName || 'viajero'}, gracias por tu interés en KCE. Tenemos experiencias perfectas para ti en ${deal.city || 'Colombia'}. ¿Cuándo podemos hablar?`,
  });
}

// Main runner — processes stale deals and new leads
export async function runSalesAgent(requestId: string): Promise<SalesAgentResult> {
  const admin = getSupabaseAdmin() as any;
  const result: SalesAgentResult = { processed: 0, qualified: 0, proposed: 0, escalated: 0, actions: [] };

  await logEvent('sales_agent.started', { requestId }, { source: 'sales_agent' });

  try {
    // 1. Qualify new unscored leads (created in last 24h, no deal yet)
    const { data: newLeads } = await admin
      .from('leads')
      .select('id, email, name, source, language, created_at')
      .is('deal_id', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(20);

    for (const lead of newLeads ?? []) {
      result.processed++;
      const q = await qualifyLead(lead);

      // Save qualification to lead metadata
      await admin.from('leads').update({
        metadata: { ai_score: q.score, ai_tier: q.tier, ai_notes: q.notes, ai_next_action: q.nextAction, ai_qualified_at: new Date().toISOString() },
      }).eq('id', lead.id);

      // Hot leads → notify immediately
      if (q.tier === 'hot') {
        result.escalated++;
        void notifyOps({
          title: `🔥 Lead HOT — ${lead.email}`,
          severity: 'warn',
          text: `Score: ${q.score}/100\n${q.notes}\nAcción: ${q.nextAction}`,
          meta: { leadId: lead.id },
        }).catch(() => null);
      }

      result.qualified++;
      result.actions.push({ type: 'qualify', id: lead.id, result: `${q.tier} (${q.score})` });
    }

    // 2. Follow up on stale deals (no activity in 3+ days)
    const { data: staleDeals } = await admin
      .from('deals')
      .select('id, title, amount_minor, stage, updated_at, metadata')
      .not('stage', 'in', '(won,lost,archived)')
      .lt('updated_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    for (const deal of staleDeals ?? []) {
      result.processed++;
      const daysSince = Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / 86_400_000);

      // Auto-create followup task
      await admin.from('tasks').insert({
        title: `[Sales Agent] Retomar deal: ${deal.title} (${daysSince}d sin contacto)`,
        priority: daysSince > 7 ? 'urgent' : 'high',
        status: 'open',
        due_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        metadata: { agent: 'sales_agent', deal_id: deal.id, days_stale: daysSince },
      }).select('id').single();

      result.actions.push({ type: 'followup_task', id: deal.id, result: `${daysSince}d stale → task created` });
    }

    await logEvent('sales_agent.completed', { requestId, ...result }, { source: 'sales_agent' });
    return result;
  } catch (err: any) {
    await logEvent('sales_agent.error', { requestId, error: err?.message }, { source: 'sales_agent' });
    throw err;
  }
}
