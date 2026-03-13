// src/app/api/admin/content/videos/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { slugify } from '@/lib/slugify';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VideoUpsertSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(2),
  description: z.string().max(8000).optional().nullable(),
  youtube_url: z.string().url(),
  cover_url: z.string().url().optional().nullable(),
  tags: z.array(z.string().min(1)).optional().default([]),
  lang: z.enum(['es', 'en', 'fr', 'de']).optional().default('es'),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  published_at: z.string().datetime().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const q = url.searchParams.get('q');
  const lang = url.searchParams.get('lang');
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 200);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  let query = (admin as any)
    .from('videos')
    .select(
      'id,slug,title,description,youtube_url,cover_url,tags,lang,status,published_at,created_at,updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status === 'draft' || status === 'published') query = query.eq('status', status);
  if (lang && ['es', 'en', 'fr', 'de'].includes(lang)) query = query.eq('lang', lang);
  if (q) query = query.ilike('title', `%${q}%`);

  const { data, error } = await query;

  if (error) {
    await logEvent(
      'api.error',
      { route: '/api/admin/content/videos', error: error.message },
      { source: 'admin' },
    );
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: data ?? [] }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = VideoUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const slug = slugify(input.slug ?? input.title);
  const nowIso = new Date().toISOString();

  const row = {
    slug,
    title: input.title,
    description: input.description ?? null,
    youtube_url: input.youtube_url,
    cover_url: input.cover_url ?? null,
    tags: input.tags ?? [],
    lang: input.lang ?? 'es',
    status: input.status ?? 'draft',
    published_at:
      (input.status ?? 'draft') === 'published' ? (input.published_at ?? nowIso) : null,
  };

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  const { data, error } = await (admin as any).from('videos').insert(row).select('*').single();

  if (error) {
    await logEvent(
      'api.error',
      { route: '/api/admin/content/videos', error: error.message },
      { source: 'admin' },
    );
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const created: any = data;

  await logEvent(
    'content.video_created',
    { id: created?.id ?? null, slug: created?.slug ?? row.slug, status: created?.status ?? row.status },
    { source: 'admin' },
  );

  if ((created?.status ?? row.status) === 'published') {
    await logEvent(
      'content.video_published',
      { id: created?.id ?? null, slug: created?.slug ?? row.slug },
      { source: 'admin' },
    );
  }

  return NextResponse.json({ ok: true, item: created }, { status: 200 });
}
