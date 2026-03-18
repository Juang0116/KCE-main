/**
 * Tours Loading Skeleton
 * Design Parity: Matches the premium layout of the Tours catalog.
 * Performance: Minimal CSS overhead, token-driven colors.
 */

const CARDS = 6;

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'animate-pulse', // Animación sutil de desvanecimiento
        'rounded-2xl',
        'bg-[color:var(--color-surface-2)]',
        'motion-reduce:animate-none',
        className,
      ].join(' ')}
      aria-hidden="true"
    />
  );
}

export default function LoadingTours() {
  const items = Array.from({ length: CARDS }, (_, i) => i);

  return (
    <main 
      className="mx-auto max-w-7xl px-6 py-12 md:py-20"
      aria-busy="true"
    >
      {/* Lector de pantalla */}
      <p className="sr-only" role="status">Preparando catálogo de experiencias...</p>

      {/* HEADER SKELETON (Matching the new Hero style) */}
      <header className="relative mb-16 overflow-hidden rounded-[3.5rem] bg-[color:var(--color-surface-2)] p-10 md:p-20">
        <div className="max-w-3xl space-y-6">
          <Sk className="h-6 w-32 rounded-full opacity-50" /> {/* Eyebrow */}
          <Sk className="h-12 w-full md:w-3/4 rounded-3xl" /> {/* Title Line 1 */}
          <Sk className="h-12 w-1/2 rounded-3xl" />           {/* Title Line 2 */}
          <div className="pt-4 space-y-3">
            <Sk className="h-4 w-full opacity-60" />
            <Sk className="h-4 w-2/3 opacity-60" />
          </div>
        </div>
      </header>

      {/* TOOLBAR SKELETON */}
      <section className="mb-12 flex flex-col gap-8 border-b border-[var(--color-border)] pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 max-w-xl">
          <Sk className="h-14 rounded-2xl" /> {/* Search bar placeholder */}
        </div>
        <div className="flex gap-3">
          <Sk className="h-10 w-24 rounded-full" />
          <Sk className="h-10 w-24 rounded-full" />
        </div>
      </section>

      {/* CARDS GRID SKELETON */}
      <section className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((i) => (
          <div key={i} className="flex flex-col rounded-[2.5rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden shadow-sm">
            {/* Image area */}
            <Sk className="aspect-[16/10] w-full rounded-none" />
            
            {/* Content area */}
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <Sk className="h-8 w-full rounded-xl" />
                <Sk className="h-8 w-2/3 rounded-xl" />
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="space-y-2">
                  <Sk className="h-3 w-16 opacity-50" />
                  <Sk className="h-6 w-24" />
                </div>
                <Sk className="h-10 w-10 rounded-full" />
              </div>

              <div className="flex gap-2 pt-2">
                <Sk className="h-6 w-20 rounded-full opacity-40" />
                <Sk className="h-6 w-20 rounded-full opacity-40" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}