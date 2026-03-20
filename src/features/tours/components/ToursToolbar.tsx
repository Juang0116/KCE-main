'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Search, MapPin, Tag, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  const p = new URLSearchParams(base.toString());

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

  const [q, setQ] = React.useState(initial.q ?? '');
  const [tag, setTag] = React.useState(initial.tag ?? '');
  const [city, setCity] = React.useState(initial.city ?? '');
  const [sort, setSort] = React.useState<Sort>(initial.sort ?? 'popular');
  const [pmin, setPmin] = React.useState(initial.pmin ?? '');
  const [pmax, setPmax] = React.useState(initial.pmax ?? '');

  const qRef = React.useRef(q);
  const tagRef = React.useRef(tag);
  const cityRef = React.useRef(city);
  const sortRef = React.useRef(sort);
  const pminRef = React.useRef(pmin);
  const pmaxRef = React.useRef(pmax);

  React.useEffect(() => {
    qRef.current = q; tagRef.current = tag; cityRef.current = city;
    sortRef.current = sort; pminRef.current = pmin; pmaxRef.current = pmax;
  }, [q, tag, city, sort, pmin, pmax]);

  const [isPending, startTransition] = React.useTransition();
  const didMountRef = React.useRef(false);
  const didMountPriceRef = React.useRef(false);

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
    (opts?: { replace?: boolean; next?: Partial<{ q: string; tag: string; city: string; sort: Sort; pmin: string; pmax: string }> }) => {
      const nextQ = opts?.next?.q ?? q;
      const nextTag = opts?.next?.tag ?? tag;
      const nextCity = opts?.next?.city ?? city;
      const nextSort = opts?.next?.sort ?? sort;
      const nextPmin = opts?.next?.pmin ?? pmin;
      const nextPmax = opts?.next?.pmax ?? pmax;

      const base = searchParams ?? new URLSearchParams();
      const qs = buildQS(base, { q: nextQ, tag: nextTag, city: nextCity, sort: nextSort, pmin: nextPmin, pmax: nextPmax });
      const href = `${pathname}${qs}`;

      const current = searchParams ? `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}` : `${pathname}`;
      if (href === current) return;

      startTransition(() => {
        if (opts?.replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [q, tag, city, sort, pathname, router, searchParams],
  );

  const clearPrice = React.useCallback(() => {
    setPmin(''); setPmax('');
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
    setQ(''); setTag(''); setCity(''); setSort('popular'); setPmin(''); setPmax('');
    startTransition(() => {
      const base = searchParams ?? new URLSearchParams();
      const p = new URLSearchParams(base.toString());
      for (const k of ['q', 'tag', 'city', 'sort', 'pmin', 'pmax', 'page'] as const) p.delete(k);
      const qs = p.toString();
      const href = `${pathname}${qs ? `?${qs}` : ''}`;
      router.push(href, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  const hasFilters = Boolean(q.trim() || tag || city || pmin.trim() || pmax.trim() || (sort && sort !== 'popular'));

  // Debounces...
  React.useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    const spQ = searchParams?.get('q') ?? '';
    if (q.trim() === spQ.trim()) return;
    const id = window.setTimeout(() => apply({ replace: true, next: { q } }), 300);
    return () => window.clearTimeout(id);
  }, [q, apply, searchParams]);

  React.useEffect(() => {
    if (!didMountPriceRef.current) { didMountPriceRef.current = true; return; }
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
      className="w-full relative z-20 group"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      {/* Etiqueta Sutil Superior */}
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)] mb-3 ml-2 opacity-80">
        <SlidersHorizontal className="h-3 w-3 text-brand-blue" />
        Filtrar Resultados
      </div>

      {/* Contenedor Principal (Glassmorphism Premium) */}
      <div className={`bg-[color:var(--color-surface)]/60 backdrop-blur-xl border border-[color:var(--color-border)] rounded-[var(--radius-2xl)] p-3 sm:p-4 shadow-soft transition-all duration-300 ${isPending ? 'opacity-70 scale-[0.99]' : 'opacity-100'} hover:shadow-pop hover:border-brand-blue/30`}>
        
        {/* Fila 1: Búsqueda, Destino y Estilo */}
        <div className="flex flex-col lg:flex-row items-center gap-3">
          
          {/* Búsqueda libre */}
          <div className="relative w-full lg:flex-1 group/input">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--color-text-muted)] opacity-60 group-hover/input:text-brand-blue transition-colors" />
            <input 
              id="tours-q"
              name="q"
              type="text" 
              placeholder="Buscar (p. ej. café, historia)..." 
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              onBlur={() => apply({ replace: true, next: { q } })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
              className="w-full bg-[color:var(--color-surface-2)]/50 border border-[color:var(--color-border)] text-[color:var(--color-text)] text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-blue focus:bg-[color:var(--color-surface)] focus:shadow-sm transition-all placeholder:text-[color:var(--color-text-muted)]/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Filtro Destino */}
            <div className="relative w-full sm:w-48 shrink-0 group/input">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--color-text-muted)] opacity-60 group-hover/input:text-brand-blue transition-colors" />
              <select
                id="tours-city"
                name="city"
                value={city}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setCity(value);
                  apply({ replace: true, next: { city: value } });
                }}
                className="w-full bg-[color:var(--color-surface-2)]/50 border border-[color:var(--color-border)] text-[color:var(--color-text)] text-sm rounded-xl pl-11 pr-8 py-3 appearance-none focus:outline-none focus:border-brand-blue focus:bg-[color:var(--color-surface)] focus:shadow-sm transition-all cursor-pointer"
              >
                <option value="">Cualquier destino</option>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Filtro Estilo */}
            <div className="relative w-full sm:w-48 shrink-0 group/input">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--color-text-muted)] opacity-60 group-hover/input:text-brand-blue transition-colors" />
              <select
                id="tours-tag"
                name="tag"
                value={tag}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setTag(value);
                  apply({ replace: true, next: { tag: value } });
                }}
                className="w-full bg-[color:var(--color-surface-2)]/50 border border-[color:var(--color-border)] text-[color:var(--color-text)] text-sm rounded-xl pl-11 pr-8 py-3 appearance-none focus:outline-none focus:border-brand-blue focus:bg-[color:var(--color-surface)] focus:shadow-sm transition-all cursor-pointer"
              >
                <option value="">Cualquier estilo</option>
                {tagOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Fila 2: Presupuesto, Sort y Botón de Aplicar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[color:var(--color-border)]/50 mt-4 pt-4">
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full sm:w-auto">
            {/* Rango de Precios */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] opacity-70 hidden md:block">
                Precio (EUR):
              </span>
              <input 
                id="tours-pmin"
                name="pmin"
                type="number" 
                placeholder="Mín" 
                value={pmin}
                onChange={(e) => setPmin(e.currentTarget.value)}
                className="w-20 bg-[color:var(--color-surface-2)]/50 border border-[color:var(--color-border)] text-[color:var(--color-text)] text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-brand-blue transition-all placeholder:text-[color:var(--color-text-muted)]/40 text-center" 
              />
              <span className="text-[color:var(--color-text-muted)] opacity-30">-</span>
              <input 
                id="tours-pmax"
                name="pmax"
                type="number" 
                placeholder="Máx" 
                value={pmax}
                onChange={(e) => setPmax(e.currentTarget.value)}
                className="w-20 bg-[color:var(--color-surface-2)]/50 border border-[color:var(--color-border)] text-[color:var(--color-text)] text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-brand-blue transition-all placeholder:text-[color:var(--color-text-muted)]/40 text-center" 
              />
            </div>

            {/* Separador vertical sutil */}
            <div className="hidden sm:block h-6 w-px bg-[color:var(--color-border)]"></div>

            {/* Sort (Ordenar) */}
            <select
              id="tours-sort"
              name="sort"
              value={sort}
              onChange={(e) => {
                const value = normalizeSort(e.currentTarget.value);
                setSort(value);
                apply({ replace: true, next: { sort: value } });
              }}
              className="bg-transparent text-[color:var(--color-text-muted)] text-xs font-medium focus:outline-none focus:text-brand-blue transition-colors cursor-pointer appearance-none pr-4"
            >
              <option value="popular">Más populares</option>
              <option value="price-asc">Precio: bajo → alto</option>
              <option value="price-desc">Precio: alto → bajo</option>
            </select>
          </div>
          
          {/* Botones de Acción */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasFilters && (
              <button
                type="button"
                onClick={clear}
                disabled={isPending}
                className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] transition-colors px-3 py-2 disabled:opacity-50"
              >
                Limpiar
              </button>
            )}
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto rounded-xl bg-brand-blue text-white shadow-pop hover:-translate-y-0.5 px-6 py-2 h-auto transition-transform disabled:opacity-70">
              {isPending ? 'Buscando...' : 'Aplicar'}
            </Button>
          </div>

        </div>

      </div>

      {/* Chips activos (Debajo del panel, más limpios y como "píldoras" de filtro de agencia) */}
      {hasFilters && (
        <div className="mt-3 flex flex-wrap gap-2 px-2">
          {q.trim() && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-1 text-xs font-medium text-brand-blue shadow-sm transition-all">
              Búsqueda: {q.trim()}
              <button type="button" onClick={() => { setQ(''); apply({ replace: true, next: { q: '' } }); }} className="ml-1 hover:text-brand-terra focus:outline-none">×</button>
            </span>
          )}
          {tag && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-3 py-1 text-xs font-medium text-[color:var(--color-text)] shadow-sm transition-all">
              Estilo: {tag}
              <button type="button" onClick={() => { setTag(''); apply({ replace: true, next: { tag: '' } }); }} className="ml-1 hover:text-brand-terra focus:outline-none">×</button>
            </span>
          )}
          {city && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-success)]/20 bg-[color:var(--color-success)]/10 px-3 py-1 text-xs font-medium text-[color:var(--color-success)] shadow-sm transition-all">
              Destino: {city}
              <button type="button" onClick={() => { setCity(''); apply({ replace: true, next: { city: '' } }); }} className="ml-1 hover:text-brand-terra focus:outline-none">×</button>
            </span>
          )}
          {(pmin.trim() || pmax.trim()) && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[color:var(--color-text-muted)] shadow-sm transition-all">
              EUR {pmin.trim() || '0'} - {pmax.trim() || '∞'}
              <button type="button" onClick={clearPrice} className="ml-1 hover:text-brand-terra focus:outline-none">×</button>
            </span>
          )}
        </div>
      )}
    </form>
  );
}