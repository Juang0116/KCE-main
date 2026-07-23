/**
 * Admin Analytics Loading Skeleton
 * Mimetiza la jerarquía del FinOps Analytics para evitar Layout Shift.
 */

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-brand-dark/5 motion-reduce:animate-none dark:bg-white/5 ${className}`}
      aria-hidden="true"
    />
  );
}

export default function AdminAnalyticsLoading() {
  return (
    <main className="space-y-10 pb-24">
      {/* 01. HEADER SKELETON */}
      <header className="flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <Sk className="h-4 w-48 rounded-full opacity-60" /> {/* Eyebrow */}
          <Sk className="h-12 w-64 rounded-2xl md:w-96" /> {/* Title */}
          <Sk className="h-4 w-full max-w-xl opacity-40" /> {/* Subtitle Line 1 */}
          <Sk className="h-4 w-2/3 max-w-md opacity-40" /> {/* Subtitle Line 2 */}
        </div>
        <Sk className="h-12 w-40 rounded-full" /> {/* Button */}
      </header>

      {/* 02. WORKBENCH SKELETON (Signals) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-sm dark:border-white/5 md:p-12">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="flex-1 space-y-4">
            <Sk className="h-8 w-48 rounded-xl" />
            <Sk className="h-4 w-full opacity-60" />
            <Sk className="h-4 w-4/5 opacity-60" />
            <div className="flex gap-4 pt-4">
              <Sk className="h-10 w-32 rounded-xl" />
              <Sk className="h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-6 sm:grid-cols-3">
            <Sk className="h-24 w-32 rounded-2xl" />
            <Sk className="h-24 w-32 rounded-2xl" />
            <Sk className="h-24 w-32 rounded-2xl" />
          </div>
        </div>
      </section>

      {/* 03. MAIN DATA VAULT SKELETON */}
      <section className="space-y-10 rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:p-12">
        {/* Controls row */}
        <div className="flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-8 dark:border-white/5 sm:flex-row sm:items-center">
          <Sk className="h-12 w-48 rounded-2xl" /> {/* Dropdown */}
          <Sk className="h-12 w-40 rounded-full" /> {/* Sync Button */}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Sk className="h-32 rounded-[var(--radius-2xl)]" />
          <Sk className="h-32 rounded-[var(--radius-2xl)]" />
          <Sk className="h-32 rounded-[var(--radius-2xl)]" />
          <Sk className="h-32 rounded-[var(--radius-2xl)] border-brand-blue/10 bg-brand-blue/5" />
        </div>

        {/* Table placeholder */}
        <div className="space-y-6 pt-4">
          <Sk className="mb-6 h-8 w-64 rounded-xl" />
          <div className="space-y-3">
            <Sk className="h-12 w-full rounded-xl opacity-60" />
            {[...Array(4)].map((_, i) => (
              <Sk
                key={i}
                className="h-16 w-full rounded-xl opacity-40"
              />
            ))}
          </div>
        </div>

        {/* Footer placeholder */}
        <div className="mt-10 flex justify-center border-t border-brand-dark/5 pt-8 dark:border-white/5">
          <Sk className="h-4 w-64 rounded-full opacity-30" />
        </div>
      </section>
    </main>
  );
}
