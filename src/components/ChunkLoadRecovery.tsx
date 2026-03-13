'use client';

import * as React from 'react';

function isChunkLoadError(err: unknown) {
  const msg =
    typeof err === 'string'
      ? err
      : err && typeof err === 'object' && 'message' in err
        ? String((err as any).message)
        : '';

  return (
    msg.includes('ChunkLoadError') ||
    msg.includes('Loading chunk') ||
    msg.includes('failed') && msg.includes('_next/static/chunks')
  );
}

export default function ChunkLoadRecovery() {
  React.useEffect(() => {
    // Evita loops infinitos: solo recarga 1 vez cada 10s.
    const key = 'kce_chunk_reload_at';
    const canReload = () => {
      const last = Number(sessionStorage.getItem(key) || '0');
      const now = Date.now();
      if (now - last < 10_000) return false;
      sessionStorage.setItem(key, String(now));
      return true;
    };

    const onError = (event: ErrorEvent) => {
      if (!event?.error) return;
      if (isChunkLoadError(event.error) && canReload()) {
        location.reload();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason) && canReload()) {
        location.reload();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
