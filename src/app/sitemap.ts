import type { MetadataRoute } from 'next';
import { listTours } from '@/features/tours/catalog.server';
import { listPublishedPosts } from '@/features/content/content.server';

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://kce.travel'
).replace(/\/+$/, '');

const LOCALES = ['es', 'en', 'fr', 'de'] as const;
type SupportedLocale = (typeof LOCALES)[number];

function getStaticEntries(): MetadataRoute.Sitemap {
  const pages = [
    { path: '', priority: 1.0, changeFreq: 'weekly' as const },
    { path: '/tours', priority: 0.95, changeFreq: 'daily' as const },
    { path: '/destinations', priority: 0.9, changeFreq: 'weekly' as const },
    { path: '/contact', priority: 0.8, changeFreq: 'monthly' as const },
    { path: '/about', priority: 0.75, changeFreq: 'monthly' as const },
    { path: '/blog', priority: 0.8, changeFreq: 'daily' as const },
    { path: '/privacy', priority: 0.3, changeFreq: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFreq: 'yearly' as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of LOCALES) {
      const path = `${SITE}/${locale}${page.path}`;
      entries.push({
        url: path,
        lastModified: new Date(),
        changeFrequency: page.changeFreq,
        priority: locale === 'es' ? page.priority : page.priority * 0.9,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${SITE}/${l}${page.path}`])
          ),
        },
      });
    }
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [...getStaticEntries()];

  // 1. Tours Dinámicos
  try {
    const { items: tours } = await listTours({ limit: 500, sort: 'popular' });
    
    for (const tour of tours) {
      if (!tour.slug) continue;

      for (const locale of LOCALES) {
        const tourPath = `/tours/${tour.slug}`;
        entries.push({
          url: `${SITE}/${locale}${tourPath}`,
          // Cambiado a new Date() para coincidir con tus tipos actuales
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: locale === 'es' ? 0.9 : 0.8,
          alternates: {
            languages: Object.fromEntries(
              LOCALES.map((l) => [l, `${SITE}/${l}${tourPath}`])
            ),
          },
        });
      }
    }
  } catch (error) {
    console.error('[Sitemap Tour Error]:', error);
  }

  // 2. Posts del Blog
  try {
    const { items: posts } = await listPublishedPosts({ limit: 500 });
    
    for (const post of posts) {
      const locale = (post.lang as SupportedLocale) || 'es';
      const postPath = `/blog/${post.slug}`;

      entries.push({
        url: `${SITE}/${locale}${postPath}`,
        // Usamos published_at si existe (común en blogs) o fecha actual
        lastModified: (post as any).published_at ? new Date((post as any).published_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error('[Sitemap Blog Error]:', error);
  }

  return entries;
}