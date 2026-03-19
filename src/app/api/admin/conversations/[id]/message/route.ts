import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

const BodySchema = z.object({
  content: z.string().trim().min(1, "El mensaje no puede estar vacío").max(10_000),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  
  // 1. Seguridad: Solo administradores autorizados
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    // 2. Validación de Parámetros y Cuerpo
    const { id: conversationId } = ParamsSchema.parse(await ctx.params);
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin DB no configurada', requestId }, { status: 503 });
    }

    // 3. Inserción del mensaje en la base de datos
    // El rol es 'agent' porque lo envía un admin humano
    const { data: inserted, error: dbError } = await (admin as any)
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'agent',
        content: parsed.data.content,
        meta: { 
          source: 'admin_panel',
          requestId 
        },
      })
      .select('id, created_at')
      .single();

    if (dbError || !inserted?.id) {
      void logEvent(
        'api.error', 
        { route: 'admin.chat.message', error: dbError?.message, requestId }, 
        { userId: auth.actor ?? null }
      );
      
      return NextResponse.json({ error: 'Error al guardar el mensaje', requestId }, { status: 500 });
    }

    // 4. Log de Auditoría (Corregido Error 2379)
    void logEvent(
      'admin.agent_message_sent', 
      { conversation_id: conversationId, message_id: inserted.id }, 
      { 
        userId: auth.actor ?? null, 
        entityId: conversationId,
        dedupeKey: `msg:${inserted.id}` 
      }
    );

    return NextResponse.json(
      { ok: true, message_id: inserted.id, created_at: inserted.created_at, requestId },
      { status: 201, headers: withRequestId(undefined, requestId) }
    );

  } catch (err: any) {
    void logEvent('api.error', { route: 'admin.chat.message', error: err.message, requestId }, { userId: auth.actor ?? null });
    
    return NextResponse.json(
      { error: 'Error interno inesperado', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}