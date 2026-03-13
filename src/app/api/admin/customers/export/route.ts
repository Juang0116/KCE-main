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
  q: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
});

function toCsvValue(v: unknown) {
  const s = String(v ?? '');
  if (/[\n\r",]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'admin.export.customers',
    limit: 10,
    windowSeconds: 60,
    identity: 'ip+vid',
    failOpen: true,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests', code: 'RATE_LIMIT', retryAfterSeconds: rl.retryAfterSeconds ?? 60, requestId },
      {
        status: 429,
        headers: withRequestId({ 'Retry-After': String(rl.retryAfterSeconds ?? 60) }, requestId),
      },
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      q: url.searchParams.get('q') ?? undefined,
      country: url.searchParams.get('country') ?? undefined,
      language: url.searchParams.get('language') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { q, country, language, limit } = parsed.data;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Supabase admin not configured', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    // NOTE: tipado "never" en supabase sin Database → usamos any aquí para destrabar build
    let query: any = (admin as any)
      .from('customers')
      .select('id,email,name,phone,country,language,created_at')
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(5000, limit)));


    if (country) query = query.eq('country', country);
    if (language) query = query.eq('language', language);

    if (q?.trim()) {
      const qq = q.trim();
      // OR de filtros
      query = query.or(`email.ilike.%${qq}%,name.ilike.%${qq}%,phone.ilike.%${qq}%`);
    }

    const res: any = await query;

    if (res?.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/customers/export', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const headers = ['id', 'email', 'name', 'phone', 'country', 'language', 'created_at'];

    const rows = ((res?.data ?? []) as any[]).map((r: any) => [
      r?.id ?? '',
      r?.email ?? '',
      r?.name ?? '',
      r?.phone ?? '',
      r?.country ?? '',
      r?.language ?? '',
      r?.created_at ?? '',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map(toCsvValue).join(','))].join('\n');

    await logEvent(
      'export.csv',
      { request_id: requestId, entity: 'customers', count: rows.length },
      { source: 'admin' },
    );

    return new NextResponse(csv, {
      status: 200,
      headers: withRequestId(
        {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="customers_${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
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
        route: '/api/admin/customers/export',
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
