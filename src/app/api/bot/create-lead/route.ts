import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { assertAllowedOriginOrReferer } from '@/lib/requestGuards.server';
import { logEvent } from '@/lib/events.server';
import { normalizeEmail, normalizePhone } from '@/lib/normalize';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { verifyTurnstile } from '@/lib/turnstile.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function trimOrUndefined(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

const EmailSchema = z.preprocess(trimOrUndefined, z.string().email()).optional();
const TextSchema = z.preprocess(trimOrUndefined, z.string().min(1)).optional();

const BodySchema = z
  .object({
    email: EmailSchema,
    whatsapp: TextSchema,
    name: z.preprocess(trimOrUndefined, z.string().min(1)).optional(),
    source: z.preprocess(trimOrUndefined, z.string().min(1)).optional().default('chat'),
    language: z.preprocess(trimOrUndefined, z.string().min(2)).optional().default('es'),
    consent: z.literal(true),
    turnstileToken: z.preprocess(trimOrUndefined, z.string().max(2048)).optional(),
    preferences: z
      .object({
        interests: z.any().optional(),
        budget_range: z.any().optional(),
        cities: z.array(z.string().trim().min(1)).optional(),
        travel_dates: z.any().optional(),
        pax: z.number().int().positive().optional(),
      })
      .optional(),
  })
  .refine((v) => Boolean(v.email || v.whatsapp), {
    message: 'Debes enviar email o whatsapp',
    path: ['email'],
  });

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const originErr = assertAllowedOriginOrReferer(req, { allowMissing: false, allowInternalHmac: false });
  if (originErr) return originErr;

  const rl = await checkRateLimit(req, {
    action: 'bot.create_lead',
    limit: 15,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', requestId },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }

  const clen = contentLengthBytes(req);
  if (clen && clen > 6_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid body',
        errorCode: 'INVALID_INPUT',
        details: parsed.error.flatten(),
        requestId,
      },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const ts = await verifyTurnstile(req, parsed.data.turnstileToken);
  if (!ts.ok) {
    return NextResponse.json(
      { error: 'Turnstile failed', errorCode: 'TURNSTILE_FAILED', requestId },
      { status: 403, headers: withRequestId(undefined, requestId) },
    );
  }

  // ✅ Ahora usamos la conexión estricta (no más as any)
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Supabase admin not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  const normEmail = normalizeEmail(parsed.data.email) || null;
  const normWhatsapp = normalizePhone(parsed.data.whatsapp) || null;

  // Best-effort: reuse existing lead by email/whatsapp
  try {
    if (normEmail) {
      const q = await admin
        .from('leads')
        .select('id')
        .eq('email', normEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (q.data?.id) {
        return NextResponse.json(
          { ok: true, leadId: q.data.id, reused: true, requestId },
          { status: 200, headers: withRequestId(undefined, requestId) },
        );
      }
    }
  } catch {
    // ignore
  }

  // ✅ Inserción 100% tipada 
  const ins = await admin
    .from('leads')
    .insert({
      email: normEmail,
      whatsapp: normWhatsapp,
      source: parsed.data.source,
      language: parsed.data.language,
      stage: 'new',
      tags: [],
      notes: null,
      // visitor_id y utm quedarán como null si no los pasamos, lo cual es válido
    })
    .select('id')
    .single();

  if (ins.error || !ins.data?.id) {
    void logEvent(
      'api.error',
      { requestId, route: '/api/bot/create-lead', message: ins.error?.message || 'insert failed' },
      { source: 'bot' },
    );
    return NextResponse.json(
      { error: 'Failed to create lead', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const leadId = ins.data.id;

  if (parsed.data.preferences) {
    await admin
      .from('preferences')
      .upsert(
        {
          owner_type: 'lead',
          owner_id: leadId,
          interests: parsed.data.preferences.interests ?? null,
          budget_range: parsed.data.preferences.budget_range ?? null,
          cities: parsed.data.preferences.cities ?? [],
          travel_dates: parsed.data.preferences.travel_dates ?? null,
          pax: parsed.data.preferences.pax ?? null,
        },
        { onConflict: 'owner_type,owner_id' },
      )
      .select('id')
      .maybeSingle();
  }

  void logEvent(
    'lead.created',
    {
      requestId,
      leadId,
      email: normEmail,
      whatsapp: normWhatsapp,
      source: parsed.data.source,
      language: parsed.data.language,
    },
    { source: 'crm', entityId: leadId, dedupeKey: `lead:created:${leadId}` },
  );

  return NextResponse.json(
    { ok: true, leadId, requestId },
    { status: 201, headers: withRequestId(undefined, requestId) },
  );
}