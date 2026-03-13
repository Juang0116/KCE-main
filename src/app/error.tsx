/* src/app/error.tsx */
'use client';

import Link from 'next/link';
import * as React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log mínimo (servidor verá logs en Vercel / Node). Evita mostrar stack al usuario.

    console.error('[GlobalError]', { message: error?.message, digest: (error as any)?.digest });
  }, [error]);

  return (
    <div className="min-h-dvh bg-[color:var(--color-bg)] font-body text-[color:var(--color-text)]">
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
          <p className="text-xs uppercase tracking-widest text-[color:var(--color-muted)]">
            Error inesperado
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Algo salió mal</h1>
          <p className="mt-3 text-sm text-[color:var(--color-muted)]">
            Intenta de nuevo. Si vuelve a pasar, copia el código y envíanoslo para revisarlo.
          </p>

          {(error as any)?.digest ? (
            <p className="mt-4 rounded-lg bg-black/5 px-3 py-2 font-mono text-xs">
              digest: {(error as any).digest}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-brand-yellow px-4 py-2 text-sm font-semibold text-black shadow-soft hover:opacity-95"
            >
              Reintentar
            </button>
            <Link
              href="/"
              className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-black/5"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
