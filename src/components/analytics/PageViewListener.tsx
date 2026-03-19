'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { track } from '@/lib/track.client';

/**
 * Minimal page-view tracker for App Router navigation.
 * - Logs `ui.page.view` on initial mount and on pathname changes.
 * - Silently handles internal navigation without duplicate fires.
 */
export default function PageViewListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Generamos una llave única basada en el path 
    // (y opcionalmente parámetros de marketing si fuera necesario)
    const currentPath = pathname || '/';
    const currentKey = currentPath;

    // Evitar disparos duplicados en re-renders que no sean de navegación
    if (lastKeyRef.current === currentKey) return;
    lastKeyRef.current = currentKey;

    // Fire and forget: track.client se encarga de la limpieza de PII
    void track({ 
      type: 'ui.page.view', 
      page: currentPath,
      props: {
        title: document.title,
        referrer: document.referrer || undefined
      }
    });
    
    // Si GA4 está cargado (gtag), notificamos el cambio de página manual
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: currentPath,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname, searchParams]); // Escuchamos cambios en path y params

  return null;
}