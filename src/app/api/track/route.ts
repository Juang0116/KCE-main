// src/app/api/track/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CTA_RE = /^[a-z0-9][a-z0-9._\-]{1,80}$/i;
const BLOCK_RE = /^[a-z0-9][a-z0-9._\-]{1,80}$/i;

type DedupeStore = Map<string, number>;

function getDedupeStore(): DedupeStore {
  if (!(globalThis as any).__kce_track_dedupe__) (globalThis as any).__kce_track_dedupe__ = new Map();
  return (globalThis as any).__kce_track_dedupe__ as DedupeStore;
}

function shouldDedupe(key: string, ttlMs: number): boolean {
  const store = getDedupeStore();
  const now = Date.now();
  const prev = store.get(key) || 0;
  if (now - prev < ttlMs) return true;
  store.set(key, now);

  // opportunistic cleanup
  if (store.size > 2000) {
    for (const [k, t] of store.entries()) {
      if (now - t > 5 * 60_000) store.delete(k);
    }
  }
  return false;
}

const Schema = z.object({
  type: z.enum(['ui.page.view', 'ui.block.view', 'ui.cta.click']),
  page: z.string().max(200).optional(),
  block: z.string().max(120).optional(),
  cta: z.string().max(120).optional(),
  props: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // rate limit by IP (best-effort)
  const rl = await checkRateLimit(req, { action: 'ui.track', limit: 120, windowSeconds: 60, identity: 'ip' });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  const { type, page, block, cta, props } = parsed.data;

  // strict allowlist for block/cta labels (anti-noise / anti-injection)
  if (cta && !CTA_RE.test(cta)) {
    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }
  if (block && !BLOCK_RE.test(block)) {
    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  const vid = (req.cookies.get('kce_vid')?.value || '').slice(0, 64);
  const dedupeKey = `ui:${vid || 'anon'}:${type}:${page || ''}:${block || ''}:${cta || ''}`;
  if (shouldDedupe(dedupeKey, 10_000)) {
    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  await logEvent(
    type,
    {
      page: page ?? null,
      block: block ?? null,
      cta: cta ?? null,
      props: props ?? null,
      ua: req.headers.get('user-agent') ?? null,
      ref: req.headers.get('referer') ?? null,
      requestId,
    },
    { source: 'web' },
  );

  return NextResponse.json(
    { ok: true, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
