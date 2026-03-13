'use client';

import * as React from 'react';

type BlockTrackerProps = {
  page: string;
  block: string;
  props?: Record<string, unknown>;
};

/**
 * Tracks block impressions (best-effort).
 * - Sends: { type: 'ui.block.view', page, block, props }
 * - Uses IntersectionObserver when available.
 */
export default function BlockTracker({ page, block, props }: BlockTrackerProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let didFire = false;

    const fire = () => {
      if (didFire) return;
      didFire = true;

      // best-effort (no throw)
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ui.block.view',
          page,
          block,
          props: props ?? undefined,
        }),
      }).catch(() => {});
    };

    // If IO not available, fire immediately
    if (typeof window === 'undefined' || !(window as any).IntersectionObserver) {
      fire();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((e) => e.isIntersecting);
        if (anyVisible) {
          fire();
          io.disconnect();
        }
      },
      { root: null, threshold: 0.25 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [page, block, props]);

  // invisible anchor
  return <div ref={ref} aria-hidden="true" className="pointer-events-none h-0 w-0" />;
}
