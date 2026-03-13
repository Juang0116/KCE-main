// src/app/(marketing)/tours/loading.tsx
// Server Component — no "use client"

const CARDS = 6;

/** Skeleton block (usa shimmer global .skeleton y respeta reduce motion) */
function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'skeleton',
        'motion-reduce:after:hidden motion-reduce:animate-none',
        'rounded-xl',
        // fallback color token-driven (mejor que bg-black/5 para light/dark)
        'bg-[color:var(--color-surface-2)]',
        className,
      ].join(' ')}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export default function Loading() {
  const items = Array.from({ length: CARDS }, (_, i) => i);

  return (
    <main
      className="mx-auto max-w-[var(--container-max)] px-4 py-10"
      aria-busy="true"
      aria-describedby="loading-announcer"
    >
      {/* Anunciador accesible para lectores de pantalla */}
      <p id="loading-announcer" className="sr-only" role="status" aria-live="polite">
        Cargando tours…
      </p>

      {/* Encabezado */}
      <header className="mb-6" aria-hidden="true">
        <Sk className="h-8 w-72 rounded-2xl" />
        <Sk className="mt-2 h-4 w-96 max-w-full rounded-2xl" />
      </header>

      {/* Toolbar */}
      <section className="card grid gap-3 p-4 md:grid-cols-4" aria-hidden="true">
        <Sk className="h-10" />
        <Sk className="h-10" />
        <Sk className="h-10" />
        <div className="flex gap-2">
          <Sk className="h-10 flex-1" />
          <Sk className="h-10 w-24" />
          <Sk className="h-10 w-20" />
        </div>
      </section>

      {/* Cards */}
      <section
        className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        aria-hidden="true"
      >
        {items.map((i) => (
          <article key={i} className="card overflow-hidden" role="presentation">
            {/* Imagen */}
            <div className="relative h-48 w-full">
              <Sk className="absolute inset-0 rounded-none" />
              {/* Cinta sutil (token-driven) */}
              <div
                className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[color:var(--color-surface)]/40 to-transparent"
                aria-hidden="true"
              />
            </div>

            {/* Contenido */}
            <div className="space-y-2 p-4">
              <Sk className="h-5 w-3/4" />
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-2/3" />

              <div className="mt-2 flex items-center justify-between">
                <Sk className="h-4 w-24" />
                <Sk className="h-5 w-20" />
              </div>

              <div className="flex gap-2 pt-2">
                <Sk className="h-6 w-20 rounded-full" />
                <Sk className="h-6 w-20 rounded-full" />
                <Sk className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
