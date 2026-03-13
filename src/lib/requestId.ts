// src/lib/requestId.ts
// Request id helpers used across API routes, server components and middleware.
// IMPORTANT: this module is shared by multiple codepaths and historically had
// different call styles. We support BOTH:
//   - getRequestId(req.headers)
//   - getRequestId(req)
//   - getRequestId()  (best-effort)
//   - withRequestId(headersInit, rid)
//   - withRequestId(req, handler)

import type { NextRequest, NextResponse } from 'next/server';

const MAX_LEN = 120;

function safe(v: string | null | undefined) {
  const s = (v ?? '').trim();
  return s.length ? s.slice(0, MAX_LEN) : '';
}

function newId() {
  // globalThis.crypto.randomUUID exists in modern Node and in Edge runtimes.
  const g = globalThis as any;
  if (typeof g?.crypto?.randomUUID === 'function') return g.crypto.randomUUID() as string;

  // Very last-resort fallback (should almost never happen)
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function extract(headers: Headers): string {
  const fromHeader =
    safe(headers.get('x-request-id')) ||
    safe(headers.get('x-correlation-id')) ||
    safe(headers.get('cf-ray'));

  return fromHeader || newId();
}

/**
 * Standard: accept upstream request ids if present, otherwise generate one.
 * Supports:
 *  - getRequestId(req.headers)
 *  - getRequestId(req)
 *  - getRequestId() (best-effort)
 */
export function getRequestId(input?: Headers | { headers: Headers } | null): string {
  if (input && (input as any).get) return extract(input as Headers);
  if (input && (input as any).headers) return extract((input as any).headers as Headers);

  // Best-effort: attempt to read from Next's request headers (server-only).
  // If unavailable (edge/client contexts), fall back to generated id.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nextHeaders = require('next/headers') as { headers: () => Headers };
    const h = nextHeaders.headers();
    return extract(h);
  } catch {
    return newId();
  }
}

export function withRequestId(
  headersInit: HeadersInit | undefined,
  requestId: string,
): HeadersInit;
export function withRequestId(
  req: NextRequest,
  handler: () => Promise<NextResponse> | NextResponse,
): Promise<NextResponse>;
export function withRequestId(
  arg1: any,
  arg2: any,
): any {
  // Mode A: header helper
  if (typeof arg2 === 'string') {
    const base = (arg1 ?? {}) as Record<string, string>;
    return {
      ...base,
      'X-Request-ID': arg2,
      ...(base['Cache-Control'] ? {} : { 'Cache-Control': 'no-store' }),
    } satisfies HeadersInit;
  }

  // Mode B: wrapper (req, handler)
  const req = arg1 as NextRequest;
  const handler = arg2 as () => Promise<NextResponse> | NextResponse;
  const rid = getRequestId(req.headers);
  return Promise.resolve(handler()).then((res) => {
    try {
      if (!res.headers.get('X-Request-ID')) res.headers.set('X-Request-ID', rid);
      if (!res.headers.get('Cache-Control')) res.headers.set('Cache-Control', 'no-store');
    } catch {
      // ignore
    }
    return res;
  });
}
