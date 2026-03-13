// src/app/api/lead-magnets/eu-guide/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { corsHeaders, corsPreflight } from '@/lib/cors';
import { absUrl } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { assertAllowedOriginOrReferer, assertPayloadSize } from '@/lib/requestGuards.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { verifyTurnstile } from '@/lib/turnstile.server';
import { sendLeadMagnetEuGuideEmail } from '@/services/marketingEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({
  email: z.string().email(),
  consent: z.coerce.boolean(),
  token: z.string().trim().optional(), // Turnstile token (optional)
});

function json(req: NextRequest, data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders(req, { methods: 'POST,OPTIONS' }) },
  });
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req, { methods: 'POST,OPTIONS' });
}

export async function POST(req: NextRequest) {
  const requestId = globalThis.crypto?.randomUUID?.() || String(Date.now());

  // Guardrails
  // NOTE: requestGuards helpers return `NextResponse | null`.
  // We allow missing Origin/Referer in dev to avoid local/browser edge-cases.
  const originRes = assertAllowedOriginOrReferer(req, {
    allowMissing: process.env.NODE_ENV !== 'production',
    allowInternalHmac: true,
  });
  if (originRes) return originRes;

  const sizeRes = assertPayloadSize(req, 48_000);
  if (sizeRes) return sizeRes;

  const rl = await checkRateLimit(req, {
    action: 'lead_magnet.eu_guide',
    limit: 5,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) return json(req, { ok: false, error: 'Too many requests', requestId }, 429);

  // Read body
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const parsed = Input.safeParse(raw);
  if (!parsed.success) {
    return json(req, { ok: false, error: 'Invalid body', requestId }, 400);
  }

  const email = parsed.data.email.trim().toLowerCase();
  const consent = parsed.data.consent;
  const token = (parsed.data.token || '').trim();

  if (!consent) {
    return json(req, { ok: false, error: 'Consent is required', requestId }, 400);
  }

  // Optional Turnstile
  const tv = await verifyTurnstile(req, token);
  if (!tv.ok) {
    return json(req, { ok: false, error: 'Turnstile verification failed', requestId }, 403);
  }

  const downloadUrl = '/lead-magnets/kce-eu-guide.pdf';

  // Persist as lead (best-effort)
  try {
    const sb = getSupabaseAdmin();
    // We keep this best-effort: do not fail user flow if DB insert fails.
    await sb
      .from('leads')
      .upsert(
        {
          email,
          source: 'lead_magnet',
          status: 'new',
          tags: ['lead_magnet:eu_guide'],
          // optional fields in some schemas
          notes: 'EU Guide requested',
        } as any,
        { onConflict: 'email' } as any,
      );
  } catch {
    // ignore
  }

  void logEvent(
    'lead_magnet.eu_guide.requested',
    { request_id: requestId, email },
    { source: 'web', entityId: email, dedupeKey: `lead_magnet:eu_guide:${email}` },
  );

  // Email (best-effort)
  let emailSent = false;
  try {
    await sendLeadMagnetEuGuideEmail({ to: email, downloadUrl: absUrl(downloadUrl) });
    emailSent = true;

    void logEvent(
      'email.lead_magnet.eu_guide.sent',
      { request_id: requestId, to: email },
      { source: 'api', entityId: email, dedupeKey: `email:lead_magnet:eu_guide:${email}` },
    );
  } catch (e) {
    void logEvent(
      'email.lead_magnet.eu_guide.error',
      { request_id: requestId, to: email, message: e instanceof Error ? e.message : String(e) },
      { source: 'api' },
    );
  }

  return json(req, { ok: true, downloadUrl, emailSent, requestId }, 200);
}
