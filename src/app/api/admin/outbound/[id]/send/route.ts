// src/app/api/admin/outbound/[id]/send/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { buildWhatsAppLink, processOutboundQueue, updateOutboundStatus } from '@/lib/outbound.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({
  mode: z.enum(['send_now', 'preview']).default('send_now'),
});

/**
 * Orquestador de envío manual de mensajes.
 * Gestiona previsualizaciones, generación de links de WhatsApp y despacho de correos.
 */
export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  // 1. Contexto y Seguridad
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const actorRaw = await getAdminActor(req).catch(() => 'admin');
  const actor = String(actorRaw);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de base de datos no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 2. Validación de Entrada
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) {
      return NextResponse.json({ ok: false, error: 'ID de mensaje inválido', requestId }, { status: 400 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Cuerpo de solicitud inválido', requestId }, { status: 400 });
    }

    const { id } = params.data;
    const { mode } = parsed.data;
    const db = admin as any;

    // 3. Recuperar el Mensaje
    const { data: msg, error: fetchError } = await db
      .from('crm_outbound_messages')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !msg) {
      return NextResponse.json({ ok: false, error: 'Mensaje no encontrado', requestId }, { status: 404 });
    }

    // 4. Lógica por Canal
    
    // --- WHATSAPP (Manual / Link) ---
    if (msg.channel === 'whatsapp') {
      const waLink = buildWhatsAppLink(msg.to_phone || '', msg.body || '');
      
      await logEvent('outbound.whatsapp_link_generated', { 
        requestId, outboundId: id, actor, to: msg.to_phone 
      });

      return NextResponse.json(
        { ok: true, id, channel: 'whatsapp', waLink, requestId }, 
        { status: 200, headers: withRequestId(undefined, requestId) }
      );
    }

    // --- EMAIL / OTROS (Previsualización) ---
    if (mode === 'preview') {
      return NextResponse.json(
        { 
          ok: true, 
          id, 
          channel: msg.channel, 
          preview: { to: msg.to_email, subject: msg.subject, body: msg.body }, 
          requestId 
        }, 
        { status: 200, headers: withRequestId(undefined, requestId) }
      );
    }

    // --- EMAIL (Envío Forzado) ---
    // Paso 1: Asegurar que el mensaje esté en la cola (queued)
    if (msg.status !== 'queued') {
      await updateOutboundStatus(id, { status: 'queued', error: null });
    }

    // Paso 2: Ejecutar el procesador de cola específicamente para este despacho (limit 1)
    const processResult = await processOutboundQueue({ 
      limit: 1, 
      dryRun: false, 
      requestId 
    });

    await logEvent('outbound.manual_send_triggered', { 
      requestId, 
      outboundId: id, 
      actor, 
      success: processResult.sent > 0 
    });

    return NextResponse.json(
      { 
        ok: true, 
        processed: processResult.processed, 
        sent: processResult.sent, 
        failed: processResult.failed, 
        requestId 
      }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido al procesar envío';
    
    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/outbound/[id]/send', 
      message: msg 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo crítico al intentar enviar el mensaje', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}