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
  kind: z.enum(['followup_24h', 'proposal', 'checkout_push']),
});

type TaskInsert = {
  deal_id: string;
  title: string;
  priority: 'normal' | 'high' | 'urgent';
  due_at: string;
  status: 'open' | 'done' | 'canceled';
};

function nowPlus(hours: number) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

function getTemplates(kind: z.infer<typeof BodySchema>['kind']) {
  if (kind === 'checkout_push') {
    return {
      whatsapp: "Hola {{name}} 🙂 Ya te dejé el link de pago para asegurar tu reserva ({{tour}} - {{date}}): {{url}}",
      emailSubject: 'Tu link de pago para confirmar la reserva',
      emailBody: 'Hola {{name}},\n\nAquí tienes el link de pago...',
    };
  }
  if (kind === 'proposal') {
    return {
      whatsapp: 'Hola {{name}} 👋 Te comparto la propuesta...',
      emailSubject: 'Propuesta de experiencia (KCE)',
      emailBody: 'Hola {{name}},\n\nAdjunto/comparto la propuesta...',
    };
  }
  return {
    whatsapp: 'Hola {{name}} 👋 ¿Cómo vas?',
    emailSubject: 'Seguimiento rápido — KCE',
    emailBody: 'Hola {{name}},\n\nSolo paso a hacer seguimiento...',
  };
}

// --- SOLUCIÓN ERROR 2322 ---
// Usamos switch para que TS sepa que siempre devolvemos un TaskInsert[]
function buildTasks(kind: z.infer<typeof BodySchema>['kind'], dealId: string): TaskInsert[] {
  switch (kind) {
    case 'checkout_push':
      return [
        { deal_id: dealId, title: 'Enviar link de pago (checkout)', priority: 'urgent', due_at: nowPlus(1), status: 'open' },
        { deal_id: dealId, title: 'Verificar pago (6h)', priority: 'urgent', due_at: nowPlus(6), status: 'open' },
      ];
    case 'proposal':
      return [
        { deal_id: dealId, title: 'Preparar propuesta (12h)', priority: 'high', due_at: nowPlus(12), status: 'open' },
        { deal_id: dealId, title: 'Confirmar recepción (48h)', priority: 'normal', due_at: nowPlus(48), status: 'open' },
      ];
    case 'followup_24h':
      return [
        { deal_id: dealId, title: 'Follow-up lead (24h)', priority: 'high', due_at: nowPlus(24), status: 'open' },
        { deal_id: dealId, title: 'Follow-up lead (48h)', priority: 'normal', due_at: nowPlus(48), status: 'open' },
      ];
    default:
      return []; // Fallback de seguridad
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    const { id: dealId } = await ctx.params;
    const bodyJson = await req.json().catch(() => ({}));
    
    const paramsValid = ParamsSchema.safeParse({ id: dealId });
    const bodyValid = BodySchema.safeParse(bodyJson);

    if (!paramsValid.success || !bodyValid.success) {
      return NextResponse.json({ error: 'Datos inválidos', requestId }, { status: 400 });
    }

    const kind = bodyValid.data.kind;
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase no configurado');

    const tasks = buildTasks(kind, dealId);
    
    const { error: insError } = await (admin as any).from('tasks').insert(tasks);

    if (insError) {
      void logEvent('api.error', { route: 'admin.playbook.apply', error: insError.message, requestId }, { userId: auth.actor ?? null });
      return NextResponse.json({ error: 'Error DB', requestId }, { status: 500 });
    }

    void logEvent('admin.deal_playbook_applied', { dealId, kind, requestId }, { userId: auth.actor ?? null });

    return NextResponse.json({ 
      ok: true, 
      tasksCreated: tasks.length, 
      templates: getTemplates(kind), 
      requestId 
    });

  } catch (err: any) {
    void logEvent('api.error', { route: 'admin.playbook.fatal', error: err.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ error: 'Error interno', requestId }, { status: 500 });
  }
}