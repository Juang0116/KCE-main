// src/app/api/admin/segments/[id]/run/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { normalizeCommaTags } from '@/lib/normalize';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

type SegmentEntityType = 'leads' | 'customers';

type SegmentRow = {
  id: string;
  entity_type: SegmentEntityType;
  filter: unknown;
};

function safeString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

function asObj(v: unknown): Record<string, unknown> {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = ParamsSchema.parse(await ctx.params);

    // ✅ FIX: cuando Supabase types están desalineados, TS infiere `never`.
    // Cast controlado para no bloquear build. (Luego lo quitamos al regenerar Database)
    const admin = getSupabaseAdmin() as any;

    const segRes = (await admin
      .from('segments')
      .select('id,entity_type,filter')
      .eq('id', id)
      .single()) as { data: SegmentRow | null; error: { message: string } | null };

    if (segRes.error || !segRes.data) {
      return NextResponse.json(
        { error: 'Not found', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const seg = segRes.data;
    const filter = asObj(seg.filter);
    let count: number | null = null;

    if (seg.entity_type === 'leads') {
      let q = admin.from('leads').select('id', { count: 'exact', head: true });

      const stage = safeString(filter.stage);
      const source = safeString(filter.source);
      const tags = Array.isArray(filter.tags)
        ? ((filter.tags as unknown[]).filter((x) => typeof x === 'string') as string[])
        : normalizeCommaTags(filter.tags);
      const search = safeString(filter.q);

      if (stage) q = q.eq('stage', stage);
      if (source) q = q.eq('source', source);
      if (tags.length) q = q.contains('tags', tags.slice(0, 10));
      if (search) q = q.or(`email.ilike.%${search}%,whatsapp.ilike.%${search}%`);

      const res = (await q) as { count: number | null; error: { message: string } | null };
      if (res.error) throw new Error(res.error.message);
      count = res.count ?? null;
    } else {
      let q = admin.from('customers').select('id', { count: 'exact', head: true });

      const country = safeString(filter.country);
      const language = safeString(filter.language);
      const search = safeString(filter.q);

      if (country) q = q.eq('country', country);
      if (language) q = q.eq('language', language);
      if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`);

      const res = (await q) as { count: number | null; error: { message: string } | null };
      if (res.error) throw new Error(res.error.message);
      count = res.count ?? null;
    }

    const now = new Date().toISOString();

    // ✅ FIX: update también caía a `never` por el mismo motivo.
    await admin
      .from('segments')
      .update({ last_run_at: now, last_run_count: count })
      .eq('id', id);

    await logEvent(
      'segment.run',
      { requestId, segmentId: id, entity_type: seg.entity_type, count, filter },
      { source: 'crm', entityId: id, dedupeKey: `segment:run:${id}:${requestId}` },
    );

    return NextResponse.json(
      { ok: true, id, count, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/segments/[id]/run',
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
