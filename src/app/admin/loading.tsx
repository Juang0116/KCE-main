/* src/app/admin/loading.tsx */

export default function AdminLoading() {
  return (
    <div className="py-10">
      <div className="h-7 w-48 animate-pulse rounded bg-black/10" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft"
          >
            <div className="h-24 w-full animate-pulse rounded-xl bg-black/10" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-black/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
