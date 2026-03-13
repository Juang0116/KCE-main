/* src/app/(marketing)/loading.tsx */
// Server Component — no "use client"

const CARDS = 6;

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        // usa tu shimmer global si existe (".skeleton")
        'skeleton',
        // fallback token-driven (mejor en light/dark)
        'bg-[color:var(--color-surface-2)]',
        // reduce motion friendly
        'motion-reduce:after:hidden motion-reduce:animate-none',
        'rounded-xl',
        className,
      ].join(' ')}
      aria-hidden="true"
    />
  );
}

export default function MarketingLoading() {
  const items = Array.from({ length: CARDS }, (_, i) => i);

  return (
    <main
      className="mx-auto max-w-6xl px-4 py-10"
      aria-busy="true"
      aria-describedby="marketing-loading-announcer"
    >
      {/* announcer para screen readers */}
      <p id="marketing-loading-announcer" className="sr-only" role="status" aria-live="polite">
        Cargando…
      </p>

      {/* Header skeleton */}
      <header className="space-y-3" aria-hidden="true">
        <Sk className="h-8 w-56 rounded-2xl" />
        <Sk className="h-4 w-96 max-w-full rounded-2xl" />
      </header>

      {/* Cards */}
      <section
        aria-label="Cargando contenido"
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden="true"
      >
        {items.map((i) => (
          <article
            key={i}
            className="card overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft"
          >
            {/* image */}
            <div className="relative h-40 w-full">
              <Sk className="absolute inset-0 rounded-xl" />
              <div
                className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-brand-blue/15 to-transparent"
                aria-hidden="true"
              />
            </div>

            {/* text */}
            <div className="mt-4 space-y-2">
              <Sk className="h-5 w-3/4" />
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-2/3" />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
