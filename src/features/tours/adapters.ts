import type { CatalogTour } from '@/features/tours/catalog.server';

// No importes tipos desde componentes UI.
// Define aquí el shape estable.
export type ImageItem = { url: string; alt?: string | null };

export type TourLike = {
  id: string;
  slug: string;
  title: string;

  image?: string;
  images?: ImageItem[];

  price?: number;
  base_price?: number;

  durationHours?: number;
  duration_hours?: number;

  short?: string;
  summary?: string;

  city?: string;

  tags?: string[];
  rating?: number;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function getString(obj: UnknownRecord, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' ? v.trim() : undefined;
}

function cleanStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v.map((x) => String(x).trim()).filter(Boolean);
  return out.length ? out : null;
}

export function normalizeImages(raw: unknown, title: string): ImageItem[] | null {
  if (!raw) return null;

  // Support: [ { url, alt } ] | [string]
  if (Array.isArray(raw)) {
    const out: ImageItem[] = [];
    for (const item of raw) {
      if (typeof item === 'string') {
        const url = item.trim();
        if (url) out.push({ url, alt: title });
        continue;
      }
      if (isRecord(item)) {
        const url = cleanStr(
          (typeof item.url === 'string' ? item.url : undefined) ||
            (typeof item.src === 'string' ? item.src : undefined) ||
            (typeof item.href === 'string' ? item.href : undefined),
        );
        if (!url) continue;

        const alt = cleanStr(item.alt) || title;
        out.push({ url, alt });
      }
    }
    return out.length ? out : null;
  }

  // Support: single string URL
  if (typeof raw === 'string') {
    const url = raw.trim();
    return url ? [{ url, alt: title }] : null;
  }

  return null;
}

/**
 * Normaliza un tour de (mock|supabase) a un shape estable para UI.
 * - elimina `unknown` en `images`
 * - rellena campos opcionales de mock vs db
 */
export function toTourLike(t: CatalogTour): TourLike {
  const r: UnknownRecord = isRecord(t) ? (t as UnknownRecord) : {};

  const title = cleanStr(getString(r, 'title')) || 'Tour';
  const slug = cleanStr(getString(r, 'slug'));
  const id = cleanStr(getString(r, 'id')) || slug || fallbackId(title);

  const image = cleanStr(getString(r, 'image')) || '';
  const images = normalizeImages((r as UnknownRecord).images, title);

  const price = asNumber(r.price);
  const base_price = asNumber(r.base_price);

  const durationHours = asNumber(r.durationHours);
  const duration_hours = asNumber(r.duration_hours);

  const short = cleanStr(getString(r, 'short')) || '';
  const summary = cleanStr(getString(r, 'summary')) || '';

  const city = cleanStr(getString(r, 'city')) || '';

  const tags = asStringArray(r.tags);
  const rating = asNumber(r.rating);

  return {
    id,
    slug,
    title,
    ...(image ? { image } : {}),
    ...(images ? { images } : {}),
    ...(price != null ? { price } : {}),
    ...(base_price != null ? { base_price } : {}),
    ...(durationHours != null ? { durationHours } : {}),
    ...(duration_hours != null ? { duration_hours } : {}),
    ...(short ? { short } : {}),
    ...(summary ? { summary } : {}),
    ...(city ? { city } : {}),
    ...(tags ? { tags } : {}),
    ...(rating != null ? { rating } : {}),
  };
}

function fallbackId(seed: string) {
  return `tour_${seed.toLowerCase().replace(/\s+/g, '_').slice(0, 32) || 'x'}`;
}
