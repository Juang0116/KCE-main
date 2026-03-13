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
  // NOTE: Titles are used as a de-dup key (exact match).
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
      { title: 'Enviar propuesta (SLA 2h)', priority: 'urgent', dueAtISO: hoursFromNow(2) },
      { title: 'Confirmar datos para propuesta (12h)', priority: 'high', dueAtISO: hoursFromNow(12) },
    ];
  }
  if (st === 'proposal') {
    return [
      { title: 'Confirmar recepción de propuesta (24h)', priority: 'high', dueAtISO: hoursFromNow(24) },
      { title: 'Follow-up propuesta (48h)', priority: 'normal', dueAtISO: hoursFromNow(48) },
    ];
  }
  // checkout
  return [
    { title: 'Enviar link de pago (checkout) al cliente', priority: 'urgent', dueAtISO: hoursFromNow(1) },
    { title: 'Follow-up pago (2h)', priority: 'urgent', dueAtISO: hoursFromNow(2) },
    { title: 'Follow-up pago (24h)', priority: 'high', dueAtISO: hoursFromNow(24) },
  ];
}

export async function runAutopilot(params: AutopilotParams): Promise<{
  dealsProcessed: number;
  tasksCreated: number;
  created: Array<{ dealId: string; title: string; due_at: string; priority: string }>;
  skipped: Array<{ dealId: string; title: string; reason: string }>;
}> {
  const { admin, requestId, dryRun = false, stage, limit = 200, source = 'api' } = params;

  let q = admin
    .from('deals')
    .select('id,stage,lead_id,customer_id,updated_at,created_at,amount_minor,currency,probability,assigned_to')
    .not('stage', 'in', '(won,lost)')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (stage) q = q.eq('stage', stage);

  const dealsRes = await q;
  if (dealsRes.error) throw dealsRes.error;

  const deals = (dealsRes.data ?? []) as any[];
  const dealIds = deals.map((d) => d.id).filter(Boolean);

  // Existing open tasks for de-duplication
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
  const created: Array<{ dealId: string; title: string; due_at: string; priority: string }> = [];
  const skipped: Array<{ dealId: string; title: string; reason: string }> = [];

  for (const d of deals) {
    const did = String(d.id || '');
    if (!did) continue;
    dealsProcessed += 1;

    const st = String(d.stage || '').toLowerCase();
    const specs = desiredTasksForStage(st);
    const have = existingByDeal[did] || new Set<string>();

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
    { requestId, dryRun, stage: stage ?? null, limit, dealsProcessed, tasksCreated },
    { source },
  );

  return { dealsProcessed, tasksCreated, created, skipped };
}
