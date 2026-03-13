// src/app/api/consent/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { assertAllowedOriginOrReferer, assertPayloadSize } from '@/lib/requestGuards.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    prefs: z
      .object({
        necessary: z.literal(true),
        analytics: z.boolean(),
        marketing: z.boolean(),
      })
      .strict(),
    page: z.string().max(300).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const payloadErr = assertPayloadSize(req, 8_192);
  if (payloadErr) return payloadErr;

  const originErr = assertAllowedOriginOrReferer(req, { allowInternalHmac: true, allowMissing: false });
  if (originErr) return originErr;

  const rl = await checkRateLimit(req, {
    action: 'consent.set',
    limit: 30,
    windowSeconds: 60,
    identity: 'ip+vid',
  });

  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        requestId,
      },
      {
        status: 429,
        headers: {
          ...withRequestId(undefined, requestId),
          ...(rl.retryAfterSeconds ? { 'Retry-After': String(rl.retryAfterSeconds) } : {}),
        },
      },
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid body',
        details: parsed.error.flatten(),
        requestId,
      },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = getSupabaseAdmin() as any;
  if (!admin) {
    // no rompas UX del banner si no está configurado
    return NextResponse.json(
      { ok: true, requestId, note: 'supabase admin not configured' },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  const body = parsed.data;

  const vid = (req.cookies.get('kce_vid')?.value || '').slice(0, 64) || null;
  const ua = (req.headers.get('user-agent') || '').slice(0, 300) || null;
  const ip =
    (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '').slice(0, 80) || null;

  // Best-effort writes (no deben tumbar el endpoint)
  try {
    if (vid) {
      await admin.from('user_consents').upsert(
        {
          vid,
          preferences: body.prefs,
          ip,
          user_agent: ua,
        },
        { onConflict: 'vid' },
      );
    }

    await admin.from('consent_events').insert({
      vid,
      kind: 'updated',
      preferences: body.prefs,
      page: body.page ?? null,
      ip,
      user_agent: ua,
    });
  } catch {
    // ignore
  }

  void logEvent('consent.updated', { requestId, vid, prefs: body.prefs, page: body.page ?? null }, { source: 'api' });

  return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
}
