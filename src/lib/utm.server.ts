// src/lib/utm.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

export type UtmInfo = {
  vid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Reads visitor + UTM info from cookies set by /api/events/utm-capture.
 * - kce_vid: visitor id
 * - kce_utm: JSON string with utm_* + gclid/fbclid
 */
export function readUtmFromCookies(req: NextRequest): UtmInfo {
  const vid = req.cookies.get('kce_vid')?.value ?? null;
  const raw = req.cookies.get('kce_utm')?.value ?? null;
  const utm = safeJsonParse<Partial<Record<string, string>>>(raw) ?? {};

  return {
    vid,
    utm_source: utm.utm_source ? String(utm.utm_source) : null,
    utm_medium: utm.utm_medium ? String(utm.utm_medium) : null,
    utm_campaign: utm.utm_campaign ? String(utm.utm_campaign) : null,
    utm_term: utm.utm_term ? String(utm.utm_term) : null,
    utm_content: utm.utm_content ? String(utm.utm_content) : null,
    gclid: utm.gclid ? String(utm.gclid) : null,
    fbclid: utm.fbclid ? String(utm.fbclid) : null,
  };
}

export function utmCompactKey(u: UtmInfo): string {
  const src = u.utm_source || 'direct';
  const med = u.utm_medium || 'none';
  const camp = u.utm_campaign || 'na';
  return `${src}/${med}/${camp}`;
}
