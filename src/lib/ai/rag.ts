// src/features/tours/rag.ts
import 'server-only';
import { getSupabasePublic } from '@/lib/supabasePublic';

/* ──────────────────────────── Tipos ──────────────────────────── */

export type TourSearchRow = {
  id: string;
  slug: string;
  title: string;
  city: string;
  duration_hours: number | null;
  base_price: number | null; // minor units (EUR cents) entero
};

export type AvailabilityRow = {
  date: string; // YYYY-MM-DD
  price: number | null; // minor units (EUR cents) entero (si aplica)
  capacity: number | null; // capacidad/aforo restante/total según esquema
};

/* ──────────────────────────── Utils ──────────────────────────── */

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const isIsoDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

/**
 * Escapa valores para usarlos dentro del string de `.or(...)` de PostgREST.
 * Importante: `.or()` usa comas como separadores; por eso se recomienda
 * envolver strings en comillas y escapar backslash/comillas.
 */
function pgQuote(value: string): string {
  const v = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${v}"`;
}

/** Heurística: fallback a ILIKE solo si FTS falla por columna inexistente. */
function isMissingFtsColumn(err: unknown): boolean {
  const e = err as any;
  const code = typeof e?.code === 'string' ? e.code : '';
  const msg = typeof e?.message === 'string' ? e.message : '';
  // 42703 = undefined_column (Postgres)
  return code === '42703' || /search_tsv/i.test(msg) || /undefined column/i.test(msg);
}

/* ──────────────────────────── API ──────────────────────────── */

/**
 * Busca tours por relevancia:
 * - Si existe columna `search_tsv` (tsvector), usa `textSearch(websearch)`.
 * - Si no, cae a ILIKE sobre `title|summary|city`.
 * - Filtro opcional por ciudad (AND directo; city es NOT NULL en el schema final).
 */
export async function searchTours(
  query: string,
  city?: string,
  limit = 5,
): Promise<TourSearchRow[]> {
  const sb = getSupabasePublic();
  const q = (query || '').trim();
  const max = clamp(Math.floor(limit), 1, 50);

  // Builder base (ojo: filtramos por columns aunque no las seleccionemos)
  const base = sb.from('tours').select('id, slug, title, city, duration_hours, base_price');

  // Filtro de ciudad (AND) — solo si viene
  const withCity = () => {
    let b = base;
    const c = (city || '').trim();
    if (c) {
      // (city = X) OR (city IS NULL) — mantiene tours sin ciudad seteada
      b = b.eq('city', c);
    }
    return b;
  };

  // Sin término → solo filtra por ciudad y limita
  if (!q) {
    const { data, error } = await withCity().limit(max);
    if (error) throw error;
    return (data ?? []) as TourSearchRow[];
  }

  // Intento 1: FTS con tsvector
  const ftsQuery = withCity()
    .textSearch('search_tsv', q, { type: 'websearch', config: 'spanish' })
    .limit(max);

  const { data: ftsData, error: ftsErr } = await ftsQuery;

  // Éxito del FTS
  if (!ftsErr) return (ftsData ?? []) as TourSearchRow[];

  // Si FTS falla por columna inexistente → fallback a ILIKE
  if (!isMissingFtsColumn(ftsErr)) {
    // No enmascarar errores reales (RLS, red, permisos, etc.)
    throw ftsErr;
  }

  // Fallback: ILIKE amplio
  const safe = q.replace(/[%_]/g, ''); // evita wildcard injection simple
  const pattern = `%${safe}%`;

  let fallback = base;

  const c = (city || '').trim();
  if (c) {
    fallback = fallback.eq('city', c);
  }

  // (title ILIKE ... OR summary ILIKE ... OR city ILIKE ...)
  // Nota: filtrar por `summary` es válido aunque no lo estés seleccionando.
  fallback = fallback.or(
    `title.ilike.${pgQuote(pattern)},summary.ilike.${pgQuote(pattern)},city.ilike.${pgQuote(
      pattern,
    )}`,
  );

  const { data: likeData, error: likeErr } = await fallback.limit(max);
  if (likeErr) throw likeErr;
  return (likeData ?? []) as TourSearchRow[];
}

/**
 * Consulta disponibilidad/slots de un tour.
 * - Rango opcional [from, to] en formato YYYY-MM-DD (inclusive).
 * - Orden ascendente por fecha.
 */
export async function availabilityFor(
  tourId: string,
  from?: string,
  to?: string,
  limit = 10,
): Promise<AvailabilityRow[]> {
  const sb = getSupabasePublic();
  const max = clamp(Math.floor(limit), 1, 100);

  const id = String(tourId || '').trim();
  if (!id) return [];

  let q = sb.from('tour_availability').select('date, price, capacity').eq('tour_id', id);

  if (isIsoDate(from)) q = q.gte('date', from!);
  if (isIsoDate(to)) q = q.lte('date', to!);

  q = q.order('date', { ascending: true }).limit(max);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AvailabilityRow[];
}
