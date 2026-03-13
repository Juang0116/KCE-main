// src/lib/ctaAttribution.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

export type CtaAttribution = {
  cta: string | null;
  cta_page: string | null;
  cta_at: string | null;
};

export type MultiTouchAttribution = {
  first: {
    cta: string | null;
    cta_page: string | null;
    cta_at: string | null;
  };
  last: {
    cta: string | null;
    cta_page: string | null;
    cta_at: string | null;
  };
};

export type LandingAttribution = {
  landing_path: string | null;
  landing_at: string | null;
};

function clean(v: string | null | undefined, max: number): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

function safePath(v: string | null | undefined, max = 200): string | null {
  const s = clean(v, max);
  if (!s) return null;

  // avoid storing query strings (PII risk)
  const q = s.indexOf('?');
  const base = q >= 0 ? s.slice(0, q) : s;

  const out = base.slice(0, max).trim();
  return out ? out : null;
}

function cookieValue(req: NextRequest, name: string): string | null {
  // Some Next.js typings/contexts can treat req.cookies as possibly undefined.
  return req.cookies?.get(name)?.value ?? null;
}

export function readCtaAttributionFromCookies(req: NextRequest): CtaAttribution {
  const cta = clean(cookieValue(req, 'kce_last_cta'), 120);
  const cta_page = safePath(cookieValue(req, 'kce_last_cta_page'), 200);
  const cta_at_raw = clean(cookieValue(req, 'kce_last_cta_at'), 40);

  // Best-effort ISO validation
  const cta_at = cta_at_raw && !Number.isNaN(Date.parse(cta_at_raw)) ? cta_at_raw : null;

  return { cta, cta_page, cta_at };
}

export function readMultiTouchAttributionFromCookies(req: NextRequest): MultiTouchAttribution {
  const first_cta = clean(cookieValue(req, 'kce_first_cta'), 120);
  const first_cta_page = safePath(cookieValue(req, 'kce_first_cta_page'), 200);
  const first_cta_at_raw = clean(cookieValue(req, 'kce_first_cta_at'), 40);

  const first_cta_at =
    first_cta_at_raw && !Number.isNaN(Date.parse(first_cta_at_raw)) ? first_cta_at_raw : null;

  const last = readCtaAttributionFromCookies(req);

  return {
    first: { cta: first_cta, cta_page: first_cta_page, cta_at: first_cta_at },
    last,
  };
}

/**
 * Reads first landing path + timestamp (best-effort) from cookies set by CtaClickListener.
 * These are non-PII (path only, no query string).
 */
export function readLandingFromCookies(req: NextRequest): LandingAttribution {
  const landing_path = safePath(cookieValue(req, 'kce_landing_path'), 200);
  const landing_at_raw = clean(cookieValue(req, 'kce_landing_at'), 40);
  const landing_at = landing_at_raw && !Number.isNaN(Date.parse(landing_at_raw)) ? landing_at_raw : null;
  return { landing_path, landing_at };
}
