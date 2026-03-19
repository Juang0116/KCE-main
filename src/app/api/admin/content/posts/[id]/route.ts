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
  excerpt: z.string().max(5000).optional().nullable(),
  content_md: z.string().optional(),
  cover_url: z.string().url().optional().nullable(),
  tags: z.array(z.string().min(1)).optional(),
  lang: z.enum(['es', 'en', 'fr', 'de']).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

// --- GET: Obtener detalle del post ---
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Admin DB no configurada', requestId }, { status: 503 });
  }

  const { data, error } = await (admin as any).from('posts').select('*').eq('id', id).maybeSingle();

  if (error) {
    void logEvent('api.error', { route: 'admin.posts.get', error: error.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ ok: false, error: error.message, requestId }, { status: 500 });
  }

  if (!data) return NextResponse.json({ ok: false, error: 'Post no encontrado', requestId }, { status: 404 });

  return NextResponse.json({ ok: true, item: data, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
}

// --- PATCH: Actualizar post ---
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

    // Normalización de slug
    if (patch.slug) patch.slug = slugify(patch.slug);

    // Lógica de fechas de publicación
    if (patch.status === 'published') {
      patch.published_at = new Date().toISOString();
    } else if (patch.status === 'draft') {
      patch.published_at = null;
    }

    patch.updated_at = new Date().toISOString();

    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase admin not configured');

    const { data, error } = await (admin as any)
      .from('posts')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Auditoría (Fix Error 2379)
    void logEvent(
      'content.post_updated', 
      { id, slug: data.slug, status: data.status }, 
      { userId: auth.actor ?? null }
    );

    if (data.status === 'published') {
      void logEvent('content.post_published', { id, slug: data.slug }, { userId: auth.actor ?? null });
    }

    return NextResponse.json({ ok: true, item: data, requestId }, { status: 200 });

  } catch (err: any) {
    void logEvent('api.error', { route: 'admin.posts.patch', error: err.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ ok: false, error: err.message, requestId }, { status: 500 });
  }
}

// --- DELETE: Eliminar post ---
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const admin = getSupabaseAdmin();

  if (!admin) return NextResponse.json({ error: 'DB error', requestId }, { status: 503 });

  const { error } = await (admin as any).from('posts').delete().eq('id', id);

  if (error) {
    void logEvent('api.error', { route: 'admin.posts.delete', error: error.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ ok: false, error: error.message, requestId }, { status: 500 });
  }

  void logEvent('content.post_deleted', { id }, { userId: auth.actor ?? null });

  return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
}