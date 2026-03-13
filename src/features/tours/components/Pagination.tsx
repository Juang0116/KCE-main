// src/features/tours/components/Pagination.tsx
import Link from 'next/link';

type Props = {
  basePath: string;
  query: Record<string, string | undefined>;
  page: number;
  totalPages: number;
};

function buildHref(basePath: string, query: Record<string, string | undefined>, nextPage: number) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    const vv = (v ?? '').trim();
    if (vv) p.set(k, vv);
  }
  if (nextPage > 1) p.set('page', String(nextPage));
  else p.delete('page');

  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({ basePath, query, page, totalPages }: Props) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  return (
    <nav
      className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
      aria-label="Pagination"
    >
      <div className="text-[color:var(--color-text)]/65 text-sm">
        Página <span className="font-medium text-[color:var(--color-text)]">{page}</span> de{' '}
        <span className="font-medium text-[color:var(--color-text)]">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={buildHref(basePath, query, prev)}
          className={[
            'rounded-xl border px-3 py-2 text-sm',
            page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-black/5 dark:hover:bg-white/5',
          ].join(' ')}
        >
          ← Anterior
        </Link>

        <Link
          href={buildHref(basePath, query, next)}
          className={[
            'rounded-xl border px-3 py-2 text-sm',
            page >= totalPages
              ? 'pointer-events-none opacity-40'
              : 'hover:bg-black/5 dark:hover:bg-white/5',
          ].join(' ')}
        >
          Siguiente →
        </Link>
      </div>
    </nav>
  );
}
