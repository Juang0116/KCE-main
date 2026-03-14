// src/lib/sequences.server.ts
import 'server-only';

import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';
import { renderTemplateText } from '@/lib/templates.server';
import { absUrl } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { createOutboundMessage } from '@/lib/outbound.server';

export type Sequence = {
  id: string;
  key: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  description: string | null;
  segment_key: string | null;
  entry_event: string | null;
  channel: 'email' | 'whatsapp' | 'mixed';
  locale: string | null;
  created_at: string;
  updated_at: string;
};

export type SequenceStep = {
  id: string;
  sequence_id: string;
  step_index: number;
  delay_minutes: number;
  channel: 'email' | 'whatsapp';
  template_key: string | null;
  template_variant: string | null;
  subject: string | null;
  body: string;
  metadata: any;
  created_at: string;
  updated_at: string;
};

function nowIso() {
  return new Date().toISOString();
}

function sbAny() {
  const admin = getSupabaseAdminAny();
  if (!admin) throw new Error('Supabase admin not configured');
  return admin as any;
}

export async function listSequences(): Promise<Sequence[]> {
  const admin = sbAny();
  const res = await admin.from('crm_sequences').select('*').order('created_at', { ascending: false });
  if (res.error) throw new Error(res.error.message);
  return (res.data || []) as Sequence[];
}

export async function getSequence(id: string): Promise<{ sequence: Sequence; steps: SequenceStep[] } | null> {
  const admin = sbAny();

  const s = await admin.from('crm_sequences').select('*').eq('id', id).maybeSingle();
  if (s.error) throw new Error(s.error.message);
  if (!s.data) return null;

  const st = await admin
    .from('crm_sequence_steps')
    .select('*')
    .eq('sequence_id', id)
    .order('step_index', { ascending: true });

  if (st.error) throw new Error(st.error.message);

  return { sequence: s.data as Sequence, steps: (st.data || []) as SequenceStep[] };
}

export async function upsertSequence(params: Partial<Sequence> & { key: string; name: string }): Promise<Sequence> {
  const admin = sbAny();

  const row: any = {
    ...(params.id ? { id: params.id } : {}),
    key: params.key,
    name: params.name,
    status: params.status ?? 'draft',
    description: params.description ?? null,
    segment_key: params.segment_key ?? null,
    entry_event: params.entry_event ?? null,
    channel: params.channel ?? 'email',
    locale: params.locale ?? 'es',
  };

  const res = await admin.from('crm_sequences').upsert(row).select('*').single();
  if (res.error) throw new Error(res.error.message);

  await logEvent('sequences.upserted', { id: res.data?.id, key: res.data?.key, status: res.data?.status });
  return res.data as Sequence;
}

export async function replaceSteps(
  sequenceId: string,
  steps: Array<Partial<SequenceStep> & { step_index: number; body: string; channel: 'email' | 'whatsapp' }>,
): Promise<void> {
  const admin = sbAny();

  const del = await admin.from('crm_sequence_steps').delete().eq('sequence_id', sequenceId);
  if (del.error) throw new Error(del.error.message);

  const payload = steps.map((s) => ({
    sequence_id: sequenceId,
    step_index: s.step_index,
    delay_minutes: s.delay_minutes ?? 0,
    channel: s.channel,
    template_key: s.template_key ?? null,
    template_variant: s.template_variant ?? null,
    subject: s.subject ?? null,
    body: s.body,
    metadata: s.metadata ?? {},
  }));

  const ins = await admin.from('crm_sequence_steps').insert(payload);
  if (ins.error) throw new Error(ins.error.message);

  await logEvent('sequences.steps_replaced', { sequenceId, count: payload.length });
}

export async function enrollInSequence(params: {
  sequenceId: string;
  dealId?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  metadata?: any;
}): Promise<{ enrollmentId: string }> {
  const admin = sbAny();

  const row: any = {
    sequence_id: params.sequenceId,
    status: 'active',
    deal_id: params.dealId ?? null,
    lead_id: params.leadId ?? null,
    customer_id: params.customerId ?? null,
    current_step: 0,
    next_run_at: nowIso(),
    last_error: null,
    metadata: params.metadata ?? {},
  };

  const res = await admin.from('crm_sequence_enrollments').insert(row).select('id').single();
  if (res.error) throw new Error(res.error.message);

  await logEvent('sequences.enrolled', { enrollmentId: res.data?.id, sequenceId: params.sequenceId });
  return { enrollmentId: String(res.data?.id) };
}

export async function runSequenceCron(params: { limit?: number; dryRun?: boolean } = {}) {
  const admin = sbAny();

  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const now = nowIso();

  const en = await admin
    .from('crm_sequence_enrollments')
    .select('*')
    .eq('status', 'active')
    .lte('next_run_at', now)
    .order('next_run_at', { ascending: true })
    .limit(limit);

  if (en.error) throw new Error(en.error.message);

  let processed = 0;
  let created = 0;
  let failed = 0;

  for (const e of (en.data || []) as any[]) {
    processed++;
    try {
      const seq = await getSequence(String(e.sequence_id));
      if (!seq) continue;

      const step = (seq.steps || []).find((s) => s.step_index === Number(e.current_step));
      if (!step) {
        if (!params.dryRun) {
          await admin.from('crm_sequence_enrollments').update({ status: 'completed' }).eq('id', e.id);
        }
        await logEvent('sequences.completed', { enrollmentId: e.id, sequenceId: e.sequence_id });
        continue;
      }

      if (params.dryRun) continue;

      // Resolve target contact (best-effort)
      let toEmail: string | null = null;
      let toPhone: string | null = null;

      if (e.deal_id) {
        const d = await admin.from('deals').select('id, customer_id, lead_id').eq('id', e.deal_id).maybeSingle();
        const leadId = d.data?.lead_id || e.lead_id;
        const customerId = d.data?.customer_id || e.customer_id;

        if (customerId) {
          const c = await admin.from('customers').select('id, email, phone').eq('id', customerId).maybeSingle();
          toEmail = c.data?.email || null;
          toPhone = c.data?.phone || null;
        }
        if ((!toEmail || !toPhone) && leadId) {
          const l = await admin.from('leads').select('id, email, phone').eq('id', leadId).maybeSingle();
          toEmail = toEmail || l.data?.email || null;
          toPhone = toPhone || l.data?.phone || null;
        }
      } else if (e.customer_id) {
        const c = await admin.from('customers').select('id, email, phone').eq('id', e.customer_id).maybeSingle();
        toEmail = c.data?.email || null;
        toPhone = c.data?.phone || null;
      } else if (e.lead_id) {
        const l = await admin.from('leads').select('id, email, phone').eq('id', e.lead_id).maybeSingle();
        toEmail = l.data?.email || null;
        toPhone = l.data?.phone || null;
      }

      const channel = step.channel;
      const status = channel === 'email' ? 'queued' : 'draft';

      // Build template vars from enrollment metadata + contact
      const meta = (e.metadata || {}) as Record<string, unknown>;
      let contactName = String(meta.name ?? '').trim();
      if (!contactName && (e.customer_id || e.lead_id)) {
        try {
          if (e.customer_id) {
            const cr = await admin.from('customers').select('name').eq('id', e.customer_id).maybeSingle();
            contactName = String(cr.data?.name ?? '').trim();
          }
          if (!contactName && e.lead_id) {
            const lr = await admin.from('leads').select('notes').eq('id', e.lead_id).maybeSingle();
            // Extract name from notes "Nombre: X" pattern if stored
            const m = String(lr.data?.notes ?? '').match(/Nombre[:\s]+([^\n|]+)/i);
            if (m?.[1]) contactName = m[1].trim();
          }
        } catch { /* best-effort */ }
      }

      const base = absUrl('/');
      const templateVars: Record<string, string> = {
        name: contactName || 'viajero',
        city: String(meta.city ?? 'Colombia').trim() || 'Colombia',
        budget: String(meta.budget ?? '').trim() || 'a tu medida',
        interests: String(meta.interests ?? '').trim() || 'cultura y naturaleza',
        tours_url: `${base}tours`,
        contact_url: `${base}contact?source=followup`,
        plan_url: `${base}plan`,
      };

      const renderedBody = renderTemplateText(step.body, templateVars);
      const renderedSubject = step.subject ? renderTemplateText(step.subject, templateVars) : null;

      await createOutboundMessage({
        channel,
        status,
        toEmail: channel === 'email' ? toEmail : null,
        toPhone: channel === 'whatsapp' ? toPhone : null,
        subject: renderedSubject,
        body: renderedBody,
        templateKey: step.template_key ?? null,
        templateVariant: step.template_variant ?? null,
        dealId: e.deal_id ?? null,
        leadId: e.lead_id ?? null,
        customerId: e.customer_id ?? null,
        metadata: {
          ...((step.metadata as any) || {}),
          enrollment_id: e.id,
          sequence_id: e.sequence_id,
          step_index: step.step_index,
        },
      });

      created++;

      // Event trail (best-effort)
      await admin.from('crm_outbound_events').insert({
        enrollment_id: e.id,
        kind: 'step.created_outbound',
        payload: { channel, status, step_index: step.step_index },
      });

      // schedule next
      const nextStep = Number(e.current_step) + 1;
      const next = (seq.steps || []).find((s) => s.step_index === nextStep);

      if (!next) {
        await admin
          .from('crm_sequence_enrollments')
          .update({ status: 'completed', current_step: nextStep })
          .eq('id', e.id);

        await logEvent('sequences.completed', { enrollmentId: e.id, sequenceId: e.sequence_id });
      } else {
        const nextRun = new Date(Date.now() + Math.max(Number(next.delay_minutes) || 0, 0) * 60_000).toISOString();
        await admin
          .from('crm_sequence_enrollments')
          .update({ current_step: nextStep, next_run_at: nextRun, last_error: null })
          .eq('id', e.id);
      }
    } catch (err: any) {
      failed++;
      if (!params.dryRun) {
        await admin
          .from('crm_sequence_enrollments')
          .update({ last_error: String(err?.message || err), status: 'failed' })
          .eq('id', e.id);
      }
      await logEvent('sequences.failed', { enrollmentId: e.id, error: String(err?.message || err) });
    }
  }

  return { processed, created, failed };
}

export async function getEnrollmentStats(): Promise<
  Record<string, { active: number; completed: number; failed: number }>
> {
  const admin = sbAny();
  const res = await admin
    .from('crm_sequence_enrollments')
    .select('sequence_id, status');

  if (res.error) return {};

  const map: Record<string, { active: number; completed: number; failed: number }> = {};
  for (const row of (res.data || []) as any[]) {
    const id = String(row.sequence_id);
    if (!map[id]) map[id] = { active: 0, completed: 0, failed: 0 };
    const st = String(row.status);
    if (st === 'active') map[id].active++;
    else if (st === 'completed') map[id].completed++;
    else if (st === 'failed') map[id].failed++;
  }
  return map;
}

export async function listActiveEnrollments(limit = 50): Promise<any[]> {
  const admin = sbAny();
  const res = await admin
    .from('crm_sequence_enrollments')
    .select('id, sequence_id, status, current_step, next_run_at, lead_id, deal_id, metadata, created_at, last_error')
    .eq('status', 'active')
    .order('next_run_at', { ascending: true })
    .limit(limit);
  if (res.error) throw new Error(res.error.message);
  return (res.data || []) as any[];
}
