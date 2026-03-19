'use client';

import * as React from 'react';
import { AlertCircle, WifiOff, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import clsx from 'clsx';

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

  if (out?.configured === false) {
    return {
      visible: true,
      kind: 'supabase_misconfigured',
      message: 'Configuración de seguridad incompleta. Algunas funciones de usuario están desactivadas.',
      requestId,
    };
  }

  if (out?.kind === 'NETWORK' || out?.ok === false) {
    return {
      visible: true,
      kind: 'supabase_unreachable',
      message: 'Conexión inestable con el centro de datos. Tu experiencia puede verse limitada.',
      requestId,
    };
  }

  return { visible: false };
}

export default function StatusBanner() {
  const [state, setState] = React.useState<BannerState>({ visible: false });
  const [dismissed, setDismissed] = React.useState(false);
  const [failCount, setFailCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const checkHealth = React.useCallback(async () => {
    if (dismissed) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState({
        visible: true,
        kind: 'offline',
        message: 'Sin conexión a internet. Los cambios no se guardarán hasta que vuelvas a estar en línea.',
      });
      return;
    }

    try {
      setIsRetrying(true);
      const res = await fetch('/api/health/supabase', { cache: 'no-store' });
      const out = await res.json().catch(() => ({}));

      if (!res.ok) {
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
        setState({ visible: false });
      }
    } catch {
      setFailCount((n) => n + 1);
      if (failCount + 1 >= 2) {
        setState({
          visible: true,
          kind: 'supabase_unreachable',
          message: 'Error de red persistente. Revisa tu conexión.',
        });
      }
    } finally {
      setIsRetrying(false);
    }
  }, [dismissed, failCount]);

  // Polling y Eventos
  React.useEffect(() => {
    void checkHealth();
    const id = setInterval(checkHealth, 60_000);
    return () => clearInterval(id);
  }, [checkHealth]);

  React.useEffect(() => {
    const onNetEvent = (e: Event) => {
      if (dismissed) return;
      const detail = (e as CustomEvent).detail;
      if (detail?.kind === 'offline') {
        setState({ visible: true, kind: 'offline', message: 'Modo offline activado.' });
      } else {
        void checkHealth();
      }
    };
    window.addEventListener('kce:net', onNetEvent);
    return () => window.removeEventListener('kce:net', onNetEvent);
  }, [dismissed, checkHealth]);

  if (!state.visible) return null;

  return (
    <div className={clsx(
      "sticky top-[var(--header-h)] z-[var(--z-header)] w-full border-b transition-all duration-300",
      "border-amber-500/20 bg-amber-50/90 backdrop-blur-md dark:border-amber-500/10 dark:bg-amber-950/40"
    )}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            {state.kind === 'offline' ? <WifiOff size={16} /> : <AlertCircle size={16} />}
          </div>
          <div className="text-sm">
            <span className="font-bold text-amber-900 dark:text-amber-100">Aviso: </span>
            <span className="text-amber-900/80 dark:text-amber-100/70">{state.message}</span>
            {state.requestId && (
              <span className="ml-2 font-mono text-[10px] opacity-50 uppercase tracking-tighter">
                ID: {state.requestId}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void checkHealth()}
            className="hidden h-8 gap-2 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300 sm:flex"
            disabled={isRetrying}
          >
            <RefreshCw size={14} className={clsx(isRetrying && "animate-spin")} />
            {isRetrying ? 'Reintentando...' : 'Reintentar'}
          </Button>
          <button
            onClick={() => { setDismissed(true); setState({ visible: false }); }}
            className="p-1 text-amber-700/50 hover:text-amber-700 dark:text-amber-300/50 dark:hover:text-amber-300"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}