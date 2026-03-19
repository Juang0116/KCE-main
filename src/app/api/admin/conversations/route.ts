import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  q: z.string().optional(),
  scope: z.enum(['meta', 'content']).default('meta'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// --- HELPERS DE HIDRATACIÓN ---

function getSnippet(content: string, max = 140) {
  const text = (content || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/**
 * Agrega el último mensaje a cada conversación para la previsualización del Inbox
 */
async function attachLastMessages(admin: any, items: any[]) {
  const ids = items.map((c) => c.id);
  if (!ids.length) return;

  const { data: messages } = await admin
    .from('messages')
    .select('conversation_id, role, content, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: false });

  if (messages) {
    const lastMsgMap = new Map();
    for (const m of messages) {
      if (!lastMsgMap.has(m.conversation_id)) {
        lastMsgMap.set(m.conversation_id, {
          role: m.role,
          content: getSnippet(m.content),
          created_at: m.created_at,
        });
      }
    }
    items.forEach(c => {
      c.last_message = lastMsgMap.get(c.id) ?? null;
    });
  }
}

/**
 * Obtiene datos de Leads y Customers de forma manual (evita SelectQueryError en builds)
 */
async function hydrateParties(admin: any, rows: any[]) {
  const leadIds = Array.from(new Set(rows.map(r => r.lead_id).filter(Boolean)));
  const customerIds = Array.from(new Set(rows.map(r => r.customer_id).filter(Boolean)));

  const [leadsRes, customersRes] = await Promise.all([
    leadIds.length ? admin.from('leads').select('id, email, whatsapp').in('id', leadIds) : { data: [] },
    customerIds.length ? admin.from('customers').select('id, email, name, phone').in('id', customerIds) : { data: [] }
  ]);

  const leadMap = new Map(leadsRes.data?.map((l: any) => [l.id, l]));
  const customerMap = new Map(customersRes.data?.map((c: any) => [c.id, c]));

  return rows.map(r => ({
    ...r,
    leads: r.lead_id ? leadMap.get(r.lead_id) || null : null,
    customers: r.customer_id ? customerMap.get(r.customer_id) || null : null,
    last_message: null
  }));
}

// --- HANDLER PRINCIPAL ---

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  return withRequestId(req, async () => {
    const auth = await requireAdminScope(req);
    if (!auth.ok) return auth.response;

    try {
      const url = new URL(req.url);
      const parsed = QuerySchema.safeParse({
        lead_id: url.searchParams.get('lead_id') ?? undefined,
        customer_id: url.searchParams.get('customer_id') ?? undefined,
        q: url.searchParams.get('q') ?? undefined,
        scope: url.searchParams.get('scope') ?? undefined,
        page: url.searchParams.get('page') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined,
      });

      if (!parsed.success) {
        return NextResponse.json({ error: 'Query inválida', details: parsed.error.flatten(), requestId }, { status: 400 });
      }

      const { lead_id, customer_id, q, scope, page, limit } = parsed.data;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const admin = getSupabaseAdmin();

      let items: any[] = [];
      let totalCount = 0;

      // ESCENARIO A: Búsqueda por contenido de mensajes (Deep Search)
      if (scope === 'content' && q?.trim()) {
        const { data: msgData, error: msgErr } = await (admin as any)
          .from('messages')
          .select('conversation_id')
          .ilike('content', `%${q.trim()}%`)
          .order('created_at', { ascending: false })
          .limit(500);

        if (msgErr) throw msgErr;

        // SOLUCIÓN ERROR 7006: Tipado explícito de 'm'
        const convIds = Array.from(
          new Set((msgData as { conversation_id: string }[] | null)?.map((m) => m.conversation_id))
        ).filter(Boolean);

        if (convIds.length === 0) {
          return NextResponse.json({ items: [], page, limit, total: 0, requestId });
        }

        let query = (admin as any)
          .from('conversations')
          .select('*', { count: 'exact' })
          .in('id', convIds)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (lead_id) query = query.eq('lead_id', lead_id);
        if (customer_id) query = query.eq('customer_id', customer_id);

        const res = await query;
        if (res.error) throw res.error;
        items = res.data || [];
        totalCount = res.count || 0;
      } 
      
      // ESCENARIO B: Listado normal / Filtros de metadatos
      else {
        let query = (admin as any)
          .from('conversations')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (lead_id) query = query.eq('lead_id', lead_id);
        if (customer_id) query = query.eq('customer_id', customer_id);

        const res = await query;
        if (res.error) throw res.error;
        items = res.data || [];
        totalCount = res.count || 0;
      }

      // Proceso de hidratación
      let hydratedItems = await hydrateParties(admin, items);

      // Búsqueda textual en memoria (nombre/email/teléfono) si no es por contenido
      if (scope === 'meta' && q?.trim()) {
        const qq = q.trim().toLowerCase();
        hydratedItems = hydratedItems.filter(c => {
          const searchable = [
            c.leads?.email, c.leads?.whatsapp,
            c.customers?.email, c.customers?.name, c.customers?.phone
          ].filter(Boolean).join(' ').toLowerCase();
          return searchable.includes(qq);
        });
      }

      // Añadimos el último mensaje para el "snippet" del Inbox
      await attachLastMessages(admin, hydratedItems);

      return NextResponse.json({ 
        items: hydratedItems, 
        page, 
        limit, 
        total: totalCount, 
        requestId 
      }, { 
        status: 200, 
        headers: withRequestId(undefined, requestId) 
      });

    } catch (err: any) {
      // SOLUCIÓN ERROR 2379: userId con null coalescing
      void logEvent(
        'api.error', 
        { route: 'admin.conversations.list', message: err.message, requestId }, 
        { userId: auth.actor ?? null }
      );
      
      return NextResponse.json({ error: 'Error al listar conversaciones', requestId }, { status: 500 });
    }
  });
}