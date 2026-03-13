// src/features/tours/components/ToursToolbarLite.tsx
'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Sort = 'popular' | 'price-asc' | 'price-desc';

export type ToursToolbarLiteProps = {
  /**
   * `city` is optional and mainly used by SEO pages (e.g. /tours/tag/[tag])
   * so they can pass through the current filter without fighting TS.
   */
  initial: { q: string; tag: string; sort: Sort; pmin?: string; pmax?: string; city?: string };
  tags: string[];
};

function normalizeSort(v?: string | null): Sort {
  return v === 'price-asc' || v === 'price-desc' ? v : 'popular';
}

function uniqList(list: string[]) {
  return Array.from(new Set(list.map((x) => String(x || '').trim()).filter(Boolean)));
}

function buildQS(
  base: URLSearchParams,
  values: { q?: string; tag?: string; sort?: Sort; pmin?: string; pmax?: string },
) {
  const p = new URLSearchParams(base.toString());
  for (const k of ['q', 'tag', 'sort', 'pmin', 'pmax', 'page'] as const) p.delete(k);

  const q = (values.q || '').trim();
  if (q) p.set('q', q);
  if (values.tag) p.set('tag', values.tag);
  if (values.sort && values.sort !== 'popular') p.set('sort', values.sort);

  const pmin = (values.pmin || '').trim();
  const pmax = (values.pmax || '').trim();
  if (pmin) p.set('pmin', pmin);
  if (pmax) p.set('pmax', pmax);

  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

export default function ToursToolbarLite({ initial, tags }: ToursToolbarLiteProps) {
  const router = useRouter();
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw || '/tours';
  const searchParams = useSearchParams();

  const tagOptions = React.useMemo(() => uniqList(tags).sort(), [tags]);

  const [q, setQ] = React.useState(initial.q ?? '');
  const [tag, setTag] = React.useState(initial.tag ?? '');
  const [sort, setSort] = React.useState<Sort>(initial.sort ?? 'popular');
  const [pmin, setPmin] = React.useState(initial.pmin ?? '');
  const [pmax, setPmax] = React.useState(initial.pmax ?? '');

  const qRef = React.useRef(q);
  const tagRef = React.useRef(tag);
  const sortRef = React.useRef(sort);
  const pminRef = React.useRef(pmin);
  const pmaxRef = React.useRef(pmax);

  React.useEffect(() => {
    qRef.current = q;
    tagRef.current = tag;
    sortRef.current = sort;
    pminRef.current = pmin;
    pmaxRef.current = pmax;
  }, [q, tag, sort, pmin, pmax]);

  const [isPending, startTransition] = React.useTransition();
  const didMountRef = React.useRef(false);
  const didMountPriceRef = React.useRef(false);

  React.useEffect(() => {
    if (!searchParams) return;
    const spQ = searchParams.get('q') ?? '';
    const spTag = searchParams.get('tag') ?? '';
    const spSort = normalizeSort(searchParams.get('sort'));
    const spPmin = searchParams.get('pmin') ?? '';
    const spPmax = searchParams.get('pmax') ?? '';

    if (spQ !== qRef.current) setQ(spQ);
    if (spTag !== tagRef.current) setTag(spTag);
    if (spSort !== sortRef.current) setSort(spSort);
    if (spPmin !== pminRef.current) setPmin(spPmin);
    if (spPmax !== pmaxRef.current) setPmax(spPmax);
  }, [searchParams]);

  const apply = React.useCallback(
    (opts?: { replace?: boolean; next?: Partial<{ q: string; tag: string; sort: Sort; pmin: string; pmax: string }> }) => {
      const nextQ = opts?.next?.q ?? q;
      const nextTag = opts?.next?.tag ?? tag;
      const nextSort = opts?.next?.sort ?? sort;
      const nextPmin = opts?.next?.pmin ?? pmin;
      const nextPmax = opts?.next?.pmax ?? pmax;

      const base = searchParams ?? new URLSearchParams();
      const qs = buildQS(base, { q: nextQ, tag: nextTag, sort: nextSort, pmin: nextPmin, pmax: nextPmax });
      const href = `${pathname}${qs}`;

      const current = searchParams ? `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}` : `${pathname}`;
      if (href === current) return;

      startTransition(() => {
        if (opts?.replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [q, tag, sort, pmin, pmax, pathname, router, searchParams],
  );

  const clear = React.useCallback(() => {
    setQ('');
    setTag('');
    setSort('popular');
    setPmin('');
    setPmax('');

    startTransition(() => {
      const base = searchParams ?? new URLSearchParams();
      const p = new URLSearchParams(base.toString());
      for (const k of ['q', 'tag', 'sort', 'pmin', 'pmax', 'page'] as const) p.delete(k);
      const qs = p.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  const hasFilters = Boolean(q.trim() || tag || pmin.trim() || pmax.trim() || (sort && sort !== 'popular'));

  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const spQ = searchParams?.get('q') ?? '';
    if (q.trim() === spQ.trim()) return;
    const id = window.setTimeout(() => apply({ replace: true, next: { q } }), 300);
    return () => window.clearTimeout(id);
  }, [q, apply, searchParams]);

  React.useEffect(() => {
    if (!didMountPriceRef.current) {
      didMountPriceRef.current = true;
      return;
    }
    const sp = searchParams?.get('pmin') ?? '';
    const next = (pmin || '').trim();
    if (next === sp.trim()) return;
    const id = window.setTimeout(() => apply({ replace: true, next: { pmin: next } }), 300);
    return () => window.clearTimeout(id);
  }, [pmin, apply, searchParams]);

  React.useEffect(() => {
    if (!didMountPriceRef.current) return;
    const sp = searchParams?.get('pmax') ?? '';
    const next = (pmax || '').trim();
    if (next === sp.trim()) return;
    const id = window.setTimeout(() => apply({ replace: true, next: { pmax: next } }), 300);
    return () => window.clearTimeout(id);
  }, [pmax, apply, searchParams]);

  const showTag = tagOptions.length > 0;

  return (
    <form
      role="search"
      aria-label="Filtros"
      aria-busy={isPending || undefined}
      className={[
        'grid gap-3 rounded-2xl border p-4 shadow-soft md:grid-cols-6',
        'border-[color:var(--color-border)] bg-[color:var(--color-surface)]',
      ].join(' ')}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="flex flex-col md:col-span-2">
        <label htmlFor="tours-q" className="sr-only">Buscar</label>
        <input
          id="tours-q"
          name="q"
          inputMode="search"
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          onBlur={() => apply({ replace: true, next: { q } })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Buscar (p. ej. café, historia)…"
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
        />
      </div>

      {showTag ? (
      <div className="flex flex-col md:col-span-2">
        <label htmlFor="tours-tag" className="sr-only">Estilo</label>
        <select
          id="tours-tag"
          name="tag"
          value={tag}
          onChange={(e) => {
            const v = e.currentTarget.value;
            setTag(v);
            apply({ next: { tag: v } });
          }}
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="">Todos los estilos</option>
          {tagOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      ) : (
        <input type="hidden" name="tag" value={tag} />
      )}

      <div className="flex flex-col">
        <label htmlFor="tours-sort" className="sr-only">Orden</label>
        <select
          id="tours-sort"
          name="sort"
          value={sort}
          onChange={(e) => {
            const v = normalizeSort(e.currentTarget.value);
            setSort(v);
            apply({ next: { sort: v } });
          }}
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="popular">Popular</option>
          <option value="price-asc">Precio (↑)</option>
          <option value="price-desc">Precio (↓)</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="tours-pmin" className="sr-only">Precio mín</label>
        <input
          id="tours-pmin"
          name="pmin"
          inputMode="numeric"
          value={pmin}
          onChange={(e) => setPmin(e.currentTarget.value)}
          placeholder="Min (EUR)"
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="tours-pmax" className="sr-only">Precio máx</label>
        <input
          id="tours-pmax"
          name="pmax"
          inputMode="numeric"
          value={pmax}
          onChange={(e) => setPmax(e.currentTarget.value)}
          placeholder="Max (EUR)"
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-end justify-end gap-2 md:col-span-6">
        {hasFilters ? (
          <button
            type="button"
            onClick={clear}
            className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-brand-blue shadow-soft hover:bg-[color:var(--color-surface-2)]"
          >
            Limpiar
          </button>
        ) : null}
        <button
          type="submit"
          className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-95"
        >
          Aplicar
        </button>
      </div>
    </form>
  );
}
