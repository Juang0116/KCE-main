'use client';

import * as React from 'react';

type BlockTrackerProps = {
  page: string;
  block: string;
  props?: Record<string, unknown>;
};

/**
 * Tracks block impressions (best-effort).
 * Optimized for KCE Command Center:
 * - IntersectionObserver with 25% visibility threshold.
 * - Fire-and-forget fetch to avoid blocking the UI thread.
 * - Prevents duplicate firing on re-renders.
 */
export default function BlockTracker({ page, block, props }: BlockTrackerProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const hasFired = React.useRef(false);

  // Stringify props to use in dependency array for deep comparison safety
  const propsString = JSON.stringify(props);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || hasFired.current) return;

    const fire = () => {
      if (hasFired.current) return;
      hasFired.current = true;

      // Beacon/Fetch best-effort
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ui.block.view',
          page,
          block,
          props: props ?? {},
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail: telemetría no debe romper la experiencia
      });
    };

    // SSR or Legacy Support
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      fire();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          fire();
          io.disconnect();
        }
      },
      { 
        root: null, 
        threshold: 0.25, // 25% visible = intención de lectura
        rootMargin: '0px' 
      },
    );

    io.observe(el);
    
    return () => {
      io.disconnect();
    };
  }, [page, block, propsString]);

  // Ancla invisible: h-0 w-0 para no afectar el layout
  return (
    <div 
      ref={ref} 
      aria-hidden="true" 
      className="pointer-events-none absolute h-px w-px opacity-0" 
      data-tracker={`${page}.${block}`}
    />
  );
}