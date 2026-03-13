'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import * as React from 'react';

type Payload = Record<string, string>;

function pickUtm(params: URLSearchParams): Payload {
  const keys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
  ];
  const out: Payload = {};
  for (const k of keys) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export default function UtmTracker() {
  const pathname = usePathname();
  const params = useSearchParams();

  React.useEffect(() => {
    if (!params) return;
    const utm = pickUtm(params as any);
    const has = Object.keys(utm).length > 0;
    if (!has) return;

    const key = `kce.utm.captured:${pathname}:${utm.utm_campaign || ''}:${utm.utm_source || ''}`;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(key)) return;

    // store locally (30d) to reuse later (checkout / lead)
    try {
      const prev = JSON.parse(localStorage.getItem('kce.utm') || '{}');
      const merged = {
        ...prev,
        ...utm,
        last_path: pathname,
        captured_at: new Date().toISOString(),
      };
      localStorage.setItem('kce.utm', JSON.stringify(merged));
      window.sessionStorage.setItem(key, '1');
    } catch {
      // ignore
    }

    // send best-effort to server (events)
    void fetch('/api/events/utm-capture', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: pathname, ...utm }),
    }).catch(() => undefined);
  }, [pathname, params]);

  return null;
}
