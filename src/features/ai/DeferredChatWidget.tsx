// src/features/ai/DeferredChatWidget.tsx
'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';

// Carga el widget como chunk separado (mejora LCP/TBT).
const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false,
  loading: () => null,
});

/**
 * Monta el ChatWidget en idle (o en cuanto el usuario intente abrir el chat).
 * Esto reduce el JS inicial sin romper el CTA.
 */
export default function DeferredChatWidget() {
  const [shouldLoad, setShouldLoad] = React.useState(false);
  const [openOnLoad, setOpenOnLoad] = React.useState(false);

  React.useEffect(() => {
    // Si llega con ?chat=open, lo cargamos pronto.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('chat') === 'open') {
        setOpenOnLoad(true);
        setShouldLoad(true);
      }
    } catch {
      /* ignore */
    }

    // Si el usuario intenta abrir antes de cargar, cargamos ya.
    // IMPORTANT:
    // - `ChatWidget` es un chunk dinámico.
    // - Si el usuario hace click en un CTA (kce:open-chat) antes de que el chunk
    //   termine de cargar, el evento puede "perderse" porque ChatWidget aún no
    //   alcanzó a registrar sus listeners.
    // Para evitarlo, forzamos `initialOpen` incluso si `shouldLoad` ya estaba en true.
    const ensure = () => {
      setOpenOnLoad(true);
      setShouldLoad(true);
    };

    window.addEventListener('kce:open-chat', ensure as any);
    window.addEventListener('kce:toggle-chat', ensure as any);

    const w = window as any;
    const idleId =
      typeof w.requestIdleCallback === 'function'
        ? w.requestIdleCallback(() => setShouldLoad(true), { timeout: 1500 })
        : window.setTimeout(() => setShouldLoad(true), 1200);

    return () => {
      window.removeEventListener('kce:open-chat', ensure as any);
      window.removeEventListener('kce:toggle-chat', ensure as any);
      if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!shouldLoad) return;
    if (!openOnLoad) return;
    // clear the flag after the widget has a chance to open itself
    const t = window.setTimeout(() => setOpenOnLoad(false), 250);
    return () => window.clearTimeout(t);
  }, [shouldLoad, openOnLoad]);

  return shouldLoad ? <ChatWidget initialOpen={openOnLoad} /> : null;
}
