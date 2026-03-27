// src/app/api/leads/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { logEvent } from '@/lib/events.server';
import { assertAllowedOriginOrReferer } from '@/lib/requestGuards.server';
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

const LeadPayloadSchema = z
  .object({
    email: EmailSchema,
    whatsapp: TextSchema,
    name: TextSchema, // ✅ Añadido para procesar el nombre del formulario
    message: TextSchema, // ✅ Añadido para procesar el mensaje
    topic: TextSchema, // ✅ Añadido para procesar el tema
    source: z.preprocess(trimOrUndefined, z.string().min(1)).optional().default('web'),
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
    action: 'leads.create',
    limit: 5,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', requestId },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = LeadPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten(), requestId },
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

    // ✅ Extraemos los nuevos campos name, message y topic
    const { email, whatsapp, name, message, topic, source, language, preferences } = parsed.data;
    const normEmail = normalizeEmail(email) || null;
    const normWhatsapp = normalizePhone(whatsapp) || null;

    const adminRaw = getSupabaseAdmin();
    if (!adminRaw) {
      return NextResponse.json(
        { error: 'Supabase admin not configured', requestId },
        { status: 503, headers: withRequestId(undefined, requestId) },
      );
    }

    // ⛑️ Hotfix: tipos Supabase desalineados (TS infiere never). Cast controlado.
    const admin = adminRaw as any;

    // Best-effort: reusar lead si ya existe por email/whatsapp
    try {
      if (normEmail) {
        const q = await admin
          .from('leads')
          .select('id')
          .eq('email', normEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const existingId = (q?.data as { id?: string } | null | undefined)?.id;
        if (existingId) {
          // Si el lead ya existía, podríamos querer actualizar sus notas o tags.
          // Por simplicidad y seguridad (evitar sobreescribir notas previas), 
          // de momento solo devolvemos el ID existente como antes.
          return NextResponse.json(
            { ok: true, leadId: existingId, reused: true, requestId },
            { status: 200, headers: withRequestId(undefined, requestId) },
          );
        }
      } else if (normWhatsapp) {
        const q = await admin
          .from('leads')
          .select('id')
          .eq('whatsapp', normWhatsapp)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const existingId = (q?.data as { id?: string } | null | undefined)?.id;
        if (existingId) {
          return NextResponse.json(
            { ok: true, leadId: existingId, reused: true, requestId },
            { status: 200, headers: withRequestId(undefined, requestId) },
          );
        }
      }
    } catch {
      // ignore
    }

    // ✅ Asignamos los datos completos al objeto de inserción
    const leadInsert = {
      email: normEmail,
      whatsapp: normWhatsapp,
      name: name ?? null,             // Guarda el nombre real del cliente
      source: source ?? 'web',
      language: language ?? 'es',
      stage: 'new',
      tags: topic ? [topic] : [],     // Guarda el topic (ej. 'general', 'tours') como tag
      notes: message ?? null,         // Guarda lo que escribió el cliente en las notas
    };

    const ins = await admin.from('leads').insert(leadInsert as any).select('id').single();

    const leadId = (ins?.data as { id?: string } | null | undefined)?.id;
    if (ins?.error || !leadId) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/leads',
          message: (ins?.error?.message as string | undefined) || 'insert failed',
        },
        { source: 'api' },
      );

      return NextResponse.json(
        { error: 'No se pudo crear el lead', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    if (preferences) {
      const prefRow = {
        owner_type: 'lead',
        owner_id: leadId,
        interests: (preferences.interests ?? null) as any,
        budget_range: (preferences.budget_range ?? null) as any,
        cities: preferences.cities ?? [],
        travel_dates: (preferences.travel_dates ?? null) as any,
        pax: preferences.pax ?? null,
      };

      await admin
        .from('preferences')
        .upsert(prefRow as any, { onConflict: 'owner_type,owner_id' })
        .select('id')
        .maybeSingle();
    }

    await logEvent(
      'lead.created',
      { requestId, leadId, email: normEmail, whatsapp: normWhatsapp, source, language },
      { source: 'crm', entityId: leadId, dedupeKey: `lead:created:${leadId}` },
    );

    return NextResponse.json(
      { ok: true, leadId, requestId },
      { status: 201, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/leads', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );

    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  return NextResponse.json(
    { ok: true, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}