// src/app/sitemap.ts
// Dynamic sitemap — tours from Supabase (or mock fallback) + static pages.
import type { MetadataRoute } from 'next';

import type { CatalogTour } from '@/features/tours/catalog.server';
import { listTours } from '@/features/tours/catalog.server';
import { listPublishedPosts } from '@/features/content/content.server';

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://kce.travel'
).replace(/\/+$/, '');

const LOCALES = ['es', 'en', 'fr', 'de'] as const;

type SitemapEntry = MetadataRoute.Sitemap[number];

function staticPages(): SitemapEntry[] {
  const pages = [
    { path: '', priority: 1.0, changeFreq: 'weekly' as const },
    { path: '/tours', priority: 0.95, changeFreq: 'daily' as const },
    { path: '/destinations', priority: 0.9, changeFreq: 'weekly' as const },
    { path: '/plan', priority: 0.9, changeFreq: 'weekly' as const },
    { path: '/contact', priority: 0.8, changeFreq: 'monthly' as const },
    { path: '/about', priority: 0.75, changeFreq: 'monthly' as const },
    { path: '/blog', priority: 0.8, changeFreq: 'daily' as const },
    { path: '/faq', priority: 0.7, changeFreq: 'monthly' as const },
    { path: '/trust', priority: 0.65, changeFreq: 'monthly' as const },
    { path: '/privacy', priority: 0.3, changeFreq: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFreq: 'yearly' as const },
    { path: '/policies/cancellation', priority: 0.4, changeFreq: 'yearly' as const },
  ];

  const entries: SitemapEntry[] = [];

  for (const page of pages) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFreq,
        priority: locale === 'es' ? page.priority : page.priority * 0.9,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${SITE}/${l}${page.path}`]),
          ),
        },
      });
    }
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: SitemapEntry[] = [...staticPages()];

  // Tour detail pages
  try {
    const { items: tours } = await listTours({ limit: 200, sort: 'popular' });
    for (const tour of tours as CatalogTour[]) {
      const slug = (tour as { slug?: string }).slug;
      if (!slug) continue;
      for (const locale of LOCALES) {
        entries.push({
          url: `${SITE}/${locale}/tours/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: locale === 'es' ? 0.9 : 0.8,
          alternates: {
            languages: Object.fromEntries(
              LOCALES.map((l) => [l, `${SITE}/${l}/tours/${slug}`]),
            ),
          },
        });
      }
    }
  } catch {
    // best-effort — don't fail sitemap on DB error
  }

  // Blog post pages
  try {
    const { items: posts } = await listPublishedPosts({ limit: 200 });
    for (const post of posts) {
      const locale = (post.lang as typeof LOCALES[number]) || 'es';
      entries.push({
        url: `${SITE}/${locale}/blog/${post.slug}`,
        lastModified: post.published_at ? new Date(post.published_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  } catch {
    // best-effort
  }

  return entries;
}
