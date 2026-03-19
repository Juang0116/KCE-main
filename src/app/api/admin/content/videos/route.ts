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

const VideoUpsertSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(2, "Título demasiado corto"),
  description: z.string().max(8000).optional().nullable(),
  youtube_url: z.string().url("URL de YouTube inválida"),
  cover_url: z.string().url("URL de portada inválida").optional().nullable(),
  tags: z.array(z.string().min(1)).optional().default([]),
  lang: z.enum(['es', 'en', 'fr', 'de']).optional().default('es'),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  published_at: z.string().datetime().optional().nullable(),
});

// --- GET: Listado de videos con filtros ---
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  return withRequestId(req, async () => {
    const auth = await requireAdminScope(req);
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q');
    const lang = url.searchParams.get('lang');
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 200);

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'DB no configurada', requestId }, { status: 503 });

    let query = (admin as any)
      .from('videos')
      .select('id, slug, title, description, youtube_url, cover_url, tags, lang, status, published_at, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status === 'draft' || status === 'published') query = query.eq('status', status);
    if (lang && ['es', 'en', 'fr', 'de'].includes(lang)) query = query.eq('lang', lang);
    if (q) query = query.ilike('title', `%${q}%`);

    const { data, error } = await query;

    if (error) {
      void logEvent('api.error', { route: 'admin.videos.list', error: error.message, requestId }, { userId: auth.actor ?? null });
      return NextResponse.json({ error: error.message, requestId }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data ?? [], requestId });
  });
}

// --- POST: Crear un nuevo video ---
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  return withRequestId(req, async () => {
    const auth = await requireAdminScope(req);
    if (!auth.ok) return auth.response;

    try {
      const body = await req.json().catch(() => ({}));
      const parsed = VideoUpsertSchema.safeParse(body);
      
      if (!parsed.success) {
        return NextResponse.json({ error: 'Datos de video inválidos', details: parsed.error.flatten(), requestId }, { status: 400 });
      }

      const input = parsed.data;
      const slug = slugify(input.slug || input.title);
      const now = new Date().toISOString();

      const row = {
        slug,
        title: input.title,
        description: input.description ?? null,
        youtube_url: input.youtube_url,
        cover_url: input.cover_url ?? null,
        tags: input.tags ?? [],
        lang: input.lang ?? 'es',
        status: input.status ?? 'draft',
        published_at: input.status === 'published' ? (input.published_at || now) : null,
      };

      const admin = getSupabaseAdmin();
      if (!admin) throw new Error('Supabase not configured');

      const { data, error } = await (admin as any).from('videos').insert(row).select('*').single();

      if (error) throw error;

      // Log de Auditoría (Fix Error 2379)
      void logEvent(
        'content.video_created', 
        { id: data.id, slug: data.slug, status: data.status }, 
        { userId: auth.actor ?? null }
      );

      if (data.status === 'published') {
        void logEvent('content.video_published', { id: data.id, slug: data.slug }, { userId: auth.actor ?? null });
      }

      return NextResponse.json({ ok: true, item: data, requestId }, { status: 201 });

    } catch (err: any) {
      void logEvent('api.error', { route: 'admin.videos.create', error: err.message, requestId }, { userId: auth.actor ?? null });
      return NextResponse.json({ error: err.message, requestId }, { status: 500 });
    }
  });
}