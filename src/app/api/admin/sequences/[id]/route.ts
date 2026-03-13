// src/app/api/admin/sequences/[id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getSequence, replaceSteps } from '@/lib/sequences.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const StepsSchema = z
  .object({
    steps: z
      .array(
        z
          .object({
            step_index: z.number().int().min(0).max(50),
            delay_minutes: z.number().int().min(0).max(60 * 24 * 30).optional(),
            channel: z.enum(['email', 'whatsapp']),
            template_key: z.string().max(120).optional().nullable(),
            template_variant: z.string().max(120).optional().nullable(),
            subject: z.string().max(200).optional().nullable(),
            body: z.string().min(1).max(5000),
            metadata: z.any().optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict();

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const data = await getSequence(id);

  if (!data) {
    return NextResponse.json(
      { ok: false, error: 'Not found', requestId },
      { status: 404, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, ...data, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = StepsSchema.parse(await req.json());

  await replaceSteps(id, body.steps as any);

  return NextResponse.json(
    { ok: true, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  // Si te da `never` por types de Supabase, este cast lo evita
  const admin = getSupabaseAdmin() as any;

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin not configured', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const res = await admin.from('crm_sequences').delete().eq('id', id);

  if (res.error) {
    return NextResponse.json(
      { ok: false, error: res.error.message, requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
