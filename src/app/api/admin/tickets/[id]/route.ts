// src/app/api/admin/tickets/[id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

const PatchSchema = z.object({
  // NOTE: DB allows 'in_progress' (see supabase_patch_p34_tickets_constraints.sql)
  status: z.enum(['open', 'pending', 'in_progress', 'resolved']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  subject: z.string().trim().min(1).max(300).optional(),
  summary: z.string().trim().min(1).max(2000).nullable().optional(),
});

function pickDefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const adminRaw = getSupabaseAdmin();
  if (!adminRaw) {
    return NextResponse.json(
      { error: 'Supabase admin not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  // ✅ Evita errores TS cuando los tipos de Supabase no están alineados con DB
  const admin = adminRaw as any;

  const { id } = ParamsSchema.parse(await ctx.params);

  // Ticket + joins (owner + conversation metadata)
  const t: any = await admin
    .from('tickets')
    .select(
      [
        'id',
        'lead_id',
        'customer_id',
        'conversation_id',
        'subject',
        'summary',
        'status',
        'priority',
        'channel',
        'assigned_to',
        'last_message_at',
        'created_at',
        'updated_at',
        'closed_at',
        'resolved_at',
        'leads(email,whatsapp)',
        'customers(name,email,phone,country)',
        'conversations(channel,locale,status,closed_at)',
      ].join(','),
    )
    .eq('id', id)
    .maybeSingle();

  if (t.error) {
    return NextResponse.json(
      { error: 'DB error', supabase: { message: t.error.message, code: t.error.code }, requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
  if (!t.data) {
    return NextResponse.json(
      { error: 'Ticket not found', requestId },
      { status: 404, headers: withRequestId(undefined, requestId) },
    );
  }

  const conversationId = String((t.data as any)?.conversation_id ?? '').trim();
  if (!conversationId) {
    return NextResponse.json(
      { ticket: t.data, conversation: null, messages: [], requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  const msgs: any = await admin
    .from('messages')
    .select('id,role,content,meta,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (msgs.error) {
    return NextResponse.json(
      { ticket: t.data, messages: [], requestId, messagesError: msgs.error.message },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ticket: t.data, messages: msgs.data ?? [], requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const adminRaw = getSupabaseAdmin();
  if (!adminRaw) {
    return NextResponse.json(
      { error: 'Supabase admin not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = adminRaw as any;

  const { id } = ParamsSchema.parse(await ctx.params);

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const patch = pickDefined(parsed.data) as any;

  if (patch.status === 'resolved') {
    patch.resolved_at = new Date().toISOString();
    patch.closed_at = patch.closed_at ?? new Date().toISOString();
  }
  if (patch.status && patch.status !== 'resolved') {
    patch.resolved_at = null;
    patch.closed_at = null;
  }

  const up: any = await admin
    .from('tickets')
    .update(patch)
    .eq('id', id)
    .select(
      'id,lead_id,customer_id,conversation_id,subject,summary,status,priority,channel,assigned_to,last_message_at,created_at,updated_at,closed_at,resolved_at',
    )
    .maybeSingle();

  if (up.error) {
    return NextResponse.json(
      {
        error: 'DB error',
        supabase: { message: up.error.message, code: up.error.code },
        requestId,
      },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
  if (!up.data) {
    return NextResponse.json(
      { error: 'Ticket not found', requestId },
      { status: 404, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, ticket: up.data, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
