import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

// Helper para extraer el timestamp más relevante de cualquier objeto
function pickTs(o: any): string {
  return (
    o?.sent_at ||
    o?.replied_at ||
    o?.due_at ||
    o?.last_message_at ||
    o?.updated_at ||
    o?.created_at ||
    new Date().toISOString()
  );
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    // 1. Validar ID del Deal (Next.js 15: await params)
    const { id: dealId } = await ctx.params;
    const p = ParamsSchema.safeParse({ id: dealId });
    if (!p.success) {
      return NextResponse.json({ error: 'ID de negocio inválido', requestId }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase admin not configured');

    // 2. Obtener datos base del Deal
    const { data: deal, error: dealErr } = await (admin as any)
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (dealErr || !deal) {
      return NextResponse.json({ error: 'Negocio no encontrado', requestId }, { status: 404 });
    }

    // 3. Consultas paralelas para el Timeline (Rendimiento optimizado)
    const [tasksRes, outRes, evRes] = await Promise.all([
      (admin as any).from('tasks').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }).limit(100),
      (admin as any).from('crm_outbound_messages').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }).limit(100),
      (admin as any).from('events').select('*').eq('entity_id', dealId).order('created_at', { ascending: false }).limit(100),
    ]);

    // 4. Cargar contexto de Chat/Ticket (opcional)
    let ticket: any = null;
    let messages: any[] = [];
    if (deal.lead_id || deal.customer_id) {
      const { data: tData } = await (admin as any)
        .from('tickets')
        .select('*')
        .or(`lead_id.eq.${deal.lead_id},customer_id.eq.${deal.customer_id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tData) {
        ticket = tData;
        const { data: mData } = await (admin as any)
          .from('messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', ticket.conversation_id)
          .order('created_at', { ascending: false })
          .limit(20);
        messages = mData || [];
      }
    }

    // 5. Componer y Unificar el Timeline
    const timeline: any[] = [];

    // Tareas
    tasksRes.data?.forEach((t: any) => timeline.push({
      kind: 'task',
      ts: pickTs(t),
      title: t.title,
      detail: `${t.status} · prioridad ${t.priority}`,
      meta: { id: t.id, status: t.status }
    }));

    // Correos/WhatsApp Salientes
    outRes.data?.forEach((o: any) => timeline.push({
      kind: 'outbound',
      ts: pickTs(o),
      title: `${o.channel.toUpperCase()} · ${o.status}`,
      detail: o.subject || o.template_key,
      meta: { id: o.id, outcome: o.outcome }
    }));

    // Eventos de Sistema (Logs)
    evRes.data?.forEach((e: any) => timeline.push({
      kind: 'event',
      ts: pickTs(e),
      title: e.type,
      detail: e.source || 'system',
      meta: { id: e.id, payload: e.payload }
    }));

    // Mensajes de Chat
    messages.forEach((m: any) => timeline.push({
      kind: 'message',
      ts: pickTs(m),
      title: m.role === 'user' ? 'Cliente' : 'Agente',
      detail: m.content.slice(0, 200),
      meta: { id: m.id, role: m.role }
    }));

    // Ordenar todo por fecha descendente
    timeline.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    return NextResponse.json(
      { deal, ticket, timeline, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (err: any) {
    void logEvent('api.error', { route: 'admin.deal.timeline', error: err.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ error: 'Error interno', requestId }, { status: 500 });
  }
}