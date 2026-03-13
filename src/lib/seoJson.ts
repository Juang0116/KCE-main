// src/lib/seoJson.ts

/**
 * Safely stringify JSON-LD to avoid breaking HTML parsing.
 * (Escapes <, >, &)
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Canonical base URL for absolute links.
 * Prefer NEXT_PUBLIC_SITE_URL; fallback is https://kce.travel.
 */
export function getPublicBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');
}

export function absoluteUrl(pathOrUrl: string): string {
  const s = String(pathOrUrl || '').trim();
  if (!s) return getPublicBaseUrl();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const base = getPublicBaseUrl();
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}
