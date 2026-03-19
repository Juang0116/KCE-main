import { Search } from 'lucide-react';

/**
 * Tours Loading Skeleton - Premium Layout
 * Design Parity: Matches the clean, glassmorphism layout of the Tours catalog.
 */

const CARDS = 6;

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'animate-pulse', 
        'bg-[var(--color-surface-2)]',
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
      className="min-h-screen bg-[var(--color-bg)] pb-24"
      aria-busy="true"
    >
      <p className="sr-only" role="status">Preparando catálogo de experiencias KCE...</p>

      {/* HERO SKELETON (Seamless Light Layout) */}
      <section className="relative px-6 py-20 md:py-32 text-center border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-3xl flex flex-col items-center space-y-6">
          <Sk className="h-8 w-40 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]" />
          <Sk className="h-16 w-full sm:w-3/4 rounded-2xl" />
          <Sk className="h-6 w-5/6 sm:w-2/3 rounded-xl mt-4 opacity-60" />
        </div>
      </section>

      {/* QUICK NAV SKELETON (Floating Chips) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 pt-12 pb-6">
        <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
          <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-1/2">
            <Sk className="h-4 w-24 rounded-md opacity-40" />
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Sk className="h-9 w-20 rounded-full" /><Sk className="h-9 w-24 rounded-full" />
              <Sk className="h-9 w-28 rounded-full" /><Sk className="h-9 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-1/2 md:border-l md:border-[var(--color-border)] md:pl-16">
            <Sk className="h-4 w-24 rounded-md opacity-40" />
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Sk className="h-9 w-24 rounded-full" /><Sk className="h-9 w-16 rounded-full" />
              <Sk className="h-9 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* BODY CONTENT SKELETON */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-12">
        
        {/* TOOLBAR SKELETON */}
        <div className="mb-12 border-b border-[var(--color-border)] pb-12 flex flex-col sm:flex-row gap-4 justify-between">
           <Sk className="h-12 w-full sm:w-96 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
           <div className="flex gap-2 w-full sm:w-auto">
             <Sk className="h-12 w-28 rounded-xl" />
             <Sk className="h-12 w-28 rounded-xl" />
           </div>
        </div>

        {/* RESULTS HEADER SKELETON */}
        <div className="mb-8 space-y-2">
          <Sk className="h-3 w-20 rounded-sm opacity-30" />
          <Sk className="h-5 w-48 rounded-md opacity-60" />
        </div>

        {/* CARDS GRID SKELETON */}
        <div className="grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((i) => (
            <div key={i} className="flex flex-col rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-soft">
              {/* Image */}
              <Sk className="aspect-[4/3] w-full rounded-none" />
              {/* Body */}
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 w-3/4">
                    <Sk className="h-6 w-full rounded-md" />
                    <Sk className="h-4 w-1/2 rounded-md opacity-60" />
                  </div>
                  <Sk className="h-8 w-8 rounded-full" />
                </div>
                <div className="pt-4 border-t border-[var(--color-border)]/50 flex justify-between items-center">
                   <div className="space-y-1">
                     <Sk className="h-3 w-12 rounded-sm opacity-40" />
                     <Sk className="h-5 w-20 rounded-md" />
                   </div>
                   <Sk className="h-10 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}