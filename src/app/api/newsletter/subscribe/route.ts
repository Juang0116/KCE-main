// src/app/api/newsletter/subscribe/route.ts
import 'server-only';

import crypto from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { assertAllowedOriginOrReferer } from '@/lib/requestGuards.server';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { verifyTurnstile } from '@/lib/turnstile.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { readUtmFromCookies, utmCompactKey } from '@/lib/utm.server';
import { sendNewsletterConfirmEmail } from '@/services/marketingEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  email: z
    .string()
    .email()
    .transform((s) => s.trim().toLowerCase()),
  source: z.preprocess((v) => (v == null ? undefined : v), z.string().max(80)).optional(),
  utm: z.preprocess((v) => (v == null ? undefined : v), z.record(z.any())).optional(),
  visitorId: z.preprocess((v) => (v == null ? undefined : v), z.string().max(120)).optional(),
  language: z.preprocess((v) => (v == null ? undefined : v), z.string().max(12)).optional(),
  turnstileToken: z.preprocess((v) => (v == null ? undefined : v), z.string().trim().max(2048)).optional(),
});

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

type NewsletterSubMini = {
  id: string;
  status: 'pending' | 'confirmed' | 'unsubscribed' | string;
};

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const originErr = assertAllowedOriginOrReferer(req, { allowMissing: false, allowInternalHmac: false });
  if (originErr) return originErr;

  const clen = contentLengthBytes(req);
  if (clen && clen > 2_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  // Rate limit: 5 subscribe attempts per hour per IP.
  const rl = await checkRateLimit(req, {
    action: 'newsletter.subscribe',
    limit: 5,
    windowSeconds: 3600,
    identity: 'ip',
  });
  if (!rl.allowed) {
    void logEvent('api.rate_limited', {
      request_id: requestId,
      route: '/api/newsletter/subscribe',
      action: 'newsletter.subscribe',
      key_base: rl.keyBase,
    });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      requestId,
    });
  }

  const utmInfo = readUtmFromCookies(req);
  const utmKey = utmCompactKey(utmInfo);
  const bucket = Math.floor(Date.now() / 5000);

  try {
    const json = await req.json().catch(() => null);
    const body = BodySchema.parse(json ?? {});

    const ts = await verifyTurnstile(req, body.turnstileToken);
    if (!ts.ok) {
      return jsonError(req, {
        status: 403,
        code: 'TURNSTILE_FAILED',
        message: 'Turnstile verification failed.',
        requestId,
      });
    }

    const adminRaw = getSupabaseAdmin();
    if (!adminRaw) {
      // No rompas UX: responde 503 controlado
      return jsonError(req, {
        status: 503,
        code: 'CONFIG_ERROR',
        message: 'Supabase admin not configured.',
        requestId,
      });
    }

    // ⛑️ Hotfix: tipos Supabase desalineados -> TS infiere never. Cast controlado.
    const admin = adminRaw as any;

    // Tokens en claro solo para email; en DB guardamos hashes.
    const confirmToken = newToken();
    const unsubscribeToken = newToken();

    const confirmHash = sha256Hex(confirmToken);
    const unsubscribeHash = sha256Hex(unsubscribeToken);

    const nowIso = new Date().toISOString();

    const existingQ = await admin
      .from('newsletter_subscriptions')
      .select('id,status')
      .eq('email', body.email)
      .maybeSingle();

    if (existingQ?.error) throw existingQ.error;

    const existing = (existingQ?.data as NewsletterSubMini | null | undefined) ?? null;

    if (!existing) {
      const ins = await admin.from('newsletter_subscriptions').insert(
        {
          email: body.email,
          status: 'pending',
          confirm_token_hash: confirmHash,
          unsubscribe_token_hash: unsubscribeHash,
          token_sent_at: nowIso,
          source: body.source ?? 'newsletter',
          utm: (body.utm ?? utmInfo ?? null) as any,
          visitor_id: body.visitorId ?? null,
        } as any,
      );
      if (ins?.error) throw ins.error;
    } else if (existing.status === 'confirmed') {
      // Ya confirmado: no cambiamos estado. Solo rotamos token de baja.
      void logEvent(
        'newsletter.already_confirmed',
        {
          request_id: requestId,
          email: body.email,
          source: body.source ?? 'newsletter',
          visitor_id: body.visitorId ?? null,
          utm_key: utmKey,
          utm_source: utmInfo.utm_source,
          utm_medium: utmInfo.utm_medium,
          utm_campaign: utmInfo.utm_campaign,
        },
        { source: 'api/newsletter/subscribe' },
      );

      const upd = await admin
        .from('newsletter_subscriptions')
        .update(
          {
            unsubscribe_token_hash: unsubscribeHash,
            token_sent_at: nowIso,
          } as any,
        )
        .eq('id', existing.id);
      if (upd?.error) throw upd.error;
    } else {
      // pending o unsubscribed: re-pend y rota tokens
      const upd = await admin
        .from('newsletter_subscriptions')
        .update(
          {
            status: 'pending',
            confirm_token_hash: confirmHash,
            unsubscribe_token_hash: unsubscribeHash,
            token_sent_at: nowIso,
            source: body.source ?? 'newsletter',
            utm: (body.utm ?? null) as any,
            visitor_id: body.visitorId ?? null,
          } as any,
        )
        .eq('id', existing.id);
      if (upd?.error) throw upd.error;
    }

    // exactOptionalPropertyTypes: NO pasar language: undefined
    const language = body.language?.trim() || undefined;

    await sendNewsletterConfirmEmail({
      to: body.email,
      confirmToken,
      unsubscribeToken,
      ...(language ? { language } : {}),
    });

    void logEvent(
      'newsletter.signup_pending',
      {
        requestId,
        email: body.email,
        source: body.source ?? 'newsletter',
        vid: utmInfo.vid,
        utm_key: utmKey,
        utm_source: utmInfo.utm_source,
        utm_medium: utmInfo.utm_medium,
        utm_campaign: utmInfo.utm_campaign,
      },
      {
        source: 'api/newsletter/subscribe',
        dedupeKey: `newsletter:pending:${body.email}:${bucket}`,
      },
    );

    return NextResponse.json({ ok: true, requestId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    await logEvent(
      'api.error',
      { route: 'api/newsletter/subscribe', requestId, message },
      { source: 'api/newsletter/subscribe' },
    );

    return NextResponse.json({ ok: false, requestId, error: 'Bad request' }, { status: 400 });
  }
}
