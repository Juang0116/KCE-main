/* src/app/not-found.tsx */
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
        <p className="text-xs uppercase tracking-widest text-[color:var(--color-muted)]">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Página no encontrada</h1>
        <p className="mt-3 text-sm text-[color:var(--color-muted)]">
          El enlace puede estar mal escrito o la página se movió.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl bg-brand-yellow px-4 py-2 text-sm font-semibold text-black shadow-soft hover:opacity-95"
          >
            Ir al inicio
          </Link>
          <Link
            href="/tours"
            className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-black/5"
          >
            Ver tours
          </Link>
        </div>
      </div>
    </main>
  );
}
