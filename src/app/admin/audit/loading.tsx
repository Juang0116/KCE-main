/**
 * Admin Analytics Loading Skeleton
 * Mimetiza la jerarquía del Executive Analytics para evitar Layout Shift.
 */

function Sk({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[var(--color-surface-2)] motion-reduce:animate-none ${className}`}
      aria-hidden="true"
    />
  );
}

export default function AdminAnalyticsLoading() {
  return (
    <main className="space-y-10 pb-24">
      
      {/* HEADER SKELETON */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-10">
        <div className="space-y-4">
          <Sk className="h-5 w-40 rounded-full opacity-40" /> {/* Eyebrow */}
          <Sk className="h-12 w-64 rounded-2xl" />          {/* Title */}
          <Sk className="h-4 w-full max-w-md opacity-50" />  {/* Subtitle */}
        </div>
        <Sk className="h-10 w-32 rounded-full" />            {/* Button */}
      </header>

      {/* WORKBENCH SKELETON (Signals) */}
      <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-4">
            <Sk className="h-8 w-48 rounded-xl" />
            <Sk className="h-4 w-full opacity-60" />
            <Sk className="h-4 w-2/3 opacity-60" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 shrink-0">
            <Sk className="h-20 w-32 rounded-2xl" />
            <Sk className="h-20 w-32 rounded-2xl" />
            <Sk className="h-20 w-32 rounded-2xl" />
          </div>
        </div>
      </section>

      {/* MAIN DATA VAULT SKELETON */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-2xl space-y-10">
        {/* Controls row */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-8">
          <Sk className="h-10 w-40 rounded-xl" />
          <Sk className="h-10 w-24 rounded-xl" />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Sk className="h-32 rounded-[2.5rem]" />
          <Sk className="h-32 rounded-[2.5rem]" />
          <Sk className="h-32 rounded-[2.5rem]" />
          <Sk className="h-32 rounded-[2.5rem]" />
        </div>

        {/* Table placeholder */}
        <div className="space-y-4 pt-4">
          <Sk className="h-8 w-64 rounded-xl" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Sk key={i} className="h-16 w-full rounded-2xl opacity-40" />
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}