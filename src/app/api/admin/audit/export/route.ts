// src/app/api/admin/audit/export/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const QuerySchema = z.object({
  tab: z.enum(['admin', 'security']).default('admin'),
  kind: z.string().max(120).optional(),
  actor: z.string().max(120).optional(),
  created_from: Ymd.optional(),
  created_to: Ymd.optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
});

function ymdToIsoStart(ymd: string) {
  return `${ymd}T00:00:00.000Z`;
}

function ymdToIsoEndExclusive(ymd: string) {
  const [ys, ms, ds] = ymd.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return `${ymd}T00:00:00.000Z`;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[\n\r,\"]/g.test(s)) {
    return `"${s.replace(/\"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'admin.export.audit',
    limit: 6,
    windowSeconds: 60,
    identity: 'ip+vid',
    failOpen: true,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests', code: 'RATE_LIMIT', retryAfterSeconds: rl.retryAfterSeconds ?? 60, requestId },
      { status: 429, headers: withRequestId({ 'Retry-After': String(rl.retryAfterSeconds ?? 60) }, requestId) },
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      tab: (url.searchParams.get('tab') || 'admin').toLowerCase(),
      kind: url.searchParams.get('kind') ?? undefined,
      actor: url.searchParams.get('actor') ?? undefined,
      created_from: url.searchParams.get('from') ?? url.searchParams.get('created_from') ?? undefined,
      created_to: url.searchParams.get('to') ?? url.searchParams.get('created_to') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { tab, kind, actor, created_from, created_to, limit } = parsed.data;

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        { error: 'Supabase Admin not configured', requestId },
        { status: 503, headers: withRequestId(undefined, requestId) },
      );
    }

    const isSecurity = tab === 'security';

    // NOTE:
    // Estas tablas pueden no estar incluidas en los tipos generados de Supabase.
    // Para evitar que el build falle por el overload de `from()`, hacemos el branch
    // con literales y un cast mínimo.
    const max = Math.max(1, Math.min(5000, limit));
    let q = (isSecurity
      ? sb.from('security_events' as any)
      : sb.from('admin_audit_events' as any)
    )
      .select('*')
      .order('created_at', { ascending: false })
      .limit(max);


    if (kind) {
      q = isSecurity ? q.eq('kind', kind) : q.eq('action', kind);
    }
    if (actor) q = q.eq('actor', actor);

    if (created_from) q = q.gte('created_at', ymdToIsoStart(created_from));
    if (created_to) q = q.lt('created_at', ymdToIsoEndExclusive(created_to));

    const res = await q;
    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/audit/export', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const rows = (res.data || []) as any[];

    await logEvent(
      'admin.audit_exported',
      {
        request_id: requestId,
        tab,
        count: rows.length,
        filters: { kind: kind ?? null, actor: actor ?? null, created_from: created_from ?? null, created_to: created_to ?? null },
      },
      { source: 'admin' },
    );

    const header = isSecurity
      ? ['created_at', 'severity', 'kind', 'actor', 'method', 'path', 'request_id', 'ip', 'user_agent', 'meta_json'].join(',')
      : ['created_at', 'action', 'actor', 'capability', 'method', 'path', 'request_id', 'ip', 'user_agent', 'meta_json'].join(',');

    const lines = [header];

    for (const r of rows) {
      const meta = r.meta ?? {};
      if (isSecurity) {
        lines.push(
          [
            csvEscape(r.created_at),
            csvEscape(r.severity),
            csvEscape(r.kind),
            csvEscape(r.actor),
            csvEscape(r.method),
            csvEscape(r.path),
            csvEscape(r.request_id),
            csvEscape(r.ip),
            csvEscape(r.user_agent),
            csvEscape(JSON.stringify(meta)),
          ].join(','),
        );
      } else {
        lines.push(
          [
            csvEscape(r.created_at),
            csvEscape(r.action),
            csvEscape(r.actor),
            csvEscape(r.capability),
            csvEscape(r.method),
            csvEscape(r.path),
            csvEscape(r.request_id),
            csvEscape(r.ip),
            csvEscape(r.user_agent),
            csvEscape(JSON.stringify(meta)),
          ].join(','),
        );
      }
    }

    const csv = `\uFEFF${lines.join('\n')}`;
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${tab}_audit_${ts}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        ...withRequestId(undefined, requestId),
      },
    });
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/audit/export', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unknown error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
