'use client';

import * as React from 'react';
import { track } from '@/lib/track.client';

const cleanText = (s: string) => (s || '').trim().replace(/\s+/g, ' ').slice(0, 100);

const cleanHref = (href: string) => {
  const safeHref = href || '';
  
  try {
    const win = typeof window !== 'undefined' ? window : null;
    const base = win ? win.location.origin : 'https://kce.travel';
    
    const url = new URL(safeHref, base);
    return (url.pathname + url.search).slice(0, 150);
  } catch {
    // 1. Extraemos el split a una constante
    const parts = safeHref.split('#');
    // 2. Usamos un fallback garantizado para que TS vea que SIEMPRE hay un string
    const firstPart = parts[0] || ''; 
    
    return firstPart.slice(0, 150);
  }
};

export default function CtaClickListener() {
  React.useEffect(() => {
    // Capturamos la instancia de window en una constante local
    const win = typeof window !== 'undefined' ? window : null;
    
    // Si no hay window o no hay document, abortamos prematuramente
    if (!win || !win.document) return;

    const handler = (ev: MouseEvent) => {
      // Re-verificamos la constante local dentro del handler por seguridad de tipos
      if (!win || !win.location) return;

      const target = ev.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') return;

      const el = target.closest('[data-cta]') as HTMLElement | null;
      if (!el) return;

      const cta = (el.getAttribute('data-cta') || '').trim().toLowerCase();
      if (!cta) return;

      // Extraemos propiedades a constantes locales inmediatamente
      const currentPath = win.location.pathname;
      const hostname = win.location.hostname;
      const now = new Date().toISOString();
      const maxAge = 60 * 60 * 24 * 7; 
      const cookieConfig = `; Max-Age=${maxAge}; Path=/; SameSite=Lax`;

      try {
        const cookies = win.document.cookie || '';
        
        if (!cookies.includes('kce_first_cta=')) {
          win.document.cookie = `kce_first_cta=${encodeURIComponent(cta)}${cookieConfig}`;
          win.document.cookie = `kce_first_cta_page=${encodeURIComponent(currentPath)}${cookieConfig}`;
          win.document.cookie = `kce_first_cta_at=${encodeURIComponent(now)}${cookieConfig}`;
        }

        win.document.cookie = `kce_last_cta=${encodeURIComponent(cta)}${cookieConfig}`;
        win.document.cookie = `kce_last_cta_page=${encodeURIComponent(currentPath)}${cookieConfig}`;
        win.document.cookie = `kce_last_cta_at=${encodeURIComponent(now)}${cookieConfig}`;
      } catch (e) {
        console.warn('[Analytics] Cookie write failed', e);
      }

      const rawHref = el.getAttribute('href') || (el.closest('a') as HTMLAnchorElement | null)?.href;
      const text = cleanText(el.getAttribute('aria-label') || el.innerText || '');

      void track({
        type: 'ui.cta.click',
        cta,
        page: currentPath,
        props: {
          href: rawHref ? cleanHref(rawHref) : undefined,
          text: text || undefined,
          is_external: !!(rawHref?.startsWith('http') && !rawHref.includes(hostname)),
        },
      });
    };

    win.document.addEventListener('click', handler, { capture: true });
    return () => win.document.removeEventListener('click', handler, { capture: true });
  }, []);

  return null;
}