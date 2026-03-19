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
  title: z.string().min(3, "El título es muy corto").max(180),
  content: z.string().min(20, "El contenido debe ser más detallado para la IA").max(5000),
  tags: z.array(z.string().min(1).max(32)).max(20).optional(),
  enabled: z.boolean().optional(),
});

// --- GET: Listar fragmentos del Playbook ---
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  try {
    const auth = await requireAdminScope(req, 'system_view');
    if (!auth.ok) return auth.response;

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        { error: 'Supabase admin not configured.', requestId }, 
        { status: 503, headers: withRequestId(undefined, requestId) }
      );
    }

    const { data, error } = await (sb as any)
      .from('ai_playbook_snippets')
      .select('id, title, content, tags, enabled, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error) {
      // Manejo amigable si la tabla aún no existe en la DB
      if (/relation .*ai_playbook_snippets/i.test(error.message)) {
        return NextResponse.json(
          {
            items: [],
            hint: 'Aplica el parche SQL p70 para habilitar esta tabla.',
            requestId
          },
          { status: 200 }
        );
      }
      throw error;
    }

    return NextResponse.json({ items: data ?? [], requestId }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { error: 'Error al obtener snippets', detail: err.message, requestId },
      { status: 500 }
    );
  }
}

// --- POST: Crear un nuevo snippet ---
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  try {
    const auth = await requireAdminScope(req, 'system_admin');
    if (!auth.ok) return auth.response;

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: 'Supabase no configurado', requestId }, { status: 503 });

    const body = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten(), requestId },
        { status: 400 }
      );
    }

    const payload = {
      title: parsed.data.title,
      content: parsed.data.content,
      tags: parsed.data.tags ?? [],
      enabled: parsed.data.enabled ?? true,
    };

    const { data, error } = await (sb as any)
      .from('ai_playbook_snippets')
      .insert(payload)
      .select('id, title, content, tags, enabled, created_at, updated_at')
      .single();

    if (error) throw error;

    // Registro de auditoría (usando null coalescing para evitar el error 2379 anterior)
    void logEvent(
      'admin.playbook_snippet_created', 
      { snippetId: data.id, title: data.title }, 
      { userId: auth.actor ?? null }
    );

    return NextResponse.json({ item: data, requestId }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json(
      { error: 'Error al crear snippet', detail: err.message, requestId },
      { status: 500 }
    );
  }
}