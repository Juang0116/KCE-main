// src/app/api/admin/sequences/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { listSequences, upsertSequence, getEnrollmentStats } from '@/lib/sequences.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    key: z.string().min(2).max(80),
    name: z.string().min(2).max(120),
    status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
    description: z.string().max(500).optional().nullable(),
    segment_key: z.string().max(120).optional().nullable(),
    entry_event: z.string().max(120).optional().nullable(),
    channel: z.enum(['email', 'whatsapp', 'mixed']).optional(),
    locale: z.string().max(10).optional().nullable(),
  })
  .strict();

// ✅ con exactOptionalPropertyTypes: NO pasar propiedades undefined
function pickDefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const [items, stats] = await Promise.all([listSequences(), getEnrollmentStats()]);
  const itemsWithStats = items.map((s) => ({
    ...s,
    enrollments: stats[s.id] ?? { active: 0, completed: 0, failed: 0 },
  }));

  return NextResponse.json(
    { ok: true, items: itemsWithStats, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const body = UpsertSchema.parse(await req.json());

  // ✅ elimina undefineds (incluye id/status/etc.)
  const clean = pickDefined(body);

  // Nota: `key` y `name` siempre existen por schema
  const item = await upsertSequence(clean as any);

  return NextResponse.json(
    { ok: true, item, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
