'use client';

import Link from 'next/link';
import * as React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // En producción, aquí podrías enviar el error a Sentry o Logtail
    console.error('[GlobalError Boundary]', { 
      message: error.message, 
      digest: error.digest 
    });
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[color:var(--color-bg)] px-4 font-body text-[color:var(--color-text)]">
      <main className="w-full max-w-xl">
        <div className="overflow-hidden rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-soft md:p-12">
          
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-8 w-8" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600/70">
            Error de sistema
          </p>
          
          <h1 className="mt-4 font-heading text-3xl text-brand-blue md:text-4xl">
            Vaya, algo no salió como esperábamos
          </h1>
          
          <p className="mt-4 text-sm leading-relaxed text-[color:var(--color-text-muted)] md:text-base">
            Hubo un problema técnico al cargar esta página. Puedes intentar recargarla o volver al inicio para continuar explorando.
          </p>

          {error.digest && (
            <div className="mt-8 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">ID del error (Digest)</p>
              <code className="mt-1 block font-mono text-xs font-medium text-slate-600 selection:bg-brand-yellow">
                {error.digest}
              </code>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar ahora
            </button>
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] px-6 py-3 text-sm font-bold transition-colors hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-[color:var(--color-text-muted)]">
          ¿Necesitas ayuda inmediata? <Link href="/contact" className="underline hover:text-brand-blue">Contacta a nuestro equipo</Link>
        </p>
      </main>
    </div>
  );
}