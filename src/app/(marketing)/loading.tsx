/**
 * Global Marketing Loading Skeleton
 * Transición cinematográfica para la plataforma KCE
 */

const CARDS = 6;

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'animate-pulse',
        'bg-brand-blue/5', // Usamos el azul institucional con baja opacidad
        'motion-reduce:animate-none',
        'rounded-3xl',
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
      className="mx-auto max-w-7xl px-6 pb-24 pt-24 md:pt-40"
      aria-busy="true"
    >
      {/* Announcer para accesibilidad */}
      <p className="sr-only" role="status" aria-live="polite">
        Preparando tu próxima experiencia cultural...
      </p>

      {/* HERO SKELETON: Mimetiza el estilo editorial */}
      <header className="relative mb-20 overflow-hidden rounded-[4rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 md:p-20 shadow-sm text-center">
        <div className="mx-auto max-w-3xl flex flex-col items-center space-y-8">
          <Sk className="h-6 w-40 rounded-full opacity-20" /> {/* Eyebrow badge */}
          <div className="w-full space-y-4 flex flex-col items-center">
            <Sk className="h-16 w-full md:w-3/4 rounded-[2rem]" />  {/* Title L1 */}
            <Sk className="h-16 w-1/2 rounded-[2rem]" />            {/* Title L2 */}
          </div>
          <div className="pt-4 space-y-3 w-full flex flex-col items-center">
            <Sk className="h-4 w-2/3 opacity-30" />
            <Sk className="h-4 w-1/2 opacity-20" />
          </div>
        </div>
      </header>

      {/* GRID DE CONTENIDO: Estilo TourCard / VlogCard Premium */}
      <section
        className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((i) => (
          <article
            key={i}
            className="flex flex-col overflow-hidden rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-md"
          >
            {/* Image Placeholder con Aspect Ratio Editorial */}
            <Sk className="aspect-[16/11] w-full rounded-none opacity-40" />

            {/* Content Area */}
            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <Sk className="h-8 w-full rounded-2xl" />
                <Sk className="h-8 w-2/3 rounded-2xl" />
              </div>

              {/* Info Footer del Card */}
              <div className="flex items-center justify-between pt-6 border-t border-[color:var(--color-border)]">
                <div className="space-y-2">
                  <Sk className="h-3 w-20 opacity-20" />
                  <Sk className="h-7 w-28 rounded-xl opacity-30" />
                </div>
                <Sk className="h-14 w-14 rounded-2xl opacity-40" /> {/* CTA Placeholder */}
              </div>

              {/* Tags sutiles */}
              <div className="flex gap-3">
                <Sk className="h-6 w-20 rounded-full opacity-10" />
                <Sk className="h-6 w-20 rounded-full opacity-10" />
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* FOOTER LOADING */}
      <footer className="mt-32 text-center">
        <Sk className="mx-auto h-3 w-56 rounded-full opacity-10" />
      </footer>
    </main>
  );
}