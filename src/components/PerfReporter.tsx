'use client';

import { useEffect } from 'react';

function safeNumber(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return n;
}

export function PerfReporter() {
  useEffect(() => {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return;

      const payload = {
        metric: 'nav.timing',
        value: safeNumber(nav.duration),
        page: location.pathname,
        props: {
          ttfb: safeNumber(nav.responseStart - nav.requestStart),
          dns: safeNumber(nav.domainLookupEnd - nav.domainLookupStart),
          tcp: safeNumber(nav.connectEnd - nav.connectStart),
          tls: safeNumber(nav.secureConnectionStart ? nav.connectEnd - nav.secureConnectionStart : null),
          request: safeNumber(nav.responseStart - nav.requestStart),
          response: safeNumber(nav.responseEnd - nav.responseStart),
          domInteractive: safeNumber(nav.domInteractive),
          domContentLoaded: safeNumber(nav.domContentLoadedEventEnd),
          load: safeNumber(nav.loadEventEnd),
        },
      };

      // Fire-and-forget
      void fetch('/api/track/perf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      // ignore
    }
  }, []);

  return null;
}
