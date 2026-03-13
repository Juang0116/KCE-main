// src/app/api/admin/tasks/[id]/route.ts
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

/**
 * Nota importante:
 * - Con `exactOptionalPropertyTypes: true` NO podemos pasar propiedades con `undefined`
 *   a `.update()`. Por eso filtramos undefined con `pickDefined`.
 * - Además, tu `Database` generado aún NO contiene la tabla "tasks", así que tipamos
 *   `admin` como `any` para que el build no falle.
 */
const PatchSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    status: z.enum(['open', 'in_progress', 'done', 'canceled']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    assigned_to: z.string().trim().max(200).optional().nullable(),
    due_at: z.string().datetime().optional().nullable(),

    // Si tu tabla lo tiene:
    deal_id: z.string().uuid().optional().nullable(),
    ticket_id: z.string().uuid().optional().nullable(),

    notes: z.string().max(4000).optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

function pickDefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = ParamsSchema.parse(await ctx.params);

    const admin = getSupabaseAdmin() as any;

    const res = await admin.from('tasks').select('*').eq('id', id).single();
    if (res.error) {
      return NextResponse.json(
        { error: 'Not found', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { item: res.data, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/tasks/[id]',
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

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = ParamsSchema.parse(await ctx.params);

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const patch = pickDefined(parsed.data);
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { ok: true, id, requestId, unchanged: true },
        { status: 200, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin() as any;

    const upd = await admin.from('tasks').update(patch).eq('id', id).select('id').single();
    if (upd.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/tasks/[id]', message: upd.error.message, id },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent(
      'task.updated',
      { requestId, id, patch },
      { source: 'crm', entityId: id, dedupeKey: `task:updated:${id}:${requestId}` },
    );

    return NextResponse.json(
      { ok: true, id, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/tasks/[id]',
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

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = ParamsSchema.parse(await ctx.params);

    const admin = getSupabaseAdmin() as any;

    const del = await admin.from('tasks').delete().eq('id', id);
    if (del.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/tasks/[id]', message: del.error.message, id },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent(
      'task.deleted',
      { requestId, id },
      { source: 'crm', entityId: id, dedupeKey: `task:deleted:${id}` },
    );

    return NextResponse.json(
      { ok: true, id, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/tasks/[id]',
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
