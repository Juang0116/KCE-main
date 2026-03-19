'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';

type TourOpt = { slug: string; title: string; city?: string | null };

type Props = {
  value: string;
  onChange: (slug: string) => void;
  className?: string;
  placeholder?: string;
  limit?: number;
};

function norm(s: string) {
  return (s || '').trim().toLowerCase();
}

export function AdminTourSelector({
  value,
  onChange,
  className = '',
  placeholder = 'Buscar por nombre o ciudad…',
  limit = 200,
}: Props) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<TourOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchTours() {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch(`/api/tours?limit=${encodeURIComponent(String(limit))}`);
        const j = await r.json().catch(() => null);
        
        if (!r.ok) throw new Error(j?.error || `Error ${r.status}`);
        
        const data = Array.isArray(j?.data) ? (j.data as any[]) : [];
        const opts: TourOpt[] = data
          .map((t) => ({
            slug: String(t?.slug || ''),
            title: String(t?.title || ''),
            city: t?.city ? String(t.city) : null,
          }))
          .filter((t) => t.slug && t.title);

        if (!cancelled) setItems(opts);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e.message || 'Error al cargar tours');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTours();
    return () => { cancelled = true; };
  }, [limit]);

  const filtered = useMemo(() => {
    const nq = norm(q);
    if (!nq) return items;
    return items.filter((t) => {
      const hay = `${t.title} ${t.slug} ${t.city ?? ''}`;
      return norm(hay).includes(nq);
    });
  }, [items, q]);

  const selectedTour = useMemo(() => items.find((x) => x.slug === value), [items, value]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="h-10 w-full rounded-xl border border-brand-dark/10 bg-surface pl-9 pr-3 text-xs focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all"
          />
        </div>

        {/* Select de Resultados */}
        <div className="relative flex-1">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={loading}
            className="h-10 w-full appearance-none rounded-xl border border-brand-dark/10 bg-surface px-3 text-xs focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all disabled:opacity-50"
          >
            <option value="">{loading ? 'Cargando catálogo…' : 'Seleccionar tour…'}</option>
            {filtered.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.title} {t.city ? `(${t.city})` : ''}
              </option>
            ))}
          </select>
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-brand-blue" />
          )}
        </div>
      </div>

      {/* Footer Info / Errores */}
      <footer className="flex min-h-[1.25rem] items-center gap-2 px-1">
        {err ? (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-red">
            <AlertCircle className="h-3 w-3" />
            {err}
          </div>
        ) : selectedTour ? (
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <MapPin className="h-3 w-3 text-brand-blue" />
            <span className="font-semibold text-main">{selectedTour.title}</span>
            <span className="opacity-60">— ID: {selectedTour.slug}</span>
          </div>
        ) : q && filtered.length === 0 ? (
          <div className="text-[11px] text-muted italic">No se encontraron tours con "{q}"</div>
        ) : null}
      </footer>
    </div>
  );
}