// src/app/api/admin/ops/backups/run/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z
  .object({
    kind: z.enum(['db', 'storage', 'config']).optional(),
    provider: z.string().trim().max(80).optional(),
    location: z.string().trim().max(200).optional(),
    ok: z.boolean().optional(),
    message: z.string().trim().max(500).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminCapability(req, 'ops.manage');
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  // ✅ Workaround sólido para el TS "never" mientras regeneras/alineas tipos Supabase:
  // Si Database no incluye ops_backups_log, Supabase TS infiere never en insert/select.
  const admin = getSupabaseAdmin() as any;

  const row = {
    kind: parsed.data.kind ?? 'db',
    provider: parsed.data.provider ?? null,
    location: parsed.data.location ?? null,
    ok: parsed.data.ok ?? true,
    message: parsed.data.message ?? null,
  };

  const { error } = await admin.from('ops_backups_log').insert(row);

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
