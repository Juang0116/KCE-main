import 'server-only';

import { unstable_cache } from 'next/cache';

import { isSupabasePublicConfigured } from '@/lib/supabasePublic';

import { filterAndSortTours, getTourBySlug as getMockTourBySlug, TAGS, CITIES } from './data.mock';
import {
  fetchTours as fetchToursDb,
  fetchTourBySlug as fetchTourBySlugDb,
  type DbTour,
  type ListParams,
} from './queries';

import type { Tour as UiTour, TourSort } from '../types';

export type CatalogTour = (UiTour | DbTour) & { source: 'mock' | 'supabase' };
export type SortKey = TourSort;

export type ListOptions = {
  q?: string;
  tag?: string;
  city?: string;
  sort?: SortKey;
  /** Price min in major units (EUR) */
  minPrice?: number;
  /** Price max in major units (EUR) */
  maxPrice?: number;
  limit?: number;
  offset?: number;
};

export type ListResult = {
  source: 'mock' | 'supabase';
  items: CatalogTour[];
  total: number;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function cleanStr(v?: string) {
  const s = (v ?? '').trim();
  return s.length ? s : undefined;
}

function safeLimit(n: unknown, fallback = 60) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(1, Math.min(200, Math.floor(v)));
}

function safeOffset(n: unknown, fallback = 0) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.floor(v));
}

function normalizeSort(sort: SortKey): NonNullable<ListParams['orderBy']> {
  switch (sort) {
    case 'price-asc':
      return 'price_asc';
    case 'price-desc':
      return 'price_desc';
    case 'popular':
    default:
      return 'popular';
  }
}

function pickCity(t: unknown): string | null {
  if (!isRecord(t)) return null;
  const v = t.city;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s : null;
}

function pickTags(t: unknown): string[] {
  if (!isRecord(t)) return [];
  const v = t.tags;
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

export async function listTours(opts: ListOptions = {}): Promise<ListResult> {
  const q = cleanStr(opts.q);
  const tag = cleanStr(opts.tag);
  const city = cleanStr(opts.city);
  const sort: SortKey = opts.sort ?? 'popular';
  const minPrice =
    typeof opts.minPrice === 'number' && Number.isFinite(opts.minPrice) ? opts.minPrice : undefined;
  const maxPrice =
    typeof opts.maxPrice === 'number' && Number.isFinite(opts.maxPrice) ? opts.maxPrice : undefined;
  const minPriceMinor =
    typeof minPrice === 'number' ? Math.max(0, Math.trunc(minPrice * 100)) : undefined;
  const maxPriceMinor =
    typeof maxPrice === 'number' ? Math.max(0, Math.trunc(maxPrice * 100)) : undefined;
  const limit = safeLimit(opts.limit, 60);
  const offset = safeOffset(opts.offset, 0);

  const tags = tag ? [tag] : undefined;

  if (isSupabasePublicConfigured()) {
    try {
      const orderBy = normalizeSort(sort);

      // exactOptionalPropertyTypes: no enviar claves con undefined
      const params: ListParams = {
        ...(q ? { q } : {}),
        ...(city ? { city } : {}),
        ...(tags ? { tags } : {}),
        ...(typeof minPriceMinor === 'number' ? { minPriceMinor } : {}),
        ...(typeof maxPriceMinor === 'number' ? { maxPriceMinor } : {}),
        limit,
        offset,
        orderBy,
      };

      const cacheKey = JSON.stringify(params);
      const cached = unstable_cache(() => fetchToursDb(params), ['tours:list', cacheKey], {
        revalidate: 60,
        tags: ['tours'],
      });

      const { items, total } = await cached();

      return {
        source: 'supabase',
        items: (items ?? []).map((t) => ({ ...(t as DbTour), source: 'supabase' })),
        total: typeof total === 'number' ? total : (items?.length ?? 0),
      };
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[listTours] Supabase falló, usando mock. Motivo:', err);
      }
    }
  }

  // Fallback mock
  const mock = filterAndSortTours({
    ...(q ? { q } : {}),
    ...(tag ? { tag } : {}),
    ...(city ? { city } : {}),
    sort,
  });

  const slice = mock.slice(offset, offset + limit);

  return {
    source: 'mock',
    items: slice.map((t) => ({ ...(t as UiTour), source: 'mock' })),
    total: mock.length,
  };
}

export async function getTourBySlug(slug: string): Promise<CatalogTour | null> {
  const cleanSlug = (slug ?? '').trim();
  if (!cleanSlug) return null;

  if (isSupabasePublicConfigured()) {
    try {
      const cached = unstable_cache(() => fetchTourBySlugDb(cleanSlug), ['tours:slug', cleanSlug], {
        revalidate: 300,
        tags: ['tours'],
      });

      const t = await cached();
      if (t) return { ...(t as DbTour), source: 'supabase' };
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[getTourBySlug] Supabase falló, usando mock. Motivo:', err);
      }
    }
  }

  const t = getMockTourBySlug(cleanSlug);
  return t ? ({ ...(t as UiTour), source: 'mock' } as CatalogTour) : null;
}

export async function getFacets(): Promise<{ tags: string[]; cities: string[] }> {
  if (isSupabasePublicConfigured()) {
    try {
      const cached = unstable_cache(
        () => fetchToursDb({ limit: 1000, offset: 0, orderBy: 'popular' }),
        ['tours:facets', 'popular'],
        { revalidate: 300, tags: ['tours'] },
      );

      const { items } = await cached();

      const cities = Array.from(
        new Set((items ?? []).map(pickCity).filter((x): x is string => !!x)),
      ).sort((a, b) => a.localeCompare(b, 'es'));

      const tags = Array.from(new Set((items ?? []).flatMap(pickTags))).sort((a, b) =>
        a.localeCompare(b, 'es'),
      );

      return { tags, cities };
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[getFacets] Supabase falló, usando fallback. Motivo:', err);
      }
    }
  }

  return { tags: [...TAGS], cities: [...CITIES] };
}
