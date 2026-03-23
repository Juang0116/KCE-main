/* src/app/(marketing)/tours/loading.tsx */
import { Search } from 'lucide-react';

/**
 * Tours Loading Skeleton - Premium Layout
 * Design Parity: Matches the immersive, glassmorphism layout of the Tours catalog.
 */

const CARDS = 6;

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'animate-pulse', 
        'bg-muted/10', // Pulso más sutil y elegante
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
      className="min-h-screen bg-base pb-24"
      aria-busy="true"
    >
      <p className="sr-only" role="status">Preparando catálogo de experiencias KCE...</p>

      {/* 01. HERO SKELETON (Paridad con Hero Dark) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-brand-dark/10">
        <div className="mx-auto max-w-3xl flex flex-col items-center space-y-8">
          {/* Badge */}
          <Sk className="h-8 w-44 rounded-full border border-white/10 bg-white/5" />
          {/* Title */}
          <div className="w-full flex flex-col items-center space-y-4">
             <Sk className="h-14 w-full sm:w-3/4 rounded-2xl bg-white/5" />
             <Sk className="h-14 w-2/3 rounded-2xl bg-white/5 opacity-60" />
          </div>
          {/* Subtitle */}
          <Sk className="h-6 w-5/6 sm:w-2/3 rounded-xl mt-4 bg-white/5 opacity-40" />
        </div>
      </section>

      {/* 02. QUICK NAV SKELETON (Editorial Pills) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row justify-center gap-12 md:gap-24">
          {/* Destinos */}
          <div className="flex flex-col items-center md:items-start gap-6 w-full md:w-1/2">
            <Sk className="h-4 w-32 rounded-md opacity-20" />
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Sk className="h-10 w-24 rounded-full" />
              <Sk className="h-10 w-32 rounded-full" />
              <Sk className="h-10 w-28 rounded-full" />
              <Sk className="h-10 w-20 rounded-full" />
            </div>
          </div>
          {/* Estilos */}
          <div className="flex flex-col items-center md:items-start gap-6 w-full md:w-1/2 md:border-l md:border-brand-dark/5 md:pl-24">
            <Sk className="h-4 w-32 rounded-md opacity-20" />
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Sk className="h-10 w-32 rounded-full" />
              <Sk className="h-10 w-20 rounded-full" />
              <Sk className="h-10 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 03. FILTERS & GRID SKELETON */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-12">
        
        {/* TOOLBAR LITE SKELETON */}
        <div className="mb-16 border-b border-brand-dark/5 pb-16 flex flex-col lg:flex-row gap-6 justify-between items-end">
           <Sk className="h-14 w-full lg:w-[600px] rounded-2xl bg-surface-2 border border-brand-dark/5" />
           <Sk className="h-12 w-32 rounded-full opacity-40" />
        </div>

        {/* RESULTS TEXT SKELETON */}
        <div className="mb-10 space-y-3">
          <Sk className="h-3 w-24 rounded-full opacity-20" />
          <Sk className="h-8 w-56 rounded-xl opacity-40" />
        </div>

        {/* CARDS GRID SKELETON (Match con TourCardPremium) */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i} className="flex flex-col rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface overflow-hidden shadow-soft">
              {/* Media Aspect Ratio */}
              <Sk className="aspect-[4/5] w-full rounded-none" />
              
              {/* Content Body */}
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <Sk className="h-8 w-full rounded-xl" />
                  <Sk className="h-4 w-2/3 rounded-lg opacity-50" />
                </div>
                
                {/* Bottom Bar */}
                <div className="pt-8 border-t border-brand-dark/5 flex justify-between items-center">
                   <div className="space-y-2">
                     <Sk className="h-3 w-16 rounded-full opacity-30" />
                     <Sk className="h-5 w-24 rounded-lg" />
                   </div>
                   <Sk className="h-12 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}