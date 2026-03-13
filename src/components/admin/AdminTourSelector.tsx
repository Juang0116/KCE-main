/* src/components/admin/AdminTourSelector.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';

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
  className,
  placeholder = 'Buscar tour…',
  limit = 200,
}: Props) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<TourOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);

    fetch(`/api/tours?limit=${encodeURIComponent(String(limit))}`, { method: 'GET' })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        const data = Array.isArray(j?.data) ? (j.data as any[]) : [];
        const opts: TourOpt[] = data
          .map((t) => ({
            slug: String(t?.slug || ''),
            title: String(t?.title || ''),
            city: t?.city ? String(t.city) : null,
          }))
          .filter((t) => t.slug && t.title);
        return opts;
      })
      .then((opts) => {
        if (cancelled) return;
        setItems(opts);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : 'Error');
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [limit]);

  const filtered = useMemo(() => {
    const nq = norm(q);
    if (!nq) return items;
    return items.filter((t) => {
      const hay = `${t.title} ${t.slug} ${t.city ?? ''}`;
      return norm(hay).includes(nq);
    });
  }, [items, q]);

  const selectedLabel = useMemo(() => {
    const it = items.find((x) => x.slug === value);
    if (!it) return '';
    return `${it.title}${it.city ? ` — ${it.city}` : ''}`;
  }, [items, value]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs"
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs"
        >
          <option value="">{loading ? 'Cargando tours…' : 'Elegir tour…'}</option>
          {filtered.slice(0, 250).map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.title}
              {t.city ? ` — ${t.city}` : ''} ({t.slug})
            </option>
          ))}
        </select>
      </div>

      {selectedLabel ? (
        <div className="mt-1 text-[11px] text-[color:var(--color-text)]/60">Seleccionado: {selectedLabel}</div>
      ) : null}
      {err ? <div className="mt-1 text-[11px] text-rose-600">Error tours: {err}</div> : null}
    </div>
  );
}
