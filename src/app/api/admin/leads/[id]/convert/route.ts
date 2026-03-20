// src/app/api/admin/leads/[id]/convert/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { normalizeEmail, normalizePhone } from '@/lib/normalize';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ 
  id: z.string().uuid({ message: "El ID del lead debe ser un UUID válido" }) 
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  // 1. Autenticación y configuración inicial
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

  try {
    // 2. Validación segura de parámetros
    const resolvedParams = await ctx.params;
    const parsedParams = ParamsSchema.safeParse(resolvedParams);
    
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: parsedParams.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { id } = parsedParams.data;
    
    // Alias local para evitar errores de tipado estricto en operaciones complejas del CRM
    const db = admin as any; 

    // 3. Obtener el Lead actual
    const { data: lead, error: leadError } = await db
      .from('leads')
      .select('id, email, whatsapp, language, source, stage, created_at')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) }
      );
    }

    // 4. Normalización de datos críticos
    const email = normalizeEmail(lead.email);
    if (!email) {
      return NextResponse.json(
        { error: 'El lead no tiene un email válido (requerido para convertir)', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const phone = normalizePhone(lead.whatsapp);
    const languageRaw = lead.language;
    const language = typeof languageRaw === 'string' && languageRaw.trim()
      ? languageRaw.trim().toLowerCase()
      : null;

    // 5. Upsert del Customer (Crear o actualizar basado en email)
    const { data: cust, error: custError } = await db
      .from('customers')
      .upsert(
        {
          email,
          phone: phone || null,
          language,
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single();

    if (custError || !cust?.id) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/admin/leads/[id]/convert',
          message: custError?.message || 'Failed to upsert customer during lead conversion',
          leadId: id,
        },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error en la base de datos al crear el cliente', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    const customerId = String(cust.id);

    // 6. Actualizar el Lead (Marcar como ganado y vincular el Customer)
    const { error: updateError } = await db
      .from('leads')
      .update({ stage: 'won', customer_id: customerId })
      .eq('id', id);

    if (updateError) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/admin/leads/[id]/convert',
          message: updateError.message,
          leadId: id,
          customerId,
        },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error en la base de datos al actualizar el estado del lead', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    // 7. Registro de eventos de éxito para analíticas y trazabilidad
    await Promise.all([
      logEvent(
        'lead.converted',
        { requestId, leadId: id, customerId, email },
        { source: 'crm', entityId: id, dedupeKey: `lead:converted:${id}` }
      ),
      logEvent(
        'customer.upserted',
        { requestId, customerId, email },
        { source: 'crm', entityId: customerId, dedupeKey: `customer:upserted:${email}` }
      )
    ]);

    return NextResponse.json(
      { ok: true, leadId: id, customerId, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/leads/[id]/convert', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}