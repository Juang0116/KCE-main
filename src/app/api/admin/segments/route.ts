// src/app/api/admin/segments/route.ts
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
  entity_type: z.enum(['leads', 'customers']).optional(),
});

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  entity_type: z.enum(['leads', 'customers']),
  filter: z.record(z.any()).optional().default({}),
  description: z.string().trim().max(500).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      entity_type: (url.searchParams.get('entity_type') ?? undefined) as any,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    // ✅ FIX: evita `never` por tipos Supabase desalineados
    const admin = getSupabaseAdmin() as any;

    let q = admin
      .from('segments')
      .select('id,name,entity_type,filter,description,last_run_at,last_run_count,created_at')
      .order('created_at', { ascending: false });

    if (parsed.data.entity_type) q = q.eq('entity_type', parsed.data.entity_type);

    const res = (await q) as { data: any[] | null; error: { message: string } | null };

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/segments', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
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
      {
        requestId,
        route: '/api/admin/segments',
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

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  try {
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    // ✅ FIX: evita `never` por tipos Supabase desalineados
    const admin = getSupabaseAdmin() as any;

    const ins = (await admin
      .from('segments')
      .insert({
        name: parsed.data.name,
        entity_type: parsed.data.entity_type,
        filter: parsed.data.filter ?? {},
        description: parsed.data.description ?? null,
      })
      .select('id')
      .single()) as { data: { id: string } | null; error: { message: string } | null };

    if (ins.error || !ins.data?.id) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/segments', message: ins.error?.message || 'insert failed' },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const id = ins.data.id;
    await logEvent(
      'segment.created',
      { requestId, id, entity_type: parsed.data.entity_type, name: parsed.data.name },
      { source: 'crm', entityId: id, dedupeKey: `segment:created:${id}` },
    );

    return NextResponse.json(
      { ok: true, id, requestId },
      { status: 201, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/segments',
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
