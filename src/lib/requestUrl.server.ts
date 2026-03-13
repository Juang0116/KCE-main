import "server-only";

import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["es", "en", "fr", "de"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = "es";

function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return Boolean(value && (SUPPORTED_LOCALES as readonly string[]).includes(value));
}

function normalizeLocale(value: string | null | undefined): SupportedLocale | null {
  const v = String(value || "").trim().toLowerCase();
  if (isSupportedLocale(v)) return v;
  return null;
}

function parseLocaleFromPath(pathname: string): SupportedLocale | null {
  const m = pathname.match(/^\/([a-z]{2})(?=\/|$)/i);
  return normalizeLocale(m?.[1]);
}

function parseLocaleFromAcceptLanguage(header: string | null): SupportedLocale | null {
  if (!header) return null;
  const parts = header
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [tag, ...params] = part.split(';').map((x) => x.trim());
      const qParam = params.find((p) => p.startsWith('q='));
      const q = qParam ? Number(qParam.slice(2)) : 1;
      return { tag: (tag || '').toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const part of parts) {
    const base = part.tag.split('-')[0];
    const loc = normalizeLocale(base);
    if (loc) return loc;
  }

  return null;
}

export function getRequestOrigin(req: NextRequest): string {
  const headers = req.headers;
  const proto = (headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '') ?? 'http')
    .split(',')[0]
    ?.trim() || 'http';
  const host = (headers.get('x-forwarded-host') ?? headers.get('host') ?? req.nextUrl.host ?? '')
    .split(',')[0]
    ?.trim() || '';

  if (host) return `${proto}://${host}`.replace(/\/+$/, '');

  const envOrigin =
    (process.env.SITE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_SITE_URL || '').trim() ||
    'http://localhost:3000';

  return envOrigin.replace(/\/+$/, '');
}

export function detectRequestLocale(req: NextRequest): SupportedLocale {
  const fromHeader = normalizeLocale(req.headers.get('x-kce-locale'));
  if (fromHeader) return fromHeader;

  const fromPath = parseLocaleFromPath(req.nextUrl.pathname);
  if (fromPath) return fromPath;

  const fromReferer = (() => {
    const referer = (req.headers.get('referer') || '').trim();
    if (!referer) return null;
    try {
      return parseLocaleFromPath(new URL(referer).pathname);
    } catch {
      return null;
    }
  })();
  if (fromReferer) return fromReferer;

  const fromCookie = normalizeLocale(req.cookies.get('kce.locale')?.value);
  if (fromCookie) return fromCookie;

  const fromAcceptLanguage = parseLocaleFromAcceptLanguage(req.headers.get('accept-language'));
  if (fromAcceptLanguage) return fromAcceptLanguage;

  return DEFAULT_LOCALE;
}

export function getLocalePrefix(req: NextRequest): `/${SupportedLocale}` {
  return `/${detectRequestLocale(req)}`;
}
