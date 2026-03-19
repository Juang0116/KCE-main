import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  
  // 1. Seguridad: Solo administradores autorizados
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    // 2. Validación de Parámetros (Next.js 15: await params)
    const { id: customerId } = await ctx.params;
    const parsed = ParamsSchema.safeParse({ id: customerId });
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'ID de cliente inválido', requestId }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin DB no configurada', requestId }, { status: 503 });
    }

    // 3. Obtener el perfil básico del cliente
    const { data: customer, error: cErr } = await (admin as any)
      .from('customers')
      .select('id, email, name, phone, country, language, created_at')
      .eq('id', customerId)
      .maybeSingle();

    if (cErr || !customer) {
      return NextResponse.json({ error: 'Cliente no encontrado', requestId }, { status: 404 });
    }

    const email = String(customer.email || '').trim().toLowerCase();

    // 4. Consultas paralelas para construir el timeline
    // Buscamos todo lo relacionado por email (reservas y leads)
    const [bookingsRes, leadsRes] = await Promise.all([
      email 
        ? (admin as any).from('bookings').select('*').ilike('customer_email', email).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [] }),
      email
        ? (admin as any).from('leads').select('*').ilike('email', email).order('created_at', { ascending: false }).limit(50)
        : Promise.resolve({ data: [] })
    ]);

    const leadIds = (leadsRes.data || []).map((l: any) => l.id).filter(Boolean);

    // 5. Obtener Conversaciones (Vinculadas por customer_id o por lead_id)
    let convQuery = (admin as any)
      .from('conversations')
      .select('id, lead_id, customer_id, channel, locale, status, closed_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (leadIds.length > 0) {
      // Usamos sintaxis PostgREST para el OR complejo
      convQuery = convQuery.or(`customer_id.eq.${customerId},lead_id.in.(${leadIds.join(',')})`);
    } else {
      convQuery = convQuery.eq('customer_id', customerId);
    }
    const conversationsRes = await convQuery.limit(100);

    // 6. Timeline de Eventos (Timeline real de acciones)
    const entityIds = [customerId, ...(bookingsRes.data || []).map((b: any) => b.id), ...leadIds].slice(0, 60);

    const eventsRes = entityIds.length > 0
      ? await (admin as any)
          .from('events')
          .select('id, type, source, entity_id, payload, created_at')
          .in('entity_id', entityIds)
          .order('created_at', { ascending: false })
          .limit(200)
      : { data: [] };

    // 7. Registro de Auditoría (Fix Error 2379)
    if (bookingsRes.error || leadsRes.error || conversationsRes.error) {
       void logEvent(
         'api.error', 
         { route: 'admin.customer.detail', customerId, requestId }, 
         { userId: auth.actor ?? null }
       );
    }

    return NextResponse.json({
      customer,
      bookings: bookingsRes.data ?? [],
      leads: leadsRes.data ?? [],
      conversations: conversationsRes.data ?? [],
      events: eventsRes.data ?? [],
      requestId,
    }, { 
      status: 200, 
      headers: withRequestId(undefined, requestId) 
    });

  } catch (err: any) {
    void logEvent('api.error', { route: 'admin.customer.fatal', error: err.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ error: 'Error interno del servidor', requestId }, { status: 500 });
  }
}