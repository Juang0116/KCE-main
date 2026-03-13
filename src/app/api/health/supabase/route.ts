// src/app/api/supabase/health/route.ts (o donde lo tengas)
import { NextResponse, type NextRequest } from 'next/server';

import { getSupabasePublicOptional, isSupabasePublicConfigured } from '@/lib/supabasePublic';

export const runtime = 'nodejs'; // recomendado si no estás 100% seguro de edge

function noStoreJson(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...(extraHeaders || {}),
    },
  });
}

function classifySupabaseError(message: string) {
  const m = message.toLowerCase();

  if (m.includes('permission denied') || m.includes('row level security'))
    return 'RLS_OR_PERMISSIONS';
  if (m.includes('relation') && m.includes('does not exist')) return 'TABLE_MISSING';
  if (m.includes('jwt') || m.includes('auth')) return 'AUTH_CONFIG';
  if (m.includes('fetch failed') || m.includes('network') || m.includes('timeout'))
    return 'NETWORK';

  return 'UNKNOWN';
}

export async function GET(_req: NextRequest) {
  const requestId =
    globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // 1) Env config
  if (!isSupabasePublicConfigured()) {
    return noStoreJson({ ok: false, configured: false, requestId }, 503, {
      'X-Request-ID': requestId,
    });
  }

  const supabase = getSupabasePublicOptional();
  if (!supabase) {
    return noStoreJson({ ok: false, configured: false, requestId }, 503, {
      'X-Request-ID': requestId,
    });
  }

  // 2) Query test (anon/public) — aquí se revela RLS
  try {
    // Opción ligera: no trae filas, solo valida que la query funcione.
    const { error, count } = await supabase
      .from('tours')
      .select('id', { head: true, count: 'exact' });

    if (error) {
      const kind = classifySupabaseError(error.message);

      // Si está configurado pero la lectura pública falla, eso NO es "no configurado".
      // Es un problema de tabla/RLS/permisos.
      return noStoreJson(
        {
          ok: false,
          configured: true,
          kind,
          error: error.message,
          requestId,
        },
        500,
        { 'X-Request-ID': requestId },
      );
    }

    return noStoreJson(
      {
        ok: true,
        configured: true,
        publicReadable: true,
        count: typeof count === 'number' ? count : null,
        requestId,
      },
      200,
      { 'X-Request-ID': requestId },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return noStoreJson(
      {
        ok: false,
        configured: true,
        kind: 'NETWORK',
        error: msg,
        requestId,
      },
      502,
      { 'X-Request-ID': requestId },
    );
  }
}
