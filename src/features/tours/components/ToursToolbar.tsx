// src/features/tours/components/ToursToolbar.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

type Sort = 'popular' | 'price-asc' | 'price-desc';

export type ToursToolbarProps = {
  initial: { q: string; tag: string; city: string; sort: Sort; pmin?: string; pmax?: string };
  tags: string[];
  cities: string[];
};

function normalizeSort(v?: string | null): Sort {
  return v === 'price-asc' || v === 'price-desc' ? v : 'popular';
}

function uniqList(list: string[]) {
  return Array.from(new Set(list.map((x) => String(x || '').trim()).filter(Boolean)));
}

function buildQS(
  base: URLSearchParams,
  values: { q?: string; tag?: string; city?: string; sort?: Sort; pmin?: string; pmax?: string },
) {
  // Clonamos desde string para poder mutar sin pelear con ReadonlyURLSearchParams
  const p = new URLSearchParams(base.toString());

  // Elimina claves que controlamos (evita duplicados y mantiene utm/chat/etc)
  for (const k of ['q', 'tag', 'city', 'sort', 'pmin', 'pmax', 'page'] as const) p.delete(k);

  const q = (values.q || '').trim();
  if (q) p.set('q', q);
  if (values.tag) p.set('tag', values.tag);
  if (values.city) p.set('city', values.city);
  if (values.sort && values.sort !== 'popular') p.set('sort', values.sort);

  const pmin = (values.pmin || '').trim();
  const pmax = (values.pmax || '').trim();
  if (pmin) p.set('pmin', pmin);
  if (pmax) p.set('pmax', pmax);

  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

export default function ToursToolbar({ initial, tags, cities }: ToursToolbarProps) {
  const router = useRouter();
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw || '/tours';
  const searchParams = useSearchParams();

  const tagOptions = React.useMemo(() => uniqList(tags).sort(), [tags]);
  const cityOptions = React.useMemo(() => uniqList(cities).sort(), [cities]);

  // Estado local controlado
  const [q, setQ] = React.useState(initial.q ?? '');
  const [tag, setTag] = React.useState(initial.tag ?? '');
  const [city, setCity] = React.useState(initial.city ?? '');
  const [sort, setSort] = React.useState<Sort>(initial.sort ?? 'popular');
  const [pmin, setPmin] = React.useState(initial.pmin ?? '');
  const [pmax, setPmax] = React.useState(initial.pmax ?? '');

  // Refs para comparar contra URL sin disparar loops al tipear
  const qRef = React.useRef(q);
  const tagRef = React.useRef(tag);
  const cityRef = React.useRef(city);
  const sortRef = React.useRef(sort);
  const pminRef = React.useRef(pmin);
  const pmaxRef = React.useRef(pmax);

  React.useEffect(() => {
    qRef.current = q;
    tagRef.current = tag;
    cityRef.current = city;
    sortRef.current = sort;
    pminRef.current = pmin;
    pmaxRef.current = pmax;
  }, [q, tag, city, sort, pmin, pmax]);

  // Transiciones de navegación
  const [isPending, startTransition] = React.useTransition();

  // Evita ejecutar el debounce en el primer render (si no, hace replace apenas monta)
  const didMountRef = React.useRef(false);
  const didMountPriceRef = React.useRef(false);

  // Sync con navegación (atrás/adelante o enlaces externos)
  // Importante: NO depender del estado aquí, para no resetear inputs mientras el usuario tipea.
  React.useEffect(() => {
    if (!searchParams) return;

    const spQ = searchParams.get('q') ?? '';
    const spTag = searchParams.get('tag') ?? '';
    const spCity = searchParams.get('city') ?? '';
    const spSort = normalizeSort(searchParams.get('sort'));
    const spPmin = searchParams.get('pmin') ?? '';
    const spPmax = searchParams.get('pmax') ?? '';

    if (spQ !== qRef.current) setQ(spQ);
    if (spTag !== tagRef.current) setTag(spTag);
    if (spCity !== cityRef.current) setCity(spCity);
    if (spSort !== sortRef.current) setSort(spSort);
    if (spPmin !== pminRef.current) setPmin(spPmin);
    if (spPmax !== pmaxRef.current) setPmax(spPmax);
  }, [searchParams]);

  const apply = React.useCallback(
    (opts?: {
      replace?: boolean;
      next?: Partial<{
        q: string;
        tag: string;
        city: string;
        sort: Sort;
        pmin: string;
        pmax: string;
      }>;
    }) => {
      const nextQ = opts?.next?.q ?? q;
      const nextTag = opts?.next?.tag ?? tag;
      const nextCity = opts?.next?.city ?? city;
      const nextSort = opts?.next?.sort ?? sort;
      const nextPmin = opts?.next?.pmin ?? pmin;
      const nextPmax = opts?.next?.pmax ?? pmax;

      const base = searchParams ?? new URLSearchParams();
      const qs = buildQS(base, {
        q: nextQ,
        tag: nextTag,
        city: nextCity,
        sort: nextSort,
        pmin: nextPmin,
        pmax: nextPmax,
      });
      const href = `${pathname}${qs}`;

      // Evita navegación redundante (puede causar loops si el estado ya coincide con la URL)
      const current = searchParams
        ? `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
        : `${pathname}`;
      if (href === current) return;

      startTransition(() => {
        if (opts?.replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [q, tag, city, sort, pathname, router, searchParams],
  );

  const clearPrice = React.useCallback(() => {
    setPmin('');
    setPmax('');

    startTransition(() => {
      const base = searchParams ?? new URLSearchParams();
      const p = new URLSearchParams(base.toString());
      for (const k of ['pmin', 'pmax', 'page'] as const) p.delete(k);
      const qs = p.toString();
      const href = `${pathname}${qs ? `?${qs}` : ''}`;
      router.replace(href, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  const clear = React.useCallback(() => {
    setQ('');
    setTag('');
    setCity('');
    setSort('popular');

    startTransition(() => {
      const base = searchParams ?? new URLSearchParams();
      const p = new URLSearchParams(base.toString());
      for (const k of ['q', 'tag', 'city', 'sort', 'pmin', 'pmax', 'page'] as const) p.delete(k);
      const qs = p.toString();
      const href = `${pathname}${qs ? `?${qs}` : ''}`;
      router.push(href, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  const hasFilters = Boolean(
    q.trim() || tag || city || pmin.trim() || pmax.trim() || (sort && sort !== 'popular'),
  );

  // Debounce para búsqueda por texto (replace para no llenar historial)
  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const spQ = searchParams?.get('q') ?? '';
    if (q.trim() === spQ.trim()) return;
    const id = window.setTimeout(() => apply({ replace: true, next: { q } }), 300);
    return () => window.clearTimeout(id);
  }, [q, apply]);

  // Debounce para precio mín/máx (replace para no llenar historial)
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

  return (
    <form
      role="search"
      aria-label="Filtros de tours"
      aria-busy={isPending || undefined}
      className={[
        'overflow-hidden rounded-[calc(var(--radius)+0.6rem)] border shadow-hard',
        'border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,245,238,0.98))]',
      ].join(' ')}
      onSubmit={(e) => {
        e.preventDefault();
        apply(); // botón Aplicar → push
      }}
    >
      <div className="flex flex-col gap-4 border-b border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(11,84,162,0.08),rgba(255,255,255,0.98)_52%,rgba(216,176,74,0.08))] px-5 py-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-blue/80">Shortlist studio</p>
          <h2 className="mt-2 font-heading text-[1.5rem] leading-tight text-brand-blue md:text-[1.8rem]">Filtra mejor. Compara más rápido. Decide con menos ruido.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/72">Usa tema, ciudad y rango de precio para construir una shortlist mucho más limpia antes de pasar al checkout o al contacto.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[color:var(--color-text-muted)] shadow-soft">EUR</span>
          <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[color:var(--color-text-muted)] shadow-soft">Filtro rápido</span>
          <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[color:var(--color-text-muted)] shadow-soft">Ruta premium</span>
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-6 md:p-5">
      {/* Search */}
      <div className="flex flex-col">
        <label
          htmlFor="tours-q"
          className="sr-only"
        >
          Buscar
        </label>
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
              apply(); // Enter → push (historial)
            }
          }}
          placeholder="Buscar (p. ej. café, historia)…"
          className={[
            'w-full rounded-2xl border px-4 py-3 shadow-soft',
            'border-white/80 bg-white/92',
            'text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)]',
            'outline-none focus:ring-2 focus:ring-brand-blue/30',
          ].join(' ')}
        />
      </div>

      {/* Tag */}
      <div className="flex flex-col">
        <label
          htmlFor="tours-tag"
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]"
        >
          Tema
        </label>
        <select
          id="tours-tag"
          name="tag"
          value={tag}
          onChange={(e) => {
            const value = e.currentTarget.value;
            setTag(value);
            apply({ replace: true, next: { tag: value } });
          }}
          className={[
            'w-full rounded-2xl border px-4 py-3 shadow-soft',
            'border-white/80 bg-white/92',
            'text-[color:var(--color-text)] outline-none focus:ring-2 focus:ring-brand-blue/30',
          ].join(' ')}
        >
          <option value="">Todos los temas</option>
          {tagOptions.map((t) => (
            <option
              key={t}
              value={t}
            >
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div className="flex flex-col">
        <label
          htmlFor="tours-city"
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]"
        >
          Ciudad
        </label>
        <select
          id="tours-city"
          name="city"
          value={city}
          onChange={(e) => {
            const value = e.currentTarget.value;
            setCity(value);
            apply({ replace: true, next: { city: value } });
          }}
          className={[
            'w-full rounded-2xl border px-4 py-3 shadow-soft',
            'border-white/80 bg-white/92',
            'text-[color:var(--color-text)] outline-none focus:ring-2 focus:ring-brand-blue/30',
          ].join(' ')}
        >
          <option value="">Todas las ciudades</option>
          {cityOptions.map((c) => (
            <option
              key={c}
              value={c}
            >
              {c}
            </option>
          ))}
        </select>
      </div>
      {/* Price min */}
      <div className="flex flex-col">
        <label
          htmlFor="tours-pmin"
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]"
        >
          Precio mín (EUR)
        </label>
        <input
          id="tours-pmin"
          name="pmin"
          inputMode="decimal"
          value={pmin}
          onChange={(e) => setPmin(e.currentTarget.value)}
          placeholder="0"
          className={[
            'w-full rounded-2xl border px-4 py-3 shadow-soft',
            'border-white/80 bg-white/92',
            'text-[color:var(--color-text)] outline-none focus:ring-2 focus:ring-brand-blue/30',
          ].join(' ')}
        />
      </div>

      {/* Price max */}
      <div className="flex flex-col">
        <label
          htmlFor="tours-pmax"
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]"
        >
          Precio máx (EUR)
        </label>
        <input
          id="tours-pmax"
          name="pmax"
          inputMode="decimal"
          value={pmax}
          onChange={(e) => setPmax(e.currentTarget.value)}
          placeholder="∞"
          className={[
            'w-full rounded-2xl border px-4 py-3 shadow-soft',
            'border-white/80 bg-white/92',
            'text-[color:var(--color-text)] outline-none focus:ring-2 focus:ring-brand-blue/30',
          ].join(' ')}
        />
      </div>

      {/* Sort + actions */}
      <div className="flex items-stretch gap-2">
        <div className="flex-1">
          <label
            htmlFor="tours-sort"
            className="sr-only"
          >
            Ordenar
          </label>
          <select
            id="tours-sort"
            name="sort"
            value={sort}
            onChange={(e) => {
              const value = normalizeSort(e.currentTarget.value);
              setSort(value);
              apply({ replace: true, next: { sort: value } });
            }}
            className={[
              'w-full rounded-2xl border px-4 py-3 shadow-soft',
              'border-white/80 bg-white/92',
              'text-[color:var(--color-text)] outline-none focus:ring-2 focus:ring-brand-blue/30',
            ].join(' ')}
          >
            <option value="popular">Más populares</option>
            <option value="price-asc">Precio: bajo → alto</option>
            <option value="price-desc">Precio: alto → bajo</option>
          </select>
        </div>

        <button
          type="submit"
          className={[
            'rounded-2xl bg-brand-blue px-5 py-3 font-heading text-white shadow-hard transition',
            'hover:opacity-95 disabled:opacity-60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2',
            'ring-offset-[color:var(--color-bg)]',
          ].join(' ')}
          disabled={isPending}
        >
          {isPending ? 'Aplicando…' : 'Aplicar'}
        </button>

        <button
          type="button"
          className={[
            'rounded-2xl border px-4 py-3 transition',
            'border-[color:var(--color-border)] bg-transparent text-[color:var(--color-text)]',
            'dark:hover:bg-[color:var(--color-surface)]/10 hover:bg-black/5',
            'disabled:opacity-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30',
          ].join(' ')}
          onClick={clear}
          disabled={!hasFilters || isPending}
          aria-label="Limpiar filtros"
          title="Limpiar filtros"
        >
          Limpiar
        </button>
      </div>

      {/* Chips activos */}
      {hasFilters && (
        <div className="border-t border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(246,242,233,0.82))] px-4 py-4 md:col-span-6">
          <ul className="flex flex-wrap gap-2 text-sm">
            {q.trim() && (
              <li className="rounded-full border border-white/80 bg-white/92 px-3 py-1 shadow-soft">
                “{q.trim()}”
                <button
                  type="button"
                  className="text-[color:var(--color-text)]/60 ml-2 hover:text-[color:var(--color-text)]"
                  aria-label="Quitar búsqueda"
                  onClick={() => {
                    setQ('');
                    apply({ replace: true, next: { q: '' } });
                  }}
                >
                  ×
                </button>
              </li>
            )}
            {tag && (
              <li className="rounded-full border border-white/80 bg-white/92 px-3 py-1 shadow-soft">
                #{tag}
                <button
                  type="button"
                  className="text-[color:var(--color-text)]/60 ml-2 hover:text-[color:var(--color-text)]"
                  aria-label="Quitar tema"
                  onClick={() => {
                    setTag('');
                    apply({ replace: true, next: { tag: '' } });
                  }}
                >
                  ×
                </button>
              </li>
            )}
            {city && (
              <li className="rounded-full border border-white/80 bg-white/92 px-3 py-1 shadow-soft">
                {city}
                <button
                  type="button"
                  className="text-[color:var(--color-text)]/60 ml-2 hover:text-[color:var(--color-text)]"
                  aria-label="Quitar ciudad"
                  onClick={() => {
                    setCity('');
                    apply({ replace: true, next: { city: '' } });
                  }}
                >
                  ×
                </button>
              </li>
            )}
            {(pmin.trim() || pmax.trim()) && (
              <li className="rounded-full border border-white/80 bg-white/92 px-3 py-1 shadow-soft">
                Precio: {pmin.trim() || '0'}–{pmax.trim() || '∞'}
                <button
                  type="button"
                  className="text-[color:var(--color-text)]/70 ml-2 rounded-full px-2 py-0.5 text-xs hover:bg-black/5 dark:hover:bg-white/5"
                  aria-label="Quitar filtro de precio"
                  onClick={clearPrice}
                >
                  ×
                </button>
              </li>
            )}
            {sort !== 'popular' && (
              <li className="rounded-full border border-white/80 bg-white/92 px-3 py-1 shadow-soft">
                {sort === 'price-asc' ? 'Precio ↑' : 'Precio ↓'}
                <button
                  type="button"
                  className="text-[color:var(--color-text)]/60 ml-2 hover:text-[color:var(--color-text)]"
                  aria-label="Quitar orden"
                  onClick={() => {
                    setSort('popular');
                    apply({ replace: true, next: { sort: 'popular' } });
                  }}
                >
                  ×
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
      </div>
    </form>
  );
}
