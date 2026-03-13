/* src/middleware.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { getRequestId } from '@/lib/requestId';

/**
 * Middleware unificado (prod-ready):
 * - i18n por prefijo (/es|/en|/fr|/de) usando rewrite (sin duplicar rutas)
 * - Protección BasicAuth para /admin y /api/admin (incluye rutas con prefijo de idioma)
 * - Manejo de preflight OPTIONS para /api/admin (evita romper fetch desde navegador)
 * - Headers de seguridad ligeros + no-store para admin
 *
 * Nota: CSP/HSTS “grandes” se gestionan en next.config.ts (headers()).
 */

const LOCALES = ['es', 'en', 'fr', 'de'] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'es';

function withRequestIdHeader(req: NextRequest) {
  const id = getRequestId(req.headers);
  const h = new Headers(req.headers);
  if (!h.get('x-request-id')) h.set('x-request-id', id);
  return { id, headers: h };
}

function isLocale(v: string | null | undefined): v is Locale {
  return Boolean(v && (LOCALES as readonly string[]).includes(v));
}

function splitLocale(pathname: string): { locale: Locale | null; restPath: string } {
  const m = pathname.match(/^\/([a-zA-Z]{2})(?=\/|$)/);
  const cand = m?.[1]?.toLowerCase();
  if (!isLocale(cand)) return { locale: null, restPath: pathname };
  const rest = pathname.replace(/^\/[a-zA-Z]{2}(?=\/|$)/, '') || '/';
  return { locale: cand, restPath: rest };
}

function isLocalDevHost(host: string | null | undefined): boolean {
  const value = String(host || '').trim().toLowerCase();
  if (!value) return false;
  const bare = value.split(':')[0] || '';
  return bare === 'localhost' || bare === '127.0.0.1';
}

function isBypassPath(pathname: string): boolean {
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/assets')
  ) {
    return true;
  }
  // Archivos estáticos con extensión (png, svg, css, js, etc.)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return false;
}



function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [];
  // Ej: "en-US,en;q=0.9,es;q=0.8"
  return header
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [tag, ...params] = part.split(';').map((x) => x.trim());
      const qParam = params.find((p) => p.startsWith('q='));
      const q = qParam ? Number(qParam.slice(2)) : 1;
      return { tag: (tag || '').toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q)
    .map((x) => x.tag);
}

function pickPreferredLocale(req: NextRequest): Locale {
  const cookieLocale = req.cookies.get('kce.locale')?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const langs = parseAcceptLanguage(req.headers.get('accept-language'));
  for (const l of langs) {
    const baseCode = l.split('-')[0];
    if (isLocale(baseCode)) return baseCode;
  }

  return DEFAULT_LOCALE;
}

function applyLocale(res: NextResponse, locale: Locale) {
  res.headers.set('x-kce-locale', locale);
  res.cookies.set('kce.locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

function stampRequestId(res: NextResponse, requestId: string) {
  res.headers.set('X-Request-ID', requestId);
  return res;
}

function applySecurityHeaders(res: NextResponse, isAdmin: boolean) {
  // Headers seguros y compatibles (CSP/HSTS fuertes ya viven en next.config.ts)
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Consistente con next.config.ts
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');

  if (isAdmin) {
    // No-cache para admin y APIs admin
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
  }

  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const rid = withRequestIdHeader(req);

  // 1) Detectar prefijo de idioma (si existe)
  const { locale, restPath } = splitLocale(pathname);
  const effectivePath = locale ? restPath : pathname;

  const isAdmin =
    effectivePath.startsWith('/admin') ||
    effectivePath.startsWith('/api/admin') ||
    // Rutas internas de diagnóstico: nunca deben ser públicas en prod
    effectivePath.startsWith('/_debug');
  const isApi = effectivePath.startsWith('/api');

  // 2) Permitir preflight OPTIONS para /api/admin/* (evita romper fetch en navegador)
  if (req.method === 'OPTIONS' && effectivePath.startsWith('/api/admin')) {
    if (locale) {
      const res = NextResponse.rewrite(new URL(restPath + search, req.url), { request: { headers: rid.headers } });
      stampRequestId(applySecurityHeaders(res, true), rid.id);
    return applyLocale(res, locale);
    }
    const res = NextResponse.next({ request: { headers: rid.headers } });
    stampRequestId(applySecurityHeaders(res, true), rid.id);
    return res;
  }

    // 3) Protección admin (panel + APIs admin)
  if (isAdmin) {
    // Nuevo modelo (P0.9+): cookie HttpOnly admin_token contra ADMIN_TOKEN.
    // Evita problemas de BasicAuth en navegadores y unifica UI (/admin/login).
    const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();

    // Local-only explicit dev bypass. Never allow implicit preview/staging bypass.
    const allowAdminDevOpen =
      process.env.NODE_ENV !== 'production' &&
      ['1', 'true', 'yes', 'on'].includes(String(process.env.ADMIN_DEV_OPEN || '').trim().toLowerCase()) &&
      isLocalDevHost(req.headers.get('host'));

    if (allowAdminDevOpen && !ADMIN_TOKEN) {
      if (locale) {
        const res = NextResponse.rewrite(new URL(restPath + search, req.url), { request: { headers: rid.headers } });
        stampRequestId(applySecurityHeaders(res, true), rid.id);
    return applyLocale(res, locale);
      }
      const res = NextResponse.next({ request: { headers: rid.headers } });
      stampRequestId(applySecurityHeaders(res, true), rid.id);
    return res;
    }

    // Permitir login/logout sin estar autenticado
    const allowPaths = new Set<string>(['/admin/login', '/api/admin/auth/login', '/api/admin/auth/logout']);
    if (allowPaths.has(effectivePath)) {
      if (locale) {
        const res = NextResponse.rewrite(new URL(restPath + search, req.url), { request: { headers: rid.headers } });
        stampRequestId(applySecurityHeaders(res, true), rid.id);
    return applyLocale(res, locale);
      }
      const res = NextResponse.next({ request: { headers: rid.headers } });
      stampRequestId(applySecurityHeaders(res, true), rid.id);
    return res;
    }

    if (!ADMIN_TOKEN) {
      const res = new NextResponse('Admin token not configured', { status: 503 });
      stampRequestId(applySecurityHeaders(res, true), rid.id);
    return res;
    }

    const provided = (req.cookies.get('admin_token')?.value || '').trim();
    const ok = provided && provided === ADMIN_TOKEN;

    if (!ok) {
      // APIs admin: 401 JSON. Panel: redirect a /admin/login.
      if (effectivePath.startsWith('/api/admin')) {
        const res = new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        });
        stampRequestId(applySecurityHeaders(res, true), rid.id);
    return res;
      }

      const next = encodeURIComponent(effectivePath + search);
      const url = new URL(`/admin/login?next=${next}`, req.url);
      const res = NextResponse.redirect(url);
      stampRequestId(applySecurityHeaders(res, true), rid.id);
    return res;
    }
  }

// 4) Bypass de estáticos (pero NO bypass general de /api; solo no forzamos i18n)
  if (isBypassPath(effectivePath)) {
    if (locale) {
      const res = NextResponse.rewrite(new URL(restPath + search, req.url), { request: { headers: rid.headers } });
      stampRequestId(applySecurityHeaders(res, isAdmin), rid.id);
    return applyLocale(res, locale);
    }
    const res = NextResponse.next({ request: { headers: rid.headers } });
    stampRequestId(applySecurityHeaders(res, isAdmin), rid.id);
    return res;
  }

  // 5) APIs (no admin): no forzar i18n. (pero si venían con prefijo, reescribe y setea locale)
  if (isApi) {
    if (locale) {
      const res = NextResponse.rewrite(new URL(restPath + search, req.url), { request: { headers: rid.headers } });
      stampRequestId(applySecurityHeaders(res, isAdmin), rid.id);
    return applyLocale(res, locale);
    }
    const res = NextResponse.next({ request: { headers: rid.headers } });
    stampRequestId(applySecurityHeaders(res, isAdmin), rid.id);
    return res;
  }

  // 6) Si ya hay prefijo, rewrite interno y persistimos cookie
  if (locale) {
    const res = NextResponse.rewrite(new URL(restPath + search, req.url), { request: { headers: rid.headers } });
    stampRequestId(applySecurityHeaders(res, isAdmin), rid.id);
    return applyLocale(res, locale);
  }

  // 7) Si NO hay prefijo, redirigimos al locale preferido
  const pref = pickPreferredLocale(req);
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = `/${pref}${pathname === '/' ? '' : pathname}`;

  const res = NextResponse.redirect(redirectUrl);
  stampRequestId(applySecurityHeaders(res, isAdmin), rid.id);
    return applyLocale(res, pref);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
