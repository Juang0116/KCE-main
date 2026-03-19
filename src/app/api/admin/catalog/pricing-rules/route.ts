import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  scope: z.enum(['tour', 'tag', 'city', 'global']),
  tour_id: z.string().uuid().optional().nullable(),
  tag: z.string().max(120).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  min_persons: z.number().int().optional().nullable(),
  max_persons: z.number().int().optional().nullable(),
  currency: z.string().length(3).optional().default('EUR'),
  delta_minor: z.number().int().optional().default(0),
  kind: z.enum(['delta', 'override']).optional().default('delta'),
  override_price_minor: z.number().int().optional().nullable(),
  priority: z.number().int().optional().default(100),
  status: z.enum(['active', 'paused', 'archived']).optional().default('active'),
  metadata: z.record(z.any()).optional().default({}),
}).strict();

// --- GET: Listado de reglas de precio ---
export const GET = (req: NextRequest) =>
  withRequestId(req, async () => {
    const requestId = getRequestId(req.headers);
    const auth = await requireAdminScope(req);
    if (!auth.ok) return auth.response;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin DB not configured', requestId }, { status: 503 });
    }

    const { data, error } = await (admin as any)
      .from('tour_pricing_rules')
      .select('*')
      .order('priority', { ascending: true }) // Menor número = mayor prioridad
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message, requestId }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data || [], requestId });
  });

// --- POST: Crear nueva regla de precio ---
export const POST = (req: NextRequest) =>
  withRequestId(req, async () => {
    const requestId = getRequestId(req.headers);
    const auth = await requireAdminScope(req);
    if (!auth.ok) return auth.response;

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'Admin DB not configured', requestId }, { status: 503 });

    try {
      const bodyJson = await req.json().catch(() => ({}));
      const parsed = CreateSchema.safeParse(bodyJson);
      
      if (!parsed.success) {
        return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten(), requestId }, { status: 400 });
      }

      const body = parsed.data;

      // Guardrails de lógica de negocio por Scope
      if (body.scope === 'tour' && !body.tour_id) {
        return NextResponse.json({ error: 'tour_id es obligatorio para el scope "tour"', requestId }, { status: 400 });
      }
      if (body.scope === 'tag' && !body.tag) {
        return NextResponse.json({ error: 'tag es obligatorio para el scope "tag"', requestId }, { status: 400 });
      }
      if (body.scope === 'city' && !body.city) {
        return NextResponse.json({ error: 'city es obligatorio para el scope "city"', requestId }, { status: 400 });
      }

      const insertPayload = {
        ...body,
        metadata: body.metadata ?? {},
        created_at: new Date().toISOString(),
      };

      const { data, error } = await (admin as any)
        .from('tour_pricing_rules')
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) throw error;

      // Auditoría (Corregido Error TS 2379 usando ?? null)
      void logEvent(
        'catalog.pricing_rule_created', 
        { ruleId: data.id, scope: data.scope, kind: data.kind }, 
        { userId: auth.actor ?? null }
      );

      return NextResponse.json({ ok: true, item: data, requestId }, { status: 201 });

    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Error interno', requestId }, { status: 500 });
    }
  });