// src/lib/cors.ts
import { SITE_URL } from '@/lib/env';

/**
 * CORS policy (server):
 * - For a typical monolith (Next app only), you usually don't need CORS.
 * - If you call APIs cross-origin (separate frontend/domain), set CORS_ALLOW_ORIGINS.
 *
 * CORS_ALLOW_ORIGINS supports a comma-separated allowlist of exact origins:
 *   CORS_ALLOW_ORIGINS="https://kce.travel,https://www.kce.travel,http://localhost:3000"
 */
export function getAllowedOrigins(): string[] {
  const raw = (process.env.CORS_ALLOW_ORIGINS || '').trim();
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Fallback: SITE_URL / NEXT_PUBLIC_SITE_URL (if set) so QA can surface something predictable.
  const fallback = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (!list.length && fallback) {
    try {
      const u = new URL(fallback);
      return [u.origin];
    } catch {
      // ignore
    }
  }

  return list;
}

type CorsOptions = {
  methods?: string;
  allowHeaders?: string;
  exposeHeaders?: string;
  maxAgeSeconds?: number;
};

export function corsHeaders(req: Request, opts: CorsOptions = {}): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowed = getAllowedOrigins();
  if (!origin || !allowed.length) return {};
  if (!allowed.includes(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': opts.methods || 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': opts.allowHeaders || 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': opts.exposeHeaders || 'X-Request-ID',
    'Access-Control-Max-Age': String(opts.maxAgeSeconds ?? 600),
  };
}

export function corsPreflightResponse(req: Request, opts: CorsOptions = {}) {
  const headers = corsHeaders(req, opts);
  return new Response(null, { status: 204, headers });
}

// Backward-compatible alias (older routes import corsPreflight)
export function corsPreflight(req: Request, opts: CorsOptions = {}) {
  return corsPreflightResponse(req, opts);
}
