/**
 * Admin Analytics Loading Skeleton
 * Mimetiza la jerarquía del FinOps Analytics para evitar Layout Shift.
 */

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-brand-dark/5 dark:bg-white/5 motion-reduce:animate-none ${className}`}
      aria-hidden="true"
    />
  );
}

export default function AdminAnalyticsLoading() {
  return (
    <main className="space-y-10 pb-24">
      
      {/* 01. HEADER SKELETON */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <Sk className="h-4 w-48 rounded-full opacity-60" /> {/* Eyebrow */}
          <Sk className="h-12 w-64 md:w-96 rounded-2xl" />   {/* Title */}
          <Sk className="h-4 w-full max-w-xl opacity-40" />  {/* Subtitle Line 1 */}
          <Sk className="h-4 w-2/3 max-w-md opacity-40" />   {/* Subtitle Line 2 */}
        </div>
        <Sk className="h-12 w-40 rounded-full" />            {/* Button */}
      </header>

      {/* 02. WORKBENCH SKELETON (Signals) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-12 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-4">
            <Sk className="h-8 w-48 rounded-xl" />
            <Sk className="h-4 w-full opacity-60" />
            <Sk className="h-4 w-4/5 opacity-60" />
            <div className="flex gap-4 pt-4">
              <Sk className="h-10 w-32 rounded-xl" />
              <Sk className="h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 shrink-0">
            <Sk className="h-24 w-32 rounded-2xl" />
            <Sk className="h-24 w-32 rounded-2xl" />
            <Sk className="h-24 w-32 rounded-2xl" />
          </div>
        </div>
      </section>

      {/* 03. MAIN DATA VAULT SKELETON */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-12 shadow-pop space-y-10">
        
        {/* Controls row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-8">
          <Sk className="h-12 w-48 rounded-2xl" /> {/* Dropdown */}
          <Sk className="h-12 w-40 rounded-full" /> {/* Sync Button */}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Sk className="h-32 rounded-[var(--radius-2xl)]" />
          <Sk className="h-32 rounded-[var(--radius-2xl)]" />
          <Sk className="h-32 rounded-[var(--radius-2xl)]" />
          <Sk className="h-32 rounded-[var(--radius-2xl)] bg-brand-blue/5 border-brand-blue/10" /> 
        </div>

        {/* Table placeholder */}
        <div className="space-y-6 pt-4">
          <Sk className="h-8 w-64 rounded-xl mb-6" />
          <div className="space-y-3">
            <Sk className="h-12 w-full rounded-xl opacity-60" />
            {[...Array(4)].map((_, i) => (
              <Sk key={i} className="h-16 w-full rounded-xl opacity-40" />
            ))}
          </div>
        </div>
        
        {/* Footer placeholder */}
        <div className="flex justify-center pt-8 border-t border-brand-dark/5 dark:border-white/5 mt-10">
           <Sk className="h-4 w-64 rounded-full opacity-30" />
        </div>
      </section>

    </main>
  );
}