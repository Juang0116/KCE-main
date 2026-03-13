// src/app/api/admin/content/posts/[id]/route.ts
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
  excerpt: z.string().max(5000).optional().nullable(),
  content_md: z.string().optional(),
  cover_url: z.string().url().optional().nullable(),
  tags: z.array(z.string().min(1)).optional(),
  lang: z.enum(['es', 'en', 'fr', 'de']).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  const { data, error } = await (admin as any).from('posts').select('*').eq('id', id).maybeSingle();

  if (error) {
    await logEvent(
      'api.error',
      { route: '/api/admin/content/posts/[id]', error: error.message },
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

  const patch: any = { ...parsed.data };

  // Normalize slug if provided
  if (typeof patch.slug === 'string') patch.slug = slugify(patch.slug);

  // status transitions
  if (patch.status === 'published') {
    patch.published_at = new Date().toISOString();
  } else if (patch.status === 'draft') {
    patch.published_at = null;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  const { data, error } = await (admin as any)
    .from('posts')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    await logEvent(
      'api.error',
      { route: '/api/admin/content/posts/[id]', error: error.message },
      { source: 'admin' },
    );
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const row: any = data;

  await logEvent(
    'content.post_updated',
    { id: row?.id ?? id, slug: row?.slug ?? patch.slug ?? null, status: row?.status ?? patch.status ?? null },
    { source: 'admin' },
  );

  if (row?.status === 'published') {
    await logEvent('content.post_published', { id: row?.id ?? id, slug: row?.slug ?? null }, { source: 'admin' });
  }

  return NextResponse.json({ ok: true, item: row }, { status: 200 });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  const { error } = await (admin as any).from('posts').delete().eq('id', id);

  if (error) {
    await logEvent(
      'api.error',
      { route: '/api/admin/content/posts/[id]', error: error.message },
      { source: 'admin' },
    );
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await logEvent('content.post_deleted', { id }, { source: 'admin' });

  return NextResponse.json({ ok: true }, { status: 200 });
}
