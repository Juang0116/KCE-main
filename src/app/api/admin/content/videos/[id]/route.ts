// src/app/api/admin/content/videos/[id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { slugify } from '@/lib/slugify';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(_req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  const { data, error } = await (admin as any).from('videos').select('*').eq('id', id).maybeSingle();

  if (error) {
    await logEvent(
      'api.error',
      { route: '/api/admin/content/videos/[id]', error: error.message },
      { source: 'admin' },
    );
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ok: true, item: data }, { status: 200 });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const patch = { ...parsed.data } as any;
  if (typeof patch.slug === 'string') patch.slug = slugify(patch.slug);

  if (patch.status === 'published') patch.published_at = new Date().toISOString();
  if (patch.status === 'draft') patch.published_at = null;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  const { data, error } = await (admin as any)
    .from('videos')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    await logEvent(
      'api.error',
      { route: '/api/admin/content/videos/[id]', error: error.message },
      { source: 'admin' },
    );
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const updated: any = data;

  await logEvent(
    'content.video_updated',
    { id: updated?.id ?? id, slug: updated?.slug ?? null, status: updated?.status ?? patch.status ?? null },
    { source: 'admin' },
  );

  if ((updated?.status ?? patch.status) === 'published') {
    await logEvent(
      'content.video_published',
      { id: updated?.id ?? id, slug: updated?.slug ?? null },
      { source: 'admin' },
    );
  }

  return NextResponse.json({ ok: true, item: updated }, { status: 200 });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(_req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  const { error } = await (admin as any).from('videos').delete().eq('id', id);

  if (error) {
    await logEvent(
      'api.error',
      { route: '/api/admin/content/videos/[id]', error: error.message },
      { source: 'admin' },
    );
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await logEvent('content.video_deleted', { id }, { source: 'admin' });
  return NextResponse.json({ ok: true }, { status: 200 });
}
