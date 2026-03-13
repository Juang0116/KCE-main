// src/app/api/admin/leads/export/route.ts
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

const QuerySchema = z.object({
  stage: z.string().optional(),
  source: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
});

type LeadRow = {
  id: string;
  email: string | null;
  whatsapp: string | null;
  source: string | null;
  language: string | null;
  stage: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
};

function toCsvValue(v: unknown) {
  const s = String(v ?? '');
  // CSV RFC-ish: quote + escape quotes
  if (/[\n\r",]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function splitTags(v?: string) {
  return (v || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'admin.export.leads',
    limit: 10,
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
      stage: url.searchParams.get('stage') ?? undefined,
      source: url.searchParams.get('source') ?? undefined,
      tags: url.searchParams.get('tags') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { stage, source, tags, q, limit } = parsed.data;
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Supabase admin not configured', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }


    // IMPORTANT: En tu proyecto, los types están resolviendo tablas como "never".
    // Esto es un workaround local: usamos el cliente como any y tipamos el resultado.
    let query = (admin as any)
      .from('leads')
      .select('id,email,whatsapp,source,language,stage,tags,notes,created_at')
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(5000, limit)));

    if (stage) query = query.eq('stage', stage);
    if (source) query = query.eq('source', source);

    const tagList = splitTags(tags);
    if (tagList.length) query = query.contains('tags', tagList);

    if (q?.trim()) {
      const qq = q.trim();
      query = query.or(`email.ilike.%${qq}%,whatsapp.ilike.%${qq}%`);
    }

    const res: { data: LeadRow[] | null; error: { message: string } | null } = await query;

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/leads/export', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const headers = [
      'id',
      'email',
      'whatsapp',
      'source',
      'language',
      'stage',
      'tags',
      'notes',
      'created_at',
    ];

    const rows = (res.data ?? []).map((r) => [
      r.id,
      r.email ?? '',
      r.whatsapp ?? '',
      r.source ?? '',
      r.language ?? '',
      r.stage ?? '',
      Array.isArray(r.tags) ? r.tags.join('|') : '',
      r.notes ?? '',
      r.created_at ?? '',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map(toCsvValue).join(','))].join('\n');

    await logEvent(
      'export.csv',
      { request_id: requestId, entity: 'leads', count: rows.length },
      { source: 'admin' },
    );

    return new NextResponse(csv, {
      status: 200,
      headers: withRequestId(
        {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="leads_${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
        requestId,
      ),
    });
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/leads/export',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
