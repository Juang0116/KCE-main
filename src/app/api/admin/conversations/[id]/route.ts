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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  
  // 1. Verificación de Seguridad
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    // 2. Validación de Parámetros (Next.js 15 requiere await en params)
    const { id: conversationId } = ParamsSchema.parse(await ctx.params);

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin DB no configurada', requestId }, { status: 503 });
    }

    // 3. Obtener Metadatos de la Conversación (con Joins)
    const { data: conversation, error: convErr } = await (admin as any)
      .from('conversations')
      .select(`
        id, channel, locale, status, closed_at, created_at, updated_at,
        lead_id, customer_id,
        leads(id, email, whatsapp, source, stage, language),
        customers(id, email, name, phone, country, language)
      `)
      .eq('id', conversationId)
      .maybeSingle();

    if (convErr || !conversation) {
      void logEvent(
        'api.error', 
        { route: 'admin.chat.get', message: convErr?.message || 'No encontrada', conversationId, requestId }, 
        { userId: auth.actor ?? null }
      );

      return NextResponse.json({ error: 'Conversación no encontrada', requestId }, { status: 404 });
    }

    // 4. Obtener todos los mensajes asociados
    const { data: messages, error: msgErr } = await (admin as any)
      .from('messages')
      .select('id, role, content, meta, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgErr) {
      void logEvent('api.error', { route: 'admin.chat.messages', message: msgErr.message, requestId }, { userId: auth.actor ?? null });
      return NextResponse.json({ error: 'Error al cargar mensajes', requestId }, { status: 500 });
    }

    // 5. Respuesta consolidada
    return NextResponse.json(
      { 
        conversation, 
        messages: messages ?? [], 
        requestId 
      }, 
      { 
        status: 200, 
        headers: withRequestId(undefined, requestId) 
      }
    );

  } catch (err: any) {
    void logEvent('api.error', { route: 'admin.chat.fatal', message: err.message, requestId }, { userId: auth.actor ?? null });
    
    return NextResponse.json(
      { error: 'Error interno inesperado', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}