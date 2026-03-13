// src/lib/net.ts
import 'server-only';

/** Best-effort client IP extraction (Vercel/Cloudflare/Proxy friendly). */
export function getClientIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    // x-forwarded-for: client, proxy1, proxy2
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const cf = headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf;
  return null;
}

/** Very small utility for stable identifiers in logs/rate limits. */
export function safeId(v: string | null | undefined, fallback = 'unknown'): string {
  const s = (v ?? '').trim();
  if (!s) return fallback;
  // keep it small and key-safe
  return s.replace(/\s+/g, '').slice(0, 80);
}
