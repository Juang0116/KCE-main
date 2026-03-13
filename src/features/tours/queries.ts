// src/features/tours/queries.ts
import 'server-only';

import { getSupabasePublic, isSupabasePublicConfigured } from '@/lib/supabasePublic';

import type { SupabaseClient } from '@supabase/supabase-js';

export type DbTour = {
  id: string;
  slug: string;
  title: string;
  city: string;
  tags: string[] | null;
  base_price: number; // minor units (EUR cents) — integer
  duration_hours: number | null;
  images: unknown; // jsonb
  summary: string | null;
  body_md: string | null;
  rating: number | null;
  view_count: number | null;
  is_featured: boolean | null;
};
export type ListParams = {
  q?: string;
  city?: string;
  tags?: string[];
  minPriceMinor?: number;
  maxPriceMinor?: number;
  limit?: number;
  offset?: number;
  orderBy?: 'popular' | 'price_asc' | 'price_desc' | 'newest';
};

function getClient(): SupabaseClient | null {
  if (!isSupabasePublicConfigured()) return null;
  return getSupabasePublic() as unknown as SupabaseClient;
}

function logSupabaseErr(prefix: string, err: unknown) {
  const e: any = err;

  console.error(prefix, {
    message: e?.message,
    details: e?.details,
    hint: e?.hint,
    code: e?.code,
    status: e?.status,
  });
}

async function runList(
  sb: SupabaseClient,
  args: {
    safe: string;
    city: string;
    tags: string[];
    minPriceMinor?: number;
    maxPriceMinor?: number;
    limit: number;
    offset: number;
    orderBy: NonNullable<ListParams['orderBy']>;
  },
) {
  const { safe, city, tags, minPriceMinor, maxPriceMinor, limit, offset, orderBy } = args;

  const client = sb.schema('public');

  let query = client
    .from('tours')
    .select(
      'id,slug,title,city,tags,base_price,duration_hours,images,summary,body_md,rating,view_count,is_featured',
      { count: 'exact' },
    );

  if (safe) query = query.or(`title.ilike.%${safe}%,summary.ilike.%${safe}%,city.ilike.%${safe}%`);
  if (city) query = query.eq('city', city);
  if (tags.length > 0) query = query.contains('tags', tags);

  // Precio (minor units)
  if (typeof minPriceMinor === 'number' && Number.isFinite(minPriceMinor)) {
    query = query.gte('base_price', Math.max(0, Math.trunc(minPriceMinor)));
  }
  if (typeof maxPriceMinor === 'number' && Number.isFinite(maxPriceMinor)) {
    query = query.lte('base_price', Math.max(0, Math.trunc(maxPriceMinor)));
  }

  // Orden "MVP seguro": evita columnas frágiles (created_at/updated_at) hasta confirmar esquema real.
  if (orderBy === 'price_asc')
    query = query.order('base_price', { ascending: true, nullsFirst: false });
  else if (orderBy === 'price_desc')
    query = query.order('base_price', { ascending: false, nullsFirst: false });
  else if (orderBy === 'newest') {
    // MVP: si no tienes created_at, usa id como fallback
    query = query.order('id', { ascending: false });
  } else {
    query = query
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('is_featured', { ascending: false, nullsFirst: false })
      .order('rating', { ascending: false, nullsFirst: false });
  }

  return await query.range(offset, offset + limit - 1);
}

async function runBySlug(sb: SupabaseClient, safeSlug: string) {
  return await sb
    .schema('public')
    .from('tours')
    .select(
      'id,slug,title,city,tags,base_price,duration_hours,images,summary,body_md,rating,view_count,is_featured',
    )
    .eq('slug', safeSlug)
    .maybeSingle();
}

function isAbortLike(err: unknown): boolean {
  const e: any = err;
  const msg = String(e?.message || '');
  return msg.includes('AbortError') || e?.name === 'AbortError';
}

export async function fetchTours(params: ListParams): Promise<{ items: DbTour[]; total: number }> {
  const supabase = getClient();
  if (!supabase) return { items: [], total: 0 };

  const q = params.q?.trim() || '';
  const city = params.city?.trim() || '';
  const tags = (params.tags ?? []).map((t) => t.trim()).filter(Boolean);
  const minPriceMinor = Number.isFinite(params.minPriceMinor as any)
    ? Number(params.minPriceMinor)
    : undefined;
  const maxPriceMinor = Number.isFinite(params.maxPriceMinor as any)
    ? Number(params.maxPriceMinor)
    : undefined;

  const limit = Math.max(1, Math.min(200, Number(params.limit ?? 60) || 60));
  const offset = Math.max(0, Number(params.offset ?? 0) || 0);
  const orderBy = params.orderBy ?? 'popular';

  const safe = q ? q.replace(/[%_]/g, '') : '';

  // ✅ Solo usamos el schema 'public'.
  // El schema 'api' NO suele estar expuesto en Supabase (PGRST106: Invalid schema: api)
  // y causaba errores/ruido en Vercel.
  const res = await runList(supabase, {
    safe,
    city,
    tags,
    ...(minPriceMinor !== undefined ? { minPriceMinor } : {}),
    ...(maxPriceMinor !== undefined ? { maxPriceMinor } : {}),
    limit,
    offset,
    orderBy,
  });

  if (res.error) {
    // AbortError en Vercel puede ocurrir por timeouts/cancelaciones durante revalidación.
    // En producción preferimos degradar elegante para no romper páginas.
    if (isAbortLike(res.error)) {
      console.warn('[fetchTours] aborted (degrading gracefully)');
      return { items: [], total: 0 };
    }
    logSupabaseErr('[fetchTours] public schema error:', res.error);
    if (process.env.NODE_ENV !== 'production') throw res.error;
    return { items: [], total: 0 };
  }

  return {
    items: (res.data ?? []) as unknown as DbTour[],
    total: res.count ?? res.data?.length ?? 0,
  };
}

export async function fetchTourBySlug(slug: string): Promise<DbTour | null> {
  const supabase = getClient();
  if (!supabase) return null;

  const safeSlug = (slug || '').trim();
  if (!safeSlug) return null;

  const res = await runBySlug(supabase, safeSlug);

  if (res.error) {
    if (isAbortLike(res.error)) {
      console.warn('[fetchTourBySlug] aborted (degrading gracefully)');
      return null;
    }
    logSupabaseErr('[fetchTourBySlug] public schema error:', res.error);
    if (process.env.NODE_ENV !== 'production') throw res.error;
    return null;
  }

  return (res.data ?? null) as unknown as DbTour | null;
}
