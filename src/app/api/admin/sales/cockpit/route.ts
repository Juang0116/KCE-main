// src/app/api/admin/sales/cockpit/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'checkout', 'won', 'lost']).optional(),
  limit: z.coerce.number().int().min(5).max(200).default(60),
});

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function baseScoreForStage(stage: string) {
  const st = (stage || '').toLowerCase();
  if (st === 'checkout') return 75;
  if (st === 'proposal') return 60;
  if (st === 'qualified') return 45;
  if (st === 'contacted') return 35;
  if (st === 'new') return 30;
  if (st === 'won') return 100;
  if (st === 'lost') return 0;
  return 25;
}

function daysBetween(aISO: string, b: Date) {
  const a = new Date(aISO);
  if (Number.isNaN(a.getTime())) return 0;
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (24 * 3600 * 1000)));
}

function computeScore(opts: {
  stage: string;
  staleDays: number;
  overdueTasks: number;
  hasAmount: boolean;
  assigned: boolean;
  contactStaleDays: number | null;
  waitingOn: 'agent' | 'customer' | null;
  waitingDays: number | null;
}) {
  let score = baseScoreForStage(opts.stage);
  if (opts.hasAmount) score += 5;
  if (opts.assigned) score += 5;

  // Contact freshness (from tickets)
  if (opts.contactStaleDays === 0) score += 10;
  else if (opts.contactStaleDays === 1) score += 5;
  else if (opts.contactStaleDays !== null && opts.contactStaleDays >= 3) score -= 10;

  // Conversation signal
  if (opts.waitingOn === 'agent') score += 10;
  if (opts.waitingOn === 'customer' && (opts.waitingDays ?? 0) >= 3) score -= 10;

  // Deal freshness
  if (opts.staleDays >= 2) score -= 10;
  if (opts.staleDays >= 5) score -= 10;

  // Operational debt
  if (opts.overdueTasks > 0) score -= 15;
  if (opts.overdueTasks >= 3) score -= 10;

  return clamp(score, 0, 100);
}

function computeRisk(
  stage: string,
  staleDays: number,
  overdueTasks: number,
  contactStaleDays: number | null,
  waitingOn: 'agent' | 'customer' | null,
  waitingDays: number | null,
) {
  const st = (stage || '').toLowerCase();
  const risks: string[] = [];
  if (overdueTasks > 0) risks.push('tareas vencidas');
  if (staleDays >= 3) risks.push('deal estancado');
  if (contactStaleDays !== null && contactStaleDays >= 3) risks.push('sin contacto reciente');

  if (waitingOn === 'agent') risks.push('cliente esperando');
  if (waitingOn === 'customer' && (waitingDays ?? 0) >= 3) risks.push('esperando al cliente');

  if (st === 'checkout' && staleDays >= 1) risks.push('checkout sin avance');
  if (st === 'proposal' && staleDays >= 2) risks.push('propuesta sin respuesta');
  return risks;
}

function bestContactAt(row: any): string | null {
  const cands = [row?.last_message_at, row?.updated_at, row?.created_at]
    .filter(Boolean)
    .map(String);

  if (!cands.length) return null;

  // noUncheckedIndexedAccess: cands[0] can be string | undefined
  const first = cands[0];
  if (!first) return null;

  let best = first;
  let bestT = new Date(best).getTime();

  for (const x of cands.slice(1)) {
    const t = new Date(x).getTime();
    if (!Number.isNaN(t) && t > bestT) {
      best = x;
      bestT = t;
    }
  }
  return best;
}

function pickLatestByTime<T extends { at: string; conversationId: string | null }>(
  a: T | null,
  b: T | null,
): T | null {
  if (!a) return b;
  if (!b) return a;
  const ta = new Date(a.at).getTime();
  const tb = new Date(b.at).getTime();
  if (Number.isNaN(ta)) return b;
  if (Number.isNaN(tb)) return a;
  return ta >= tb ? a : b;
}

function unwrapRel<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return (v[0] ?? null) as any;
  return v;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      stage: url.searchParams.get('stage') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { stage, limit } = parsed.data;

    const admin = getSupabaseAdmin() as any;

    let q = admin
      .from('deals')
      .select(
        'id,lead_id,customer_id,tour_slug,title,stage,amount_minor,currency,probability,assigned_to,created_at,updated_at,closed_at,' +
          'leads:leads(email,whatsapp),' +
          'customers:customers(email,name,phone,country)',
      )
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (stage) q = q.eq('stage', stage);
    else q = q.not('stage', 'in', '(won,lost)');

    const dealsRes = await q;
    if (dealsRes.error) throw dealsRes.error;

    const deals = (dealsRes.data ?? []) as any[];
    const ids = deals.map((d) => d.id).filter(Boolean);

    // Tasks
    const tasksByDeal: Record<string, any[]> = {};
    if (ids.length) {
      const tasksRes = await admin
        .from('tasks')
        .select('id,deal_id,title,status,priority,due_at,created_at')
        .in('deal_id', ids)
        .in('status', ['open', 'in_progress'])
        .order('due_at', { ascending: true, nullsFirst: false });

      if (!tasksRes.error) {
        for (const t of (tasksRes.data ?? []) as any[]) {
          const did = String(t.deal_id || '');
          if (!did) continue;
          (tasksByDeal[did] ||= []).push(t);
        }
      }
    }

    // Contact freshness + conversations (via tickets)
    const leadIds = Array.from(new Set(deals.map((d) => d.lead_id).filter(Boolean).map(String)));
    const custIds = Array.from(new Set(deals.map((d) => d.customer_id).filter(Boolean).map(String)));

    const lastByLead: Record<string, { at: string; conversationId: string | null }> = {};
    const lastByCustomer: Record<string, { at: string; conversationId: string | null }> = {};

    function ingestTicketRow(row: any) {
      const at = bestContactAt(row);
      if (!at) return;
      const convId = row?.conversation_id ? String(row.conversation_id) : null;

      if (row?.lead_id) {
        const lid = String(row.lead_id);
        const prev = lastByLead[lid] ?? null;
        lastByLead[lid] = pickLatestByTime(prev, { at, conversationId: convId }) ?? { at, conversationId: convId };
      }
      if (row?.customer_id) {
        const cid = String(row.customer_id);
        const prev = lastByCustomer[cid] ?? null;
        lastByCustomer[cid] = pickLatestByTime(prev, { at, conversationId: convId }) ?? { at, conversationId: convId };
      }
    }

    if (leadIds.length) {
      const r = await admin
        .from('tickets')
        .select('lead_id,customer_id,conversation_id,last_message_at,updated_at,created_at')
        .in('lead_id', leadIds)
        .limit(2500);
      if (!r.error) for (const row of (r.data ?? []) as any[]) ingestTicketRow(row);
    }

    if (custIds.length) {
      const r = await admin
        .from('tickets')
        .select('lead_id,customer_id,conversation_id,last_message_at,updated_at,created_at')
        .in('customer_id', custIds)
        .limit(2500);
      if (!r.error) for (const row of (r.data ?? []) as any[]) ingestTicketRow(row);
    }

    const convIds = Array.from(
      new Set(
        Object.values(lastByLead)
          .concat(Object.values(lastByCustomer))
          .map((x) => x?.conversationId)
          .filter((x): x is string => Boolean(x))
          .map(String),
      ),
    );

    const localeByConv: Record<string, string> = {};
    if (convIds.length) {
      const r = await admin.from('conversations').select('id,locale').in('id', convIds).limit(2500);
      if (!r.error) {
        for (const row of (r.data ?? []) as any[]) {
          localeByConv[String(row.id)] = String(row.locale || 'es');
        }
      }
    }

    const lastUserMsgByConv: Record<string, string> = {};
    const lastAgentMsgByConv: Record<string, string> = {};

    if (convIds.length) {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
      const r = await admin
        .from('messages')
        .select('conversation_id,role,created_at')
        .in('conversation_id', convIds)
        .gte('created_at', sixtyDaysAgo)
        .limit(5000);

      if (!r.error) {
        for (const m of (r.data ?? []) as any[]) {
          const cid = String(m.conversation_id || '');
          if (!cid) continue;
          const role = String(m.role || '').toLowerCase();
          const at = String(m.created_at || '');
          if (!at) continue;

          if (role === 'user') {
            const prev = lastUserMsgByConv[cid];
            if (!prev || new Date(at).getTime() > new Date(prev).getTime()) lastUserMsgByConv[cid] = at;
          } else {
            const prev = lastAgentMsgByConv[cid];
            if (!prev || new Date(at).getTime() > new Date(prev).getTime()) lastAgentMsgByConv[cid] = at;
          }
        }
      }
    }

    const now = new Date();

    const items = deals.map((d) => {
      const did = String(d.id);
      const tasks = tasksByDeal[did] || [];
      const overdue = tasks.filter((t) => t?.due_at && new Date(t.due_at).getTime() < now.getTime()).length;

      const nextTask = tasks.find((t) => t?.due_at) || tasks[0] || null;

      let nextAction = nextTask?.title ? String(nextTask.title) : '';
      if (!nextAction) {
        const st = String(d.stage || '').toLowerCase();
        if (st === 'new' || st === 'qualified') nextAction = 'Enviar propuesta';
        else if (st === 'proposal') nextAction = 'Enviar link de pago';
        else if (st === 'checkout') nextAction = 'Revisar pago';
        else nextAction = 'Seguir';
      }

      const createdAt = String(d.created_at || d.updated_at || new Date().toISOString());
      const updatedAt = String(d.updated_at || createdAt);
      const ageDays = daysBetween(createdAt, now);
      const staleDays = daysBetween(updatedAt, now);

      // Contact staleness from tickets
      let contactAt: string | null = null;
      let convId: string | null = null;

      if (d.lead_id && lastByLead[String(d.lead_id)]) {
        const leadContact = lastByLead[String(d.lead_id)];
        if (leadContact) {
          contactAt = leadContact.at;
          convId = leadContact.conversationId;
        }
      }
      if (!contactAt && d.customer_id && lastByCustomer[String(d.customer_id)]) {
        const customerContact = lastByCustomer[String(d.customer_id)];
        if (customerContact) {
          contactAt = customerContact.at;
          convId = customerContact.conversationId;
        }
      }

      const contactStaleDays = contactAt ? daysBetween(contactAt, now) : null;
      const locale = convId ? (localeByConv[String(convId)] || 'es') : 'es';

      const lastCustomerMessageAt = convId ? (lastUserMsgByConv[String(convId)] || null) : null;
      const lastAgentMessageAt = convId ? (lastAgentMsgByConv[String(convId)] || null) : null;

      let waitingOn: 'agent' | 'customer' | null = null;
      let waitingDays: number | null = null;

      if (lastCustomerMessageAt && lastAgentMessageAt) {
        if (new Date(lastCustomerMessageAt).getTime() > new Date(lastAgentMessageAt).getTime()) {
          waitingOn = 'agent';
          waitingDays = daysBetween(lastCustomerMessageAt, now);
        } else {
          waitingOn = 'customer';
          waitingDays = daysBetween(lastAgentMessageAt, now);
        }
      } else if (lastCustomerMessageAt && !lastAgentMessageAt) {
        waitingOn = 'agent';
        waitingDays = daysBetween(lastCustomerMessageAt, now);
      } else if (!lastCustomerMessageAt && lastAgentMessageAt) {
        waitingOn = 'customer';
        waitingDays = daysBetween(lastAgentMessageAt, now);
      }

      const score = computeScore({
        stage: String(d.stage || ''),
        staleDays,
        overdueTasks: overdue,
        hasAmount: typeof d.amount_minor === 'number' && Number.isFinite(d.amount_minor),
        assigned: Boolean(d.assigned_to),
        contactStaleDays,
        waitingOn,
        waitingDays,
      });

      const risk = computeRisk(String(d.stage || ''), staleDays, overdue, contactStaleDays, waitingOn, waitingDays);

      // Supabase embedded rows can be object or array; normalize
      const lead = unwrapRel<any>(d.leads);
      const customerRow = unwrapRel<any>(d.customers);

      const customer = {
        name: customerRow?.name ?? null,
        email: customerRow?.email ?? lead?.email ?? null,
        whatsapp: lead?.whatsapp ?? customerRow?.phone ?? null,
      };

      return {
        id: did,
        stage: d.stage ?? null,
        title: d.title ?? null,
        tour_slug: d.tour_slug ?? null,
        probability: d.probability ?? null,
        amount_minor: d.amount_minor ?? null,
        currency: d.currency ?? null,
        assigned_to: d.assigned_to ?? null,
        created_at: d.created_at ?? null,
        updated_at: d.updated_at ?? null,
        age_days: ageDays,
        stale_days: staleDays,
        last_contact_at: contactAt,
        contact_stale_days: contactStaleDays,
        last_customer_message_at: lastCustomerMessageAt,
        last_agent_message_at: lastAgentMessageAt,
        waiting_on: waitingOn,
        waiting_days: waitingDays,
        locale,
        open_tasks: tasks.length,
        overdue_tasks: overdue,
        score,
        risk,
        next_task: nextTask ? { id: String(nextTask.id), title: String(nextTask.title), due_at: nextTask.due_at ?? null } : null,
        next_action: nextAction,
        customer,
      };
    });

    void logEvent(
      'crm.sales_cockpit.view',
      { requestId, stage: stage ?? null, count: items.length },
      { source: 'crm', dedupeKey: `crm:sales_cockpit:${requestId}` },
    );

    return NextResponse.json({ ok: true, items, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    void logEvent('api.error', { requestId, route: '/api/admin/sales/cockpit', error: msg }, { source: 'api' });

    return NextResponse.json(
      { ok: false, error: msg, requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
