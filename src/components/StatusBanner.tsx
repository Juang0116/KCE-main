'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';

type BannerState =
  | { visible: false }
  | {
      visible: true;
      kind: 'offline' | 'supabase_unreachable' | 'supabase_misconfigured' | 'unknown';
      message: string;
      requestId?: string;
    };

function normalizeKindFromHealth(out: any): BannerState {
  const requestId = typeof out?.requestId === 'string' ? out.requestId : undefined;

  // configured=false => env/config ausente
  if (out?.configured === false) {
    return {
      visible: true,
      kind: 'supabase_misconfigured',
      message:
        'El sistema de autenticación no está configurado. Falta configuración de Supabase en el servidor.',
      requestId,
    };
  }

  // kind NETWORK => caída/red
  if (out?.kind === 'NETWORK') {
    return {
      visible: true,
      kind: 'supabase_unreachable',
      message:
        'Hay un problema temporal de conexión con el servidor (auth / datos). Puedes seguir navegando; intenta de nuevo en unos minutos.',
      requestId,
    };
  }

  // Otros fallos: tabla/RLS
  if (out?.ok === false) {
    return {
      visible: true,
      kind: 'unknown',
      message: 'Hay un problema temporal con el servidor. Si persiste, contáctanos por WhatsApp.',
      requestId,
    };
  }

  return { visible: false };
}

export default function StatusBanner() {
  const [state, setState] = React.useState<BannerState>({ visible: false });
  const [dismissed, setDismissed] = React.useState(false);
  const [failCount, setFailCount] = React.useState(0);

  const checkHealth = React.useCallback(async () => {
    if (dismissed) return;

    // Offline short-circuit
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState({
        visible: true,
        kind: 'offline',
        message:
          'Parece que no tienes conexión a internet. Algunas funciones (login, wishlist) pueden fallar.',
      });
      return;
    }

    try {
      const res = await fetch('/api/health/supabase', { cache: 'no-store' });
      const out = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Reduce noise: only show the banner after 2 consecutive failures.
        setFailCount((n) => n + 1);
        if (failCount + 1 >= 2) setState(normalizeKindFromHealth({ ...out, ok: false }));
        return;
      }

      const next = normalizeKindFromHealth(out);
      if (next.visible) {
        setFailCount((n) => n + 1);
        if (failCount + 1 >= 2) setState(next);
      } else {
        setFailCount(0);
        setState(next);
      }
    } catch {
      setFailCount((n) => n + 1);
      if (failCount + 1 >= 2) {
        setState({
          visible: true,
          kind: 'supabase_unreachable',
          message:
            'Hay un problema temporal de conexión con el servidor. Intenta de nuevo en unos minutos.',
        });
      }
    }
  }, [dismissed, failCount]);

  React.useEffect(() => {
    void checkHealth();

    // Poll suave: no agresivo
    const id = setInterval(() => {
      void checkHealth();
    }, 90_000);

    return () => clearInterval(id);
  }, [checkHealth]);

  React.useEffect(() => {
    function onNetEvent(e: Event) {
      if (dismissed) return;

      const detail = (e as CustomEvent).detail as { kind?: string } | undefined;

      if (detail?.kind === 'offline') {
        setState({
          visible: true,
          kind: 'offline',
          message:
            'Parece que no tienes conexión a internet. Algunas funciones (login, wishlist) pueden fallar.',
        });
        return;
      }

      // fetch_failed / timeout
      setState({
        visible: true,
        kind: 'supabase_unreachable',
        message:
          'Estamos teniendo problemas de conexión con autenticación. Si estabas iniciando sesión, intenta de nuevo en unos minutos.',
      });
    }

    window.addEventListener('kce:net', onNetEvent);
    return () => window.removeEventListener('kce:net', onNetEvent);
  }, [dismissed]);

  if (!state.visible) return null;

  return (
    <div className="sticky top-[var(--header-h)] z-[var(--z-header)] border-b border-amber-200 bg-amber-50/95 backdrop-blur dark:border-amber-900/40 dark:bg-amber-950/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-amber-950 dark:text-amber-100">
          <div className="font-semibold">Aviso del sistema</div>
          <div className="mt-0.5 text-amber-950/80 dark:text-amber-100/85">{state.message}</div>
          {state.requestId ? (
            <div className="mt-1 text-[0.75rem] text-amber-950/60 dark:text-amber-100/60">
              Ref: <span className="font-mono">{state.requestId}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void checkHealth()}
          >
            Reintentar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDismissed(true);
              setState({ visible: false });
            }}
          >
            Ocultar
          </Button>
        </div>
      </div>
    </div>
  );
}
