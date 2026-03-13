// src/components/analytics/PageViewListener.tsx
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { track } from '@/lib/track.client';

/**
 * Minimal page-view tracker for App Router navigation.
 * - Logs `ui.page.view` on initial mount and on pathname changes.
 * - Does NOT include query strings (PII risk), track.client already strips them.
 */
export default function PageViewListener() {
  const pathname = usePathname();
  const lastRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const p = pathname || '/';
    if (lastRef.current === p) return;
    lastRef.current = p;
    void track({ type: 'ui.page.view', page: p });
  }, [pathname]);

  return null;
}
