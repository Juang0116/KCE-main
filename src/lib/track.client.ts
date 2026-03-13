// src/lib/track.client.ts
'use client';

type TrackPayload = {
  type: 'ui.page.view' | 'ui.block.view' | 'ui.cta.click';
  page?: string;
  block?: string;
  cta?: string;
  props?: Record<string, unknown>;
};

function safePathname(pathname: string | null | undefined): string | null {
  const p = (pathname ?? '').trim();
  if (!p) return null;
  // avoid logging PII in query strings
  const base = p.split('?')[0] ?? '';
  const out = base.slice(0, 200).trim();
  return out ? out : null;
}

export async function track(payload: TrackPayload): Promise<void> {
  try {
    const page = payload.page ? safePathname(payload.page) : null;

    // With exactOptionalPropertyTypes: true, do NOT send `page: undefined`.
    const body: TrackPayload = {
      ...payload,
      ...(page ? { page } : {}),
    };

    await fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // best-effort
  }
}
