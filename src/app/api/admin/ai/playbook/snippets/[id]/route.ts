import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  title: z.string().min(3).max(180).optional(),
  content: z.string().min(20).max(5000).optional(),
  tags: z.array(z.string().min(1).max(32)).max(20).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req, 'system_admin');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const sb = getSupabaseAdmin();

  if (!sb) {
    return NextResponse.json(
      { error: 'Supabase admin not configured.', requestId }, 
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const patch: Record<string, any> = {};
    if (parsed.data.title !== undefined) patch.title = parsed.data.title;
    if (parsed.data.content !== undefined) patch.content = parsed.data.content;
    if (parsed.data.tags !== undefined) patch.tags = parsed.data.tags;
    if (parsed.data.enabled !== undefined) patch.enabled = parsed.data.enabled;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No changes detected', requestId }, { status: 400 });
    }

    patch.updated_at = new Date().toISOString();

    const { data, error } = await (sb as any)
      .from('ai_playbook_snippets')
      .update(patch)
      .eq('id', id)
      .select('id, title, content, tags, enabled, created_at, updated_at')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Snippet not found', requestId }, { status: 404 });

    // --- CORRECCIÓN ERROR 2379 ---
    // Forzamos que si auth.actor no existe, pase null en lugar de undefined
    void logEvent(
      'admin.playbook_snippet_updated', 
      { snippetId: id, fields: Object.keys(patch) }, 
      { userId: auth.actor ?? null } 
    );

    return NextResponse.json({ ok: true, item: data, requestId }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req, 'system_admin');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const sb = getSupabaseAdmin();

  if (!sb) return NextResponse.json({ error: 'Supabase not configured', requestId }, { status: 503 });

  try {
    const { error } = await (sb as any)
      .from('ai_playbook_snippets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // --- CORRECCIÓN ERROR 2379 ---
    void logEvent(
      'admin.playbook_snippet_deleted', 
      { snippetId: id }, 
      { userId: auth.actor ?? null }
    );

    return NextResponse.json({ ok: true, requestId }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, requestId }, { status: 500 });
  }
}