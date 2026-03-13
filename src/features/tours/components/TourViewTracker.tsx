// src/features/tours/components/TourViewTracker.tsx
'use client';

import * as React from 'react';

/**
 * Tracker ligero de vistas.
 *
 * - Dispara un POST (fire-and-forget).
 * - El servidor dedupea usando cookie (por tour) para no inflar métricas.
 */
export function TourViewTracker({ slug }: { slug: string }) {
  React.useEffect(() => {
    const s = (slug || '').trim();
    if (!s) return;

    const ctrl = new AbortController();

    fetch('/api/events/view-tour', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      keepalive: true,
      signal: ctrl.signal,
      body: JSON.stringify({ slug: s }),
    }).catch(() => {});

    return () => ctrl.abort();
  }, [slug]);

  return null;
}
