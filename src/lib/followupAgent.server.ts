// src/lib/followupAgent.server.ts
// KCE Follow-up Agent — auto-enrolls leads in drip sequences after plan submission.
// Sequences are seeded in the DB on first run (idempotent).
import 'server-only';

import { logEvent } from '@/lib/events.server';
import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';

/* ─────────────────────────────────────────────────────────────
   Sequence definitions (seeded into DB on first enroll call)
   ───────────────────────────────────────────────────────────── */

const PLAN_FOLLOWUP_KEY = 'kce.plan.no_response.v1';

type StepDef = {
  step_index: number;
  delay_minutes: number;
  channel: 'email' | 'whatsapp';
  subject?: string;
  body: string;
};

const PLAN_FOLLOWUP_STEPS: StepDef[] = [
  {
    step_index: 0,
    delay_minutes: 120, // 2 hours
    channel: 'email',
    subject: 'Tu plan de viaje KCE está listo 🗺️',
    body: `Hola {name} 👋

Hace un momento pediste tu plan personalizado para {city} con KCE.

Aquí te lo resumimos:
- Ciudad: {city}
- Presupuesto: {budget}
- Intereses: {interests}

¿Tienes alguna duda o quieres ajustar fechas? Responde este correo y nuestro equipo te ayuda en menos de 12 horas.

→ Ver catálogo completo: {tours_url}

Con gusto,
Equipo KCE
`,
  },
  {
    step_index: 1,
    delay_minutes: 1440, // 24 hours
    channel: 'email',
    subject: 'Tu itinerario KCE sigue disponible ✈️',
    body: `Hola {name},

Vimos que aún no has confirmado tu viaje a {city}.

Si tienes preguntas sobre tours, precios o fechas, estamos aquí:
→ Responde este correo
→ WhatsApp directo: {whatsapp_url}
→ O visítanos en: {contact_url}

También puedes explorar más opciones en:
→ {tours_url}

Estamos listos cuando tú lo estés.

Equipo KCE
`,
  },
  {
    step_index: 2,
    delay_minutes: 4320, // 72 hours
    channel: 'email',
    subject: '¿Seguimos con tu plan de Colombia? 🌿',
    body: `Hola {name},

Este es nuestro último seguimiento sobre tu plan a {city}.

Si aún tienes interés, podemos ayudarte:
→ WhatsApp (respuesta inmediata): {whatsapp_url}
→ Agendar una llamada: {contact_url}
→ Ver tours: {tours_url}

Cuando estés listo, aquí estamos.

Equipo KCE
`,
  },
];

/* ─────────────────────────────────────────────────────────────
   Seed sequence in DB (idempotent)
   ───────────────────────────────────────────────────────────── */
async function ensurePlanFollowupSequence(admin: any): Promise<string> {
  // Check if already seeded
  const existing = await admin
    .from('crm_sequences')
    .select('id')
    .eq('key', PLAN_FOLLOWUP_KEY)
    .maybeSingle();

  if (existing.data?.id) return String(existing.data.id);

  // Create sequence
  const seqRes = await admin
    .from('crm_sequences')
    .insert({
      key: PLAN_FOLLOWUP_KEY,
      name: 'Plan personalizado — sin respuesta',
      status: 'active',
      channel: 'email',
      locale: 'es',
      description: 'Drip de 3 pasos (2h, 24h, 72h) para leads que enviaron el formulario de plan pero no reservaron.',
      entry_event: 'quiz.crm_routed',
    })
    .select('id')
    .single();

  if (seqRes.error) throw new Error(`[followupAgent] seed sequence: ${seqRes.error.message}`);
  const sequenceId = String(seqRes.data.id);

  // Seed steps
  const steps = PLAN_FOLLOWUP_STEPS.map((s) => ({
    sequence_id: sequenceId,
    step_index: s.step_index,
    delay_minutes: s.delay_minutes,
    channel: s.channel,
    subject: s.subject ?? null,
    body: s.body,
    metadata: {},
  }));

  const stepsRes = await admin.from('crm_sequence_steps').insert(steps);
  if (stepsRes.error) throw new Error(`[followupAgent] seed steps: ${stepsRes.error.message}`);

  await logEvent('followupAgent.sequence_seeded', { key: PLAN_FOLLOWUP_KEY, sequenceId, steps: steps.length });
  return sequenceId;
}

/* ─────────────────────────────────────────────────────────────
   Check for duplicate enrollment (don't enroll twice)
   ───────────────────────────────────────────────────────────── */
async function alreadyEnrolled(admin: any, sequenceId: string, leadId: string | null, dealId: string | null): Promise<boolean> {
  let query = admin
    .from('crm_sequence_enrollments')
    .select('id')
    .eq('sequence_id', sequenceId)
    .in('status', ['active', 'completed']);

  if (dealId) query = query.eq('deal_id', dealId);
  else if (leadId) query = query.eq('lead_id', leadId);
  else return false;

  const res = await query.maybeSingle();
  return Boolean(res.data?.id);
}

/* ─────────────────────────────────────────────────────────────
   Public entry point — called from quiz/submit after CRM routing
   ───────────────────────────────────────────────────────────── */
export async function enrollLeadInFollowupSequence(params: {
  leadId: string | null;
  dealId: string | null;
  city: string | null;
  locale?: string;
}): Promise<{ enrolled: boolean; enrollmentId?: string; reason?: string }> {
  const { leadId, dealId, city, locale = 'es' } = params;

  if (!leadId && !dealId) return { enrolled: false, reason: 'no_target' };

  const admin = getSupabaseAdminAny();
  if (!admin) return { enrolled: false, reason: 'no_supabase' };

  // Seed sequence if needed
  const sequenceId = await ensurePlanFollowupSequence(admin);

  // Skip if already enrolled
  if (await alreadyEnrolled(admin, sequenceId, leadId, dealId)) {
    return { enrolled: false, reason: 'already_enrolled' };
  }

  // Enroll
  const row: Record<string, unknown> = {
    sequence_id: sequenceId,
    status: 'active',
    current_step: 0,
    next_run_at: new Date(Date.now() + (PLAN_FOLLOWUP_STEPS[0]?.delay_minutes ?? 120) * 60_000).toISOString(),
    last_error: null,
    metadata: { city: city ?? null, locale, source: 'quiz_submit' },
  };
  if (dealId) row.deal_id = dealId;
  if (leadId) row.lead_id = leadId;

  const res = await (admin as any)
    .from('crm_sequence_enrollments')
    .insert(row)
    .select('id')
    .single();

  if (res.error) throw new Error(`[followupAgent] enroll: ${res.error.message}`);

  const enrollmentId = String(res.data.id);

  await logEvent('followupAgent.enrolled', {
    enrollmentId,
    sequenceId,
    leadId: leadId ?? null,
    dealId: dealId ?? null,
    city: city ?? null,
    firstStepAt: row.next_run_at,
  });

  return { enrolled: true, enrollmentId };
}

/* ─────────────────────────────────────────────────────────────
   Cancel enrollment when lead books (called from booking webhook)
   ───────────────────────────────────────────────────────────── */
export async function cancelFollowupOnBooking(params: {
  leadId?: string | null;
  dealId?: string | null;
}): Promise<{ canceled: number }> {
  const { leadId, dealId } = params;
  if (!leadId && !dealId) return { canceled: 0 };

  const admin = getSupabaseAdminAny();
  if (!admin) return { canceled: 0 };

  let query = (admin as any)
    .from('crm_sequence_enrollments')
    .update({ status: 'canceled' })
    .eq('status', 'active');

  if (dealId) query = query.eq('deal_id', dealId);
  else if (leadId) query = query.eq('lead_id', leadId);

  const res = await query.select('id');
  const canceled = (res.data?.length ?? 0);

  if (canceled > 0) {
    await logEvent('followupAgent.canceled_on_booking', { leadId, dealId, canceled });
  }

  return { canceled };
}
