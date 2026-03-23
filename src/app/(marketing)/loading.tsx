/* src/app/(marketing)/loading.tsx */

/**
 * Global Marketing Loading Skeleton
 * Transición cinematográfica sincronizada con el ADN Premium de KCE.
 */

const CARDS = 6;

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'animate-pulse',
        'bg-muted/10', // Pulso sutil y sofisticado
        'motion-reduce:animate-none',
        'rounded-[var(--radius-2xl)]',
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
      className="min-h-screen bg-base"
      aria-busy="true"
    >
      {/* Announcer para accesibilidad */}
      <p className="sr-only" role="status" aria-live="polite">
        Preparando tu próxima experiencia cultural en Knowing Cultures S.A.S...
      </p>

      {/* 01. HERO SKELETON (Paridad con Hero Immersivo Dark) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-40 text-center border-b border-white/5">
        <div className="mx-auto max-w-4xl flex flex-col items-center space-y-10">
          {/* Badge superior */}
          <Sk className="h-8 w-44 rounded-full bg-white/5 border border-white/10" /> 
          
          {/* Headline masivo en dos líneas */}
          <div className="w-full space-y-4 flex flex-col items-center">
            <Sk className="h-14 md:h-20 w-full sm:w-3/4 bg-white/5" />
            <Sk className="h-14 md:h-20 w-1/2 bg-white/5 opacity-60" />
          </div>
          
          {/* Párrafo descriptivo */}
          <div className="pt-4 space-y-3 w-full flex flex-col items-center">
            <Sk className="h-4 w-2/3 bg-white/5 opacity-40" />
            <Sk className="h-4 w-1/2 bg-white/5 opacity-20" />
          </div>
        </div>
      </section>

      {/* 02. GRID DE CONTENIDO (Fiel al diseño de TourCardPremium) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-20 md:py-32">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <article
              key={i}
              className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-soft"
            >
              {/* Media Placeholder: Aspect Ratio de TourCard (4/5) */}
              <Sk className="aspect-[4/5] w-full rounded-none opacity-20" />

              {/* Área de Texto con espaciado editorial */}
              <div className="p-8 md:p-10 space-y-8">
                <div className="space-y-4">
                  <Sk className="h-8 w-full rounded-xl" />
                  <Sk className="h-8 w-2/3 rounded-xl opacity-60" />
                </div>

                {/* Info Footer del Card (Precio/Ubicación) */}
                <div className="flex items-center justify-between pt-8 border-t border-brand-dark/5">
                  <div className="space-y-3">
                    <Sk className="h-3 w-16 opacity-20 rounded-full" />
                    <Sk className="h-6 w-24 rounded-lg opacity-40" />
                  </div>
                  {/* Círculo de acción */}
                  <Sk className="h-12 w-12 rounded-full opacity-30" /> 
                </div>

                {/* Tags minimalistas */}
                <div className="flex gap-2">
                  <Sk className="h-6 w-16 rounded-full opacity-10" />
                  <Sk className="h-6 w-20 rounded-full opacity-10" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER LOADING INDICATOR */}
      <footer className="pb-20 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow animate-bounce" />
          <Sk className="h-3 w-40 rounded-full opacity-10" />
        </div>
      </footer>
    </main>
  );
}