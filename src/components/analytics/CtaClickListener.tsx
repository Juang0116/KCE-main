// src/components/analytics/CtaClickListener.tsx
'use client';

import * as React from 'react';

import { track } from '@/lib/track.client';

function cleanText(s: string) {
  return (s || '').trim().replace(/\s+/g, ' ').slice(0, 140);
}

function cleanHref(href: string) {
  const noHash = (href || '').split('#')[0] || '';
  const noQuery = noHash.split('?')[0] || '';
  return noQuery.slice(0, 200);
}

export default function CtaClickListener() {
  React.useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      const el =
        (target.closest ? (target.closest('[data-cta]') as HTMLElement | null) : null) ?? null;
      if (!el) return;

      const cta = (el.getAttribute('data-cta') || '').trim();
      if (!cta) return;

      // Persist CTA attribution (best-effort, non-PII)
      try {
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        const now = new Date().toISOString();

        // First-touch: keep the very first CTA (and landing path) in a rolling window.
        // We only set these if not already present.
        const hasFirst = /(?:^|;\s*)kce_first_cta=/.test(document.cookie || '');
        if (!hasFirst) {
          document.cookie = `kce_first_cta=${encodeURIComponent(cta.slice(0, 120))}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
          document.cookie = `kce_first_cta_page=${encodeURIComponent(window.location.pathname.slice(0, 200))}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
          document.cookie = `kce_first_cta_at=${encodeURIComponent(now)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
        }

        const hasLanding = /(?:^|;\s*)kce_landing_path=/.test(document.cookie || '');
        if (!hasLanding) {
          document.cookie = `kce_landing_path=${encodeURIComponent(window.location.pathname.slice(0, 200))}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
          document.cookie = `kce_landing_at=${encodeURIComponent(now)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
        }

        // Last-touch: always update to the most recent CTA.
        document.cookie = `kce_last_cta=${encodeURIComponent(cta.slice(0, 120))}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
        document.cookie = `kce_last_cta_page=${encodeURIComponent(window.location.pathname.slice(0, 200))}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
        document.cookie = `kce_last_cta_at=${encodeURIComponent(now)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
      } catch {
        // ignore
      }

      const href =
        (el as any).href ||
        el.getAttribute('href') ||
        ((el.closest ? (el.closest('a') as any) : null)?.href as string | undefined);

      const text = cleanText(el.getAttribute('aria-label') || el.textContent || '');

      void track({
        type: 'ui.cta.click',
        cta,
        page: window.location.pathname,
        props: {
          href: href ? cleanHref(String(href)) : undefined,
          text: text || undefined,
        },
      });
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return null;
}
