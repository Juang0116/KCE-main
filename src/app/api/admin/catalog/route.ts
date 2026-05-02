import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { slugify } from '@/lib/slugify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TourSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(2, 'Título demasiado corto'),
  city: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  body_md: z.string().optional().nullable(),
  base_price: z.number().int().min(0).optional().nullable(), // minor units
  duration_hours: z.number().min(0).optional().nullable(),
  image: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  lang: z.enum(['es', 'en', 'fr', 'de']).optional().default('es'),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

// GET — list all tours for admin
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req, 'catalog_read');
  if (!auth.ok) return auth.response;

  try {
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'DB no configurada', requestId }, { status: 503 });

    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 500);

    let query = (admin as any)
      .from('tours')
      .select('id,slug,title,city,base_price,price,duration_hours,image,tags,rating,status,lang,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (q) query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%,city.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, items: data ?? [], requestId }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado';
    return NextResponse.json({ error: msg, requestId }, { status: 500 });
  }
}

// POST — create new tour
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req, 'catalog_write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = TourSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten(), requestId }, { status: 400 });
    }
    const input = parsed.data;
    const finalSlug = input.slug || slugify(input.title);

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'DB no configurada', requestId }, { status: 503 });

    const { data, error } = await (admin as any)
      .from('tours')
      .insert({
        slug: finalSlug,
        title: input.title,
        city: input.city ?? null,
        summary: input.summary ?? null,
        body_md: input.body_md ?? null,
        base_price: input.base_price ?? null,
        duration_hours: input.duration_hours ?? null,
        image: input.image ?? null,
        tags: input.tags ?? [],
        lang: input.lang,
        status: input.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id,slug,title')
      .single();

    if (error) throw error;

    void logEvent('admin.tour.created', { tourId: data?.id, slug: finalSlug, title: input.title, requestId });

    return NextResponse.json(
      { ok: true, item: data, requestId },
      { status: 201, headers: withRequestId(undefined, requestId) }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado';
    return NextResponse.json({ error: msg, requestId }, { status: 500 });
  }
}
