// src/app/api/availability/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { corsHeaders } from '@/lib/cors';
import { getRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // si en tu proyecto corsHeaders vive aquí; si no, ajusta el import
// import { getSupabasePublic } from '@/lib/supabasePublic' // si aplica a tu lógica real

// --- FIX: convertir HeadersInit -> Record<string,string> ---
function toHeaderRecord(h: HeadersInit | undefined): Record<string, string> {
  if (!h) return {};
  if (Array.isArray(h)) {
    const out: Record<string, string> = {};
    for (const [k, v] of h) out[k] = String(v);
    return out;
  }
  if (h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  // object literal case
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) out[k] = String(v);
  return out;
}

const QuerySchema = z.object({
  tour_id: z.string().uuid(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function OPTIONS(req: NextRequest) {
  // si tu app tiene preflight dedicado, puedes mantenerlo. Esto es suficiente para compilar.
  const hdrs = corsHeaders(req, {
    allowHeaders: 'Content-Type, X-Request-ID',
  }) as unknown as HeadersInit;
  return new NextResponse(null, { status: 204, headers: hdrs });
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const clen = contentLengthBytes(req);
  if (clen && clen > 96_000) {
    const headerRecord = toHeaderRecord(
      corsHeaders(req, { allowHeaders: 'Content-Type, X-Request-ID' }) as any,
    );
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
      headers: headerRecord,
    });
  }

  const url = new URL(req.url);
  const tour_id = url.searchParams.get('tour_id') ?? undefined;
  const from = url.searchParams.get('from') ?? undefined;
  const to = url.searchParams.get('to') ?? undefined;

  const headerRecord = toHeaderRecord(
    corsHeaders(req, { allowHeaders: 'Content-Type, X-Request-ID' }) as any,
  );

  const parsed = QuerySchema.safeParse({ tour_id, from, to });
  if (!parsed.success) {
    return jsonError(req, {
      status: 400,
      code: 'INVALID_INPUT',
      message: 'Invalid query',
      requestId,
      headers: headerRecord,
      details: parsed.error.flatten(),
    } as any);
  }

  // Aquí va tu lógica real de disponibilidad (DB / reglas)
  // Por ahora devuelvo estructura típica:
  return NextResponse.json(
    {
      ok: true,
      tour_id: parsed.data.tour_id,
      from: parsed.data.from ?? null,
      to: parsed.data.to ?? null,
      slots: [],
      requestId,
    },
    {
      status: 200,
      headers: headerRecord,
    },
  );
}
