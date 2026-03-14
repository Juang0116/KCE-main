// src/lib/autopilot.server.ts
import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { logEvent } from '@/lib/events.server';
import type { TablesInsert } from '@/types/supabase';

export type AutopilotParams = {
  admin: SupabaseClient;
  requestId: string;
  dryRun?: boolean;
  stage?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'checkout';
  limit?: number;
  source?: 'admin' | 'cron' | 'api';
};

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600 * 1000).toISOString();
}

type TaskSpec = { title: string; priority: 'low' | 'normal' | 'high' | 'urgent'; dueAtISO: string };

export function desiredTasksForStage(stage: string): TaskSpec[] {
  const st = (stage || '').toLowerCase();
  if (st === 'new') {
    return [
      { title: 'Primer contacto (SLA 2h)', priority: 'urgent', dueAtISO: hoursFromNow(2) },
      { title: 'Follow-up lead (24h)', priority: 'high', dueAtISO: hoursFromNow(24) },
    ];
  }
  if (st === 'contacted') {
    return [
      { title: 'Follow-up lead (24h)', priority: 'high', dueAtISO: hoursFromNow(24) },
      { title: 'Follow-up lead (48h)', priority: 'normal', dueAtISO: hoursFromNow(48) },
    ];
  }
  if (st === 'qualified') {
    return [
      { title: 'Enviar propuesta o llamar (SLA 2h)', priority: 'urgent', dueAtISO: hoursFromNow(2) },
      { title: 'Revisar correo de IA enviado y agendar (12h)', priority: 'high', dueAtISO: hoursFromNow(12) },
    ];
  }
  if (st === 'proposal') {
    return [
      { title: 'Confirmar recepción de propuesta (24h)', priority: 'high', dueAtISO: hoursFromNow(24) },
      { title: 'Follow-up propuesta (48h)', priority: 'normal', dueAtISO: hoursFromNow(48) },
    ];
  }
  return [
    { title: 'Enviar link de pago (checkout) al cliente', priority: 'urgent', dueAtISO: hoursFromNow(1) },
    { title: 'Follow-up pago (2h)', priority: 'urgent', dueAtISO: hoursFromNow(2) },
    { title: 'Follow-up pago (24h)', priority: 'high', dueAtISO: hoursFromNow(24) },
  ];
}

/* ─────────────────────────────────────────────────────────────
   🤖 AI CLOSER AGENT (Email Drafter)
   ───────────────────────────────────────────────────────────── */
async function draftPersonalizedFollowUp(customerName: string, dealTitle: string, notes: string): Promise<string> {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return `Hola ${customerName}, ¿te gustaría que agendáramos una llamada breve para afinar los detalles de tu viaje a Colombia?`;

  const prompt = `
Eres un Asesor de Viajes Senior en KCE (Knowing Cultures Enterprise), una agencia de turismo premium en Colombia.
Tu objetivo es escribir un correo de seguimiento CORTO, CÁLIDO y DIRECTO a un prospecto que solicitó un plan pero no ha respondido.

DATOS DEL VIAJERO:
- Nombre: ${customerName || 'Viajero'}
- Título de su solicitud: ${dealTitle}
- Contexto y notas del sistema: ${notes || 'Buscando opciones de viaje en Colombia'}

REGLAS ESTRICTAS:
1. Escríbelo en español. Tono profesional pero cálido (trátalo de tú).
2. Haz referencia a sus gustos (ciudad, intereses, etc.) para que sepa que leímos su caso.
3. El Call to Action (CTA) es que responda este correo o nos escriba por WhatsApp para agendar una breve videollamada gratuita.
4. MÁXIMO 3 párrafos cortos.
5. NO uses asunto. NO inventes precios. Despídete como "El equipo de Asesores de KCE".
`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.6,
      }),
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.choices[0]?.message?.content || `Hola ${customerName}, ¿cómo va la planeación de tu viaje? Hablemos para afinar detalles.`;
  } catch (err) {
    console.error('[Autopilot AI Error]:', err);
    return `Hola ${customerName}, me gustaría conversar 5 minutos contigo sobre tu plan de viaje para asegurar que sea perfecto. ¿Cuándo te viene bien?`;
  }
}

export async function runAutopilot(params: AutopilotParams): Promise<{
  dealsProcessed: number;
  tasksCreated: number;
  emailsDrafted: number; // 🤖 Nuevo contador de correos de IA
  created: Array<{ dealId: string; title: string; due_at: string; priority: string }>;
  skipped: Array<{ dealId: string; title: string; reason: string }>;
}> {
  const { admin, requestId, dryRun = false, stage, limit = 200, source = 'api' } = params;

  let q = admin
    .from('deals')
    .select('id,stage,lead_id,title,notes,updated_at,created_at')
    .not('stage', 'in', '(won,lost)')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (stage) q = q.eq('stage', stage);

  const dealsRes = await q;
  if (dealsRes.error) throw dealsRes.error;

  const deals = (dealsRes.data ?? []) as any[];
  const dealIds = deals.map((d) => d.id).filter(Boolean);

  const existingByDeal: Record<string, Set<string>> = {};
  if (dealIds.length) {
    const tasksRes = await admin
      .from('tasks')
      .select('deal_id,title,status')
      .in('deal_id', dealIds)
      .in('status', ['open', 'in_progress']);

    if (!tasksRes.error) {
      for (const t of (tasksRes.data ?? []) as any[]) {
        const did = String(t.deal_id || '');
        const title = String(t.title || '').trim();
        if (!did || !title) continue;
        (existingByDeal[did] ||= new Set()).add(title);
      }
    }
  }

  let dealsProcessed = 0;
  let tasksCreated = 0;
  let emailsDrafted = 0;
  const created: Array<{ dealId: string; title: string; due_at: string; priority: string }> = [];
  const skipped: Array<{ dealId: string; title: string; reason: string }> = [];

  for (const d of deals) {
    const did = String(d.id || '');
    if (!did) continue;
    dealsProcessed += 1;

    const st = String(d.stage || '').toLowerCase();
    const specs = desiredTasksForStage(st);
    const have = existingByDeal[did] || new Set<string>();

    // 🤖 IA AUTOPILOT: Si el deal lleva más de 24h sin tocarse y es cualificado, redacta un email
    const timeSinceUpdate = Date.now() - new Date(d.updated_at).getTime();
    if (st === 'qualified' && timeSinceUpdate > 24 * 60 * 60 * 1000 && !have.has('Correo IA Enviado')) {
      if (!dryRun) {
        try {
          const leadRes = await admin.from('leads').select('email').eq('id', d.lead_id).single();
          const email = leadRes.data?.email;
          if (email) {
            const customerName = email.split('@')[0];
            const aiBody = await draftPersonalizedFollowUp(customerName, d.title || 'tu viaje', d.notes || '');

            // Inyectar en tabla outbound_messages para envío real
            await admin.from('outbound_messages').insert({
              recipient_email: email,
              channel: 'email',
              direction: 'outbound',
              status: 'pending',
              subject: 'KCE: Sobre tu idea de viaje a Colombia 🇨🇴',
              body_text: aiBody,
              deal_id: did,
              lead_id: d.lead_id,
            });
            emailsDrafted++;
            have.add('Correo IA Enviado'); // Previene envíos múltiples
            await admin.from('tasks').insert({ deal_id: did, title: 'Correo IA Enviado', status: 'completed' });
          }
        } catch (aiErr) {
          console.error('[AI Autopilot Error on Deal]', did, aiErr);
        }
      }
    }

    // Tareas Regulares
    const toInsert: TablesInsert<'tasks'>[] = [];
    for (const s of specs) {
      if (have.has(s.title)) {
        skipped.push({ dealId: did, title: s.title, reason: 'already_open' });
        continue;
      }
      toInsert.push({ deal_id: did, title: s.title, priority: s.priority, due_at: s.dueAtISO, status: 'open' });
    }

    if (!toInsert.length) continue;

    if (!dryRun) {
      const ins = await admin.from('tasks').insert(toInsert);
      if (ins?.error) throw ins.error;
    }

    for (const t of toInsert) {
      tasksCreated += 1;
      created.push({ dealId: did, title: String(t.title), due_at: String(t.due_at ?? ''), priority: String(t.priority ?? '') });
      (existingByDeal[did] ||= new Set()).add(String(t.title));
    }
  }

  await logEvent(
    source === 'cron' ? 'admin.autopilot_cron' : 'admin.autopilot_run',
    { requestId, dryRun, stage: stage ?? null, limit, dealsProcessed, tasksCreated, emailsDrafted },
    { source },
  );

  return { dealsProcessed, tasksCreated, emailsDrafted, created, skipped };
}