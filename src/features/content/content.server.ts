// src/features/content/content.server.ts
import { getSupabasePublicOptional } from '@/lib/supabasePublic';

export type PublishedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_url: string | null;
  tags: string[];
  lang: string;
  published_at: string | null;
};

export type PublishedVideo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  youtube_url: string;
  cover_url: string | null;
  tags: string[];
  lang: string;
  published_at: string | null;
};

export async function listPublishedPosts(opts?: { lang?: string; tag?: string; limit?: number }) {
  const supabase = getSupabasePublicOptional();
  if (!supabase)
    return { items: [] as PublishedPost[], source: 'supabase-not-configured' as const };

  const limit = Math.min(Math.max(opts?.limit ?? 24, 1), 100);
  let q = supabase
    .from('posts')
    .select('id,slug,title,excerpt,content_md,cover_url,tags,lang,published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (opts?.lang) q = q.eq('lang', opts.lang);
  if (opts?.tag) q = q.contains('tags', [opts.tag]);

  const { data, error } = await q;
  if (error)
    return { items: [] as PublishedPost[], source: 'error' as const, error: error.message };

  return { items: (data ?? []) as PublishedPost[], source: 'supabase' as const };
}

export async function getPublishedPostBySlug(slug: string) {
  const supabase = getSupabasePublicOptional();
  if (!supabase)
    return { item: null as PublishedPost | null, source: 'supabase-not-configured' as const };

  const { data, error } = await supabase
    .from('posts')
    .select('id,slug,title,excerpt,content_md,cover_url,tags,lang,published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .maybeSingle();

  if (error)
    return { item: null as PublishedPost | null, source: 'error' as const, error: error.message };

  return { item: (data as PublishedPost | null) ?? null, source: 'supabase' as const };
}

export async function listPublishedVideos(opts?: { lang?: string; tag?: string; limit?: number }) {
  const supabase = getSupabasePublicOptional();
  if (!supabase)
    return { items: [] as PublishedVideo[], source: 'supabase-not-configured' as const };

  const limit = Math.min(Math.max(opts?.limit ?? 24, 1), 100);
  let q = supabase
    .from('videos')
    .select('id,slug,title,description,youtube_url,cover_url,tags,lang,published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (opts?.lang) q = q.eq('lang', opts.lang);
  if (opts?.tag) q = q.contains('tags', [opts.tag]);

  const { data, error } = await q;
  if (error)
    return { items: [] as PublishedVideo[], source: 'error' as const, error: error.message };

  return { items: (data ?? []) as PublishedVideo[], source: 'supabase' as const };
}

export async function getPublishedVideoBySlug(slug: string) {
  const supabase = getSupabasePublicOptional();
  if (!supabase)
    return { item: null as PublishedVideo | null, source: 'supabase-not-configured' as const };

  const { data, error } = await supabase
    .from('videos')
    .select('id,slug,title,description,youtube_url,cover_url,tags,lang,published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .maybeSingle();

  if (error)
    return { item: null as PublishedVideo | null, source: 'error' as const, error: error.message };

  return { item: (data as PublishedVideo | null) ?? null, source: 'supabase' as const };
}

export async function listDiscover(opts?: { lang?: string; tag?: string; limit?: number }) {
  const limit = Math.min(Math.max(opts?.limit ?? 24, 1), 100);

  // ✅ Construye args sin incluir undefined (exactOptionalPropertyTypes friendly)
  const common: { lang?: string; tag?: string; limit?: number } = { limit };
  if (opts?.lang) common.lang = opts.lang;
  if (opts?.tag) common.tag = opts.tag;

  const [postsRes, videosRes] = await Promise.all([
    listPublishedPosts(common),
    listPublishedVideos(common),
  ]);

  const items = [
    ...postsRes.items.map((p) => ({ kind: 'post' as const, ...p, ts: p.published_at ?? '' })),
    ...videosRes.items.map((v) => ({ kind: 'video' as const, ...v, ts: v.published_at ?? '' })),
  ].sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));

  return { items: items.slice(0, limit), source: 'supabase' as const };
}
