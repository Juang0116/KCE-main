/**
 * Global Marketing Loading Skeleton
 * Se activa durante transiciones de rutas en (marketing)
 */

const CARDS = 6;

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'animate-pulse',
        'bg-[color:var(--color-surface-2)]',
        'motion-reduce:animate-none',
        'rounded-2xl',
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
      className="mx-auto max-w-7xl px-6 py-12 md:py-20"
      aria-busy="true"
    >
      {/* Announcer para accesibilidad */}
      <p className="sr-only" role="status" aria-live="polite">
        Preparando contenido premium...
      </p>

      {/* HERO SKELETON (Copia la forma de las landings de hoy) */}
      <header className="relative mb-16 overflow-hidden rounded-[3.5rem] bg-brand-dark/5 p-10 md:p-20">
        <div className="max-w-3xl space-y-6">
          <Sk className="h-6 w-32 rounded-full opacity-40" /> {/* Eyebrow badge */}
          <Sk className="h-14 w-full md:w-3/4 rounded-3xl" />  {/* Title L1 */}
          <Sk className="h-14 w-1/2 rounded-3xl" />           {/* Title L2 */}
          <div className="pt-6 space-y-3">
            <Sk className="h-4 w-full opacity-50" />
            <Sk className="h-4 w-2/3 opacity-50" />
          </div>
        </div>
      </header>

      {/* GRID DE CONTENIDO (Mimetiza TourCardPremium) */}
      <section
        className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((i) => (
          <article
            key={i}
            className="flex flex-col overflow-hidden rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm"
          >
            {/* Image Placeholder */}
            <Sk className="aspect-[16/10] w-full rounded-none" />

            {/* Content Area */}
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <Sk className="h-8 w-full rounded-xl" />
                <Sk className="h-8 w-2/3 rounded-xl" />
              </div>

              {/* Footer info del card */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]/50">
                <div className="space-y-2">
                  <Sk className="h-3 w-16 opacity-40" />
                  <Sk className="h-6 w-24" />
                </div>
                <Sk className="h-10 w-10 rounded-full" />
              </div>

              {/* Tags/Chips */}
              <div className="flex gap-2">
                <Sk className="h-6 w-16 rounded-full opacity-30" />
                <Sk className="h-6 w-16 rounded-full opacity-30" />
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* FOOTER SKELETON SUTIL */}
      <footer className="mt-24 border-t border-[var(--color-border)] pt-12 text-center">
        <Sk className="mx-auto h-4 w-48 rounded-full opacity-20" />
      </footer>
    </main>
  );
}