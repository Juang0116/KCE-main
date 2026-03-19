'use client';

import * as React from 'react';

/**
 * Verifica si el error es un fallo de carga de fragmentos de Next.js.
 */
function isChunkLoadError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
      ? err
      : '';

  return (
    msg.includes('ChunkLoadError') ||
    msg.includes('Loading chunk') ||
    (msg.includes('failed') && msg.includes('_next/static/chunks'))
  );
}

/**
 * Componente invisible que escucha fallos de red/despliegue 
 * y fuerza una recarga controlada.
 */
export default function ChunkLoadRecovery() {
  React.useEffect(() => {
    const RELOAD_KEY = 'kce_chunk_reload_timestamp';
    const COOLDOWN_MS = 10_000; // 10 segundos para evitar bucles de recarga

    const shouldAttemptReload = (): boolean => {
      const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
      const now = Date.now();
      
      if (now - lastReload < COOLDOWN_MS) return false;
      
      sessionStorage.setItem(RELOAD_KEY, String(now));
      return true;
    };

    const handleChunkError = (error: unknown) => {
      if (isChunkLoadError(error) && shouldAttemptReload()) {
        console.warn('KCE: ChunkLoadError detectado. Recargando para actualizar assets...');
        window.location.reload();
      }
    };

    const onError = (event: ErrorEvent) => handleChunkError(event.error);
    const onRejection = (event: PromiseRejectionEvent) => handleChunkError(event.reason);

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}