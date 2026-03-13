// src/lib/internalFetch.server.ts
import 'server-only';

import { signInternalHmac } from '@/lib/internalHmac.server';

/**
 * internalFetch: server-side fetch to this same deployment with optional INTERNAL_HMAC signing.
 */
export async function internalFetch(input: {
  path: string; // e.g. '/api/admin/metrics/digest?days=1'
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<Response> {
  const method = (input.method || 'GET').toUpperCase();
  const urlBase =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.BASE_URL ||
    'http://localhost:3000';

  const path = input.path.startsWith('/') ? input.path : `/${input.path}`;
  const url = new URL(path, urlBase);

  const headers: Record<string, string> = { ...(input.headers || {}) };

  let bodyStr: string | undefined;
  if (input.body !== undefined && method !== 'GET' && method !== 'HEAD') {
    bodyStr = JSON.stringify(input.body);
    headers['content-type'] = headers['content-type'] || 'application/json';
  }

  const secret = String(process.env.INTERNAL_HMAC_SECRET || '').trim();
  if (secret) {
    const ts = Math.floor(Date.now() / 1000);
    const bodyBuf = bodyStr ? Buffer.from(bodyStr, 'utf-8') : Buffer.alloc(0);
    const signed = signInternalHmac({
      ts,
      method,
      path: url.pathname + url.search,
      body: bodyBuf,
      secret,
    });
    headers['x-kce-ts'] = signed.ts;
    headers['x-kce-sig'] = signed.sig;
  }

  const init: RequestInit = {
    method,
    headers,
    ...(bodyStr !== undefined ? { body: bodyStr } : {}),
  };

  return fetch(url.toString(), init);
}
