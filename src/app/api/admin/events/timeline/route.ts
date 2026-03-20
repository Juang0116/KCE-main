// src/app/api/admin/events/timeline/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Esquema de validación estricto
const QuerySchema = z
  .object({
    session_id: z.string().trim().min(1).max(256).optional(),
    entity_id: z.string().trim().min(1).max(2048).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  })
  .refine((data) => data.session_id || data.entity_id, {
    message: "Debe proveer al menos 'session_id' o 'entity_id'",
    path: ['session_id', 'entity_id'],
  });

/**
 * Normaliza y separa una cadena de IDs separada por comas, 
 * con un límite estricto para evitar abusos en las consultas.
 */
function splitIds(v?: string): string[] {
  if (!v) return [];
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50); 
}

export async function GET(req: NextRequest) {
  // Verificación de seguridad y scope de administrador
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  // Parseo seguro de la URL y los Query Params
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    session_id: url.searchParams.get('session_id') || undefined,
    entity_id: url.searchParams.get('entity_id') || undefined,
    limit: url.searchParams.get('limit') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) }
    );
  }

  const { session_id, entity_id, limit } = parsed.data;
  const ids = new Set<string>();

  // Paso 1: Agregar los entity_ids explícitos
  for (const id of splitIds(entity_id)) {
    ids.add(id);
  }

  // Paso 2: Si existe un session_id (ej. Stripe), resolver las entidades asociadas
  if (session_id) {
    ids.add(session_id);
    
    try {
      // Usamos `any` localmente para evitar problemas de tipado estricto si las vistas/tablas
      // no están 100% sincronizadas en el genotipo de Database.
      const db = admin as any;

      // Buscar el Booking asociado a la sesión
      const { data: booking } = await db
        .from('bookings')
        .select('id, customer_email')
        .eq('stripe_session_id', session_id)
        .maybeSingle();

      if (booking?.id) {
        ids.add(String(booking.id));
      }

      // Si tenemos un email en el booking, buscar el Customer ID
      const email = booking?.customer_email?.trim();
      if (email) {
        const { data: customer } = await db
          .from('customers')
          .select('id')
          .ilike('email', email)
          .maybeSingle();

        if (customer?.id) {
          ids.add(String(customer.id));
        }
      }
    } catch (error) {
      // Es un error no fatal; continuamos con los IDs que pudimos recolectar
      console.warn(`[Timeline API] Error resolviendo entidades para la sesión ${session_id}`, error);
    }
  }

  const entityIds = Array.from(ids).slice(0, 50);

  if (entityIds.length === 0) {
    return NextResponse.json(
      { error: 'No se resolvieron entity IDs válidos', requestId },
      { status: 400, headers: withRequestId(undefined, requestId) }
    );
  }

  // Paso 3: Consultar la tabla de eventos con los IDs unificados
  try {
    const { data: events, error } = await (admin as any)
      .from('events')
      .select('id, type, source, entity_id, dedupe_key, payload, created_at')
      .in('entity_id', entityIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(
      { entityIds, items: events ?? [], requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener el timeline';

    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/events/timeline', message: errorMessage },
      { source: 'api', dedupeKey: `api.error:/api/admin/events/timeline:${requestId}` }
    );

    return NextResponse.json(
      { error: 'Fallo al recuperar los eventos del timeline', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}