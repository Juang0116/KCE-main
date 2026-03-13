// src/app/api/admin/conversations/[id]/message/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

const BodySchema = z.object({
  content: z.string().trim().min(1).max(10_000),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = ParamsSchema.parse(await ctx.params);

    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase admin not configured', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const ins = await (admin as any)
      .from('messages')
      .insert({
        conversation_id: id,
        role: 'agent',
        content: parsed.data.content,
        meta: { source: 'admin' },
      })
      .select('id,created_at')
      .single();

    const inserted: any = ins?.data ?? null;

    if (ins?.error || !inserted?.id) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/admin/conversations/[id]/message',
          message: ins?.error?.message || 'insert failed',
          id,
        },
        { source: 'api' },
      );

      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent(
      'admin.agent_message',
      { requestId, conversation_id: id, message_id: inserted.id },
      { source: 'crm', entityId: id, dedupeKey: `admin:agent_message:${inserted.id}` },
    );

    return NextResponse.json(
      { ok: true, message_id: inserted.id, created_at: inserted.created_at ?? null, requestId },
      { status: 201, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/conversations/[id]/message',
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
