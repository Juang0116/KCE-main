// src/app/api/admin/templates/route.ts
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
  key: z.string().min(1).optional(),
  locale: z.string().min(2).optional(),
  channel: z.string().min(1).optional(),
  enabled: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(10).max(500).default(200),
});

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1),
  locale: z.string().min(2).default('es'),
  channel: z.enum(['whatsapp', 'email', 'any']).default('whatsapp'),
  variant: z.string().min(1).default('A'),
  weight: z.coerce.number().int().min(1).default(1),
  subject: z.string().max(2000).optional().nullable(),
  body: z.string().min(1).max(20000),
  enabled: z.boolean().default(true),
});

function pickDefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const admin0 = getSupabaseAdmin();
  if (!admin0) {
    return NextResponse.json(
      { error: 'Supabase admin not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  // ✅ FIX: evitar `never` por types Supabase desalineados
  const admin = admin0 as any;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { key, locale, channel, enabled, limit } = parsed.data;

  try {
    let q = admin
      .from('crm_templates')
      .select(
        'id,key,locale,channel,variant,weight,weight_source,weight_updated_at,subject,body,enabled,created_at,updated_at',
      )
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (key) q = q.eq('key', key);
    if (locale) q = q.eq('locale', locale.toLowerCase());
    if (channel) q = q.eq('channel', channel);
    if (enabled) q = q.eq('enabled', enabled === 'true');

    const res = await q;
    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/templates', message: res.error.message },
        { source: 'api', dedupeKey: `api.error:/api/admin/templates:${requestId}` },
      );
      return NextResponse.json(
        { error: 'Query failed', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { items: res.data ?? [], requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/templates', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api', dedupeKey: `api.error:/api/admin/templates:${requestId}` },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const admin0 = getSupabaseAdmin();
  if (!admin0) {
    return NextResponse.json(
      { error: 'Supabase admin not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  // ✅ FIX: evitar `never` por types Supabase desalineados
  const admin = admin0 as any;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const parsed = UpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const body = parsed.data;

  try {
    const rowBase = {
      id: body.id, // puede ser undefined -> lo quitamos con pickDefined
      key: body.key,
      locale: body.locale.toLowerCase(),
      channel: body.channel,
      variant: String(body.variant ?? 'A').toUpperCase(),
      weight: Number(body.weight ?? 1),
      weight_source: 'manual',
      weight_updated_at: new Date().toISOString(),
      subject: body.subject ?? null,
      body: body.body,
      enabled: body.enabled,
    };

    // ✅ FIX: NO mandar id: undefined (y en general props undefined)
    const row = pickDefined(rowBase);

    const res = await admin
      .from('crm_templates')
      .upsert(row, { onConflict: 'key,locale,channel,variant' })
      .select(
        'id,key,locale,channel,variant,weight,weight_source,weight_updated_at,subject,body,enabled,created_at,updated_at',
      )
      .single();

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/templates', message: res.error.message },
        { source: 'api', dedupeKey: `api.error:/api/admin/templates:${requestId}` },
      );
      return NextResponse.json(
        { error: 'Upsert failed', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent(
      'admin.template_upsert',
      { requestId, key: (row as any).key, locale: (row as any).locale, channel: (row as any).channel, enabled: (row as any).enabled },
      { source: 'admin', entityId: res.data?.id ?? null, dedupeKey: null },
    );

    return NextResponse.json(
      { item: res.data, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/templates', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api', dedupeKey: `api.error:/api/admin/templates:${requestId}` },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
