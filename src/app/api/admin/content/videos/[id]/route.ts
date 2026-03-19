import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { slugify } from '@/lib/slugify';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(2).optional(),
  description: z.string().max(8000).optional().nullable(),
  youtube_url: z.string().url().optional(),
  cover_url: z.string().url().optional().nullable(),
  tags: z.array(z.string().min(1)).optional(),
  lang: z.enum(['es', 'en', 'fr', 'de']).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

// --- GET: Obtener detalle del video ---
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json({ ok: false, error: 'DB not configured', requestId }, { status: 503 });
  }

  const { data, error } = await (admin as any).from('videos').select('*').eq('id', id).maybeSingle();

  if (error) {
    void logEvent('api.error', { route: 'admin.videos.get', error: error.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ ok: false, error: error.message, requestId }, { status: 500 });
  }

  if (!data) return NextResponse.json({ ok: false, error: 'Video no encontrado', requestId }, { status: 404 });

  return NextResponse.json({ ok: true, item: data, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
}

// --- PATCH: Actualizar video ---
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Datos inválidos', details: parsed.error.flatten(), requestId }, { status: 400 });
    }

    const patch: any = { ...parsed.data };
    if (patch.slug) patch.slug = slugify(patch.slug);

    // Lógica de publicación
    if (patch.status === 'published') {
      patch.published_at = new Date().toISOString();
    } else if (patch.status === 'draft') {
      patch.published_at = null;
    }

    patch.updated_at = new Date().toISOString();

    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase admin not configured');

    const { data, error } = await (admin as any)
      .from('videos')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Auditoría
    void logEvent(
      'content.video_updated', 
      { id, slug: data.slug, status: data.status }, 
      { userId: auth.actor ?? null }
    );

    if (data.status === 'published') {
      void logEvent('content.video_published', { id, slug: data.slug }, { userId: auth.actor ?? null });
    }

    return NextResponse.json({ ok: true, item: data, requestId }, { status: 200 });

  } catch (err: any) {
    void logEvent('api.error', { route: 'admin.videos.patch', error: err.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ ok: false, error: err.message, requestId }, { status: 500 });
  }
}

// --- DELETE: Eliminar video ---
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const admin = getSupabaseAdmin();

  if (!admin) return NextResponse.json({ error: 'DB error', requestId }, { status: 503 });

  const { error } = await (admin as any).from('videos').delete().eq('id', id);

  if (error) {
    void logEvent('api.error', { route: 'admin.videos.delete', error: error.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ ok: false, error: error.message, requestId }, { status: 500 });
  }

  void logEvent('content.video_deleted', { id }, { userId: auth.actor ?? null });

  return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
}