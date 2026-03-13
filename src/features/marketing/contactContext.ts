export type MarketingLocale = 'es' | 'en' | 'fr' | 'de';

type Primitive = string | number | boolean | null | undefined;
type QueryValue = Primitive | Primitive[];

type QueryShape = Record<string, QueryValue>;

export function withLocale(locale: MarketingLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export function buildContextHref(locale: MarketingLocale, basePath: string, params: QueryShape = {}) {
  const href = withLocale(locale, basePath);
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      const compact = value
        .map((entry) => String(entry ?? '').trim())
        .filter(Boolean)
        .join(',');
      if (compact) qs.set(key, compact);
      continue;
    }

    const single = String(value ?? '').trim();
    if (single) qs.set(key, single);
  }

  const query = qs.toString();
  return query ? `${href}?${query}` : href;
}

export function splitCsv(value: string) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}
