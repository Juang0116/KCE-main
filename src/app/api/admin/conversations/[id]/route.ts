// src/app/api/admin/conversations/[id]/route.ts
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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = ParamsSchema.parse(await ctx.params);

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase admin not configured', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const convRes = await (admin as any)
      .from('conversations')
      .select(
        'id,channel,locale,status,closed_at,created_at,updated_at,lead_id,customer_id,leads(id,email,whatsapp,source,stage,language),customers(id,email,name,phone,country,language)',
      )
      .eq('id', id)
      .single();

    const conversation: any = convRes?.data ?? null;

    if (convRes?.error || !conversation) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/admin/conversations/[id]',
          message: convRes?.error?.message || 'not found',
          id,
        },
        { source: 'api' },
      );

      return NextResponse.json(
        { error: 'Not found', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const msgRes = await (admin as any)
      .from('messages')
      .select('id,role,content,meta,created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    const messages: any[] = Array.isArray(msgRes?.data) ? msgRes.data : [];

    if (msgRes?.error) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/admin/conversations/[id]',
          message: msgRes.error.message,
          id,
        },
        { source: 'api' },
      );

      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { conversation, messages, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/conversations/[id]',
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
