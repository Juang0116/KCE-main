import type { MetadataRoute } from 'next';

import { createClient } from '@supabase/supabase-js';

import { SITE_URL } from '@/lib/env';

type DbTourRow = {
  slug: string;
  updated_at: string | null;
};

function slugify(s: string) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function trimOrEmpty(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function safeSlug(s: unknown): string {
  const v = typeof s === 'string' ? s.trim() : '';
  return v ? encodeURIComponent(v) : '';
}

async function fetchTourSlugs(): Promise<DbTourRow[]> {
  const url = trimOrEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = trimOrEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anon) return [];

  try {
    // Client público: select permitido por policy tours_public_select.
    const sb = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch },
    });

    const res = await sb
      .from('tours')
      .select('slug,updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (res.error || !Array.isArray(res.data)) return [];
    return res.data
      .map((r: any) => ({
        slug: typeof r.slug === 'string' ? r.slug : '',
        updated_at: r.updated_at ?? null,
      }))
      .filter((r) => Boolean(r.slug));
  } catch {
    return [];
  }
}

async function fetchDestinationCitySlugs(): Promise<string[]> {
  const url = trimOrEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = trimOrEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anon) return [];

  try {
    const sb = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch },
    });

    // No DISTINCT in PostgREST without RPC; we sample and de-dupe.
    const res = await sb.from('tours').select('city').order('updated_at', { ascending: false }).limit(1000);
    if (res.error || !Array.isArray(res.data)) return [];

    const set = new Set<string>();
    for (const r of res.data as any[]) {
      const city = typeof r?.city === 'string' ? r.city.trim() : '';
      const s = slugify(city);
      if (s) set.add(s);
    }

    return Array.from(set).slice(0, 200);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const now = new Date();

  const staticRoutes = [
    '',
    '/tours',
    '/destinations',
    '/lead-magnets/eu-guide',
    '/plan',
    '/about',
    '/contact',
    '/faq',
    '/blog',
    '/vlog',
    '/privacy',
    '/terms',
  ];

  // Incluimos prefijos de idioma para SEO. El middleware reescribe internamente.
  const locales = ['es', 'en', 'fr', 'de'];
  const urls: MetadataRoute.Sitemap = [];

  for (const l of locales) {
    for (const path of staticRoutes) {
      urls.push({
        url: `${base}/${l}${path}`,
        lastModified: now,
      });
    }
  }

  const tours = await fetchTourSlugs();
  const destinations = await fetchDestinationCitySlugs();
  if (tours.length) {
    for (const l of locales) {
      for (const t of tours) {
        const slug = safeSlug(t.slug);
        if (!slug) continue;
        const lastModified = t.updated_at ? new Date(t.updated_at) : now;
        urls.push({
          url: `${base}/${l}/tours/${slug}`,
          lastModified,
        });
      }
    }
  }

  if (destinations.length) {
    for (const l of locales) {
      for (const s of destinations) {
        const slug = safeSlug(s);
        if (!slug) continue;
        urls.push({
          url: `${base}/${l}/destinations/${slug}`,
          lastModified: now,
        });
      }
    }
  }

  return urls;
}
