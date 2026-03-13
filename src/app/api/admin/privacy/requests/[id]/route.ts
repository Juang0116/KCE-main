// src/app/api/admin/privacy/requests/[id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z
  .object({
    status: z.enum(['open', 'in_progress', 'done', 'rejected']).optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const { id } = await params;

  const auth = await requireAdminCapability(req, 'privacy.manage');
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid JSON' },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  // IMPORTANT: exactOptionalPropertyTypes -> no mandar undefined
  const patch: { status?: string; notes?: string; processed_at?: string | null } = {};

  if (parsed.data.status !== undefined) {
    patch.status = parsed.data.status;

    const isFinal = parsed.data.status === 'done' || parsed.data.status === 'rejected';
    patch.processed_at = isFinal ? new Date().toISOString() : null;
  }

  if (parsed.data.notes !== undefined) {
    patch.notes = parsed.data.notes;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { ok: true, requestId, id },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  const sb = getSupabaseAdmin();

  // IMPORTANT: tipos Supabase desalineados => "never". Cast puntual.
  const { error } = await (sb as any).from('privacy_requests').update(patch).eq('id', id);

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId, id },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
