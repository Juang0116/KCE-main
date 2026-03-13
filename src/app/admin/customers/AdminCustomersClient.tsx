'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Customer = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  country: string | null;
  language: string | null;
  created_at: string;
};

type Segment = {
  id: string;
  name: string;
  entity_type: 'leads' | 'customers';
  filter: Record<string, unknown>;
  description: string | null;
  last_run_at: string | null;
  last_run_count: number | null;
  created_at: string;
};

type ApiResp = {
  items: Customer[];
  page: number;
  limit: number;
  total: number | null;
  requestId?: string;
  error?: string;
};

type SavedCustomerFilter = {
  name: string;
  q?: string;
  country?: string;
  language?: string;
};

const LS_KEY = 'kce_admin_customer_filters_v1';

function readSaved(): SavedCustomerFilter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => (typeof x === 'object' && x ? (x as SavedCustomerFilter) : null))
      .filter(Boolean) as SavedCustomerFilter[];
  } catch {
    return [];
  }
}

function writeSaved(filters: SavedCustomerFilter[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(filters.slice(0, 25)));
  } catch {
    // noop
  }
}

export function AdminCustomersClient() {
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const [saved, setSaved] = useState<SavedCustomerFilter[]>([]);
  const [selectedSaved, setSelectedSaved] = useState('');
  const [saveName, setSaveName] = useState('');

  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [segmentName, setSegmentName] = useState('');

  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pages = useMemo(() => {
    if (total == null) return null;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set('q', q.trim());
      if (country.trim()) qs.set('country', country.trim());
      if (language.trim()) qs.set('language', language.trim());
      qs.set('page', String(page));
      qs.set('limit', String(limit));

      const resp = await adminFetch(`/api/admin/customers?${qs.toString()}`, { cache: 'no-store' });
      const json = (await resp.json().catch(() => null)) as ApiResp | null;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando customers');
      setItems(json?.items || []);
      setTotal(json?.total ?? null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function loadSegments() {
    try {
      const resp = await adminFetch('/api/admin/segments?entity_type=customers', { cache: 'no-store' });
      const json = (await resp.json().catch(() => null)) as {
        items?: Segment[];
        error?: string;
      } | null;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando segmentos');
      setSegments(json?.items || []);
    } catch {
      // non-blocking
    }
  }

  async function saveAsSegment() {
    const name = segmentName.trim();
    if (!name) return;

    const qv = q.trim();
    const countryv = country.trim();
    const languagev = language.trim();

    try {
      const payload = {
        name,
        entity_type: 'customers',
        filter: {
          ...(qv ? { q: qv } : {}),
          ...(countryv ? { country: countryv } : {}),
          ...(languagev ? { language: languagev } : {}),
        },
      };

      const resp = await adminFetch('/api/admin/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error creando segmento');

      setSegmentName('');
      await loadSegments();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  function applySegment(id: string) {
    const seg = segments.find((x) => x.id === id);
    if (!seg) return;

    const f = seg.filter || {};
    const qv = typeof (f as any).q === 'string' ? (f as any).q : '';
    const countryv = typeof (f as any).country === 'string' ? (f as any).country : '';
    const languagev = typeof (f as any).language === 'string' ? (f as any).language : '';

    setQ(qv);
    setCountry(countryv);
    setLanguage(languagev);
    setPage(1);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, country, language, page]);

  useEffect(() => {
    void loadSegments();
  }, []);

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  function applySaved(name: string) {
    const f = saved.find((x) => x.name === name);
    if (!f) return;
    setQ(f.q || '');
    setCountry(f.country || '');
    setLanguage(f.language || '');
    setPage(1);
  }

  function saveCurrent() {
    const name = saveName.trim();
    if (!name) return;

    const qv = q.trim();
    const countryv = country.trim();
    const languagev = language.trim();

    const next: SavedCustomerFilter = {
      name,
      ...(qv ? { q: qv } : {}),
      ...(countryv ? { country: countryv } : {}),
      ...(languagev ? { language: languagev } : {}),
    };

    const rest = saved.filter((x) => x.name !== name);
    const updated = [next, ...rest];

    setSaved(updated);
    setSelectedSaved(name);
    writeSaved(updated);
  }

  function deleteSaved(name: string) {
    const updated = saved.filter((x) => x.name !== name);
    setSaved(updated);
    if (selectedSaved === name) setSelectedSaved('');
    writeSaved(updated);
  }

  function exportCsv() {
    const qs = new URLSearchParams();
    if (q.trim()) qs.set('q', q.trim());
    if (country.trim()) qs.set('country', country.trim());
    if (language.trim()) qs.set('language', language.trim());
    const url = `/api/admin/customers/export?${qs.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const customerSignals = useMemo(
    () => [
      {
        label: 'Visible customers',
        value: total != null ? String(total) : String(items.length),
        note: 'Customer records represented by the active filters.',
      },
      {
        label: 'With country',
        value: String(items.filter((item) => Boolean(item.country)).length),
        note: 'Visible records already carrying a country signal.',
      },
      {
        label: 'With language',
        value: String(items.filter((item) => Boolean(item.language)).length),
        note: 'Visible records that already include a language hint.',
      },
      {
        label: 'DB segments',
        value: String(segments.length),
        note: 'Saved customer segments available in the database right now.',
      },
    ],
    [items, segments.length, total],
  );

  return (
    <section className="space-y-4">
      <AdminOperatorWorkbench
        eyebrow="customer workbench"
        title="Use customer records to move real action, not just organize data"
        description="Start from the records connected to live bookings, support or deals, segment only when it improves future action and keep customer truth aligned across every desk."
        actions={[
          { href: '/admin/deals', label: 'Deals', tone: 'primary' },
          { href: '/admin/bookings', label: 'Bookings' },
          { href: '/admin/tickets', label: 'Tickets' },
          { href: '/admin/segments', label: 'Segments' },
        ]}
        signals={customerSignals}
      />

      <div className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">Buscar</label>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="email, nombre o teléfono"
              className="mt-1 w-64 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">País</label>
            <input
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setPage(1);
              }}
              placeholder="CO, ES…"
              className="mt-1 w-28 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">Idioma</label>
            <input
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setPage(1);
              }}
              placeholder="es, en…"
              className="mt-1 w-28 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={() => {
              setPage(1);
              void load();
            }}
            disabled={loading}
            className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Buscar
          </button>

          <button
            onClick={() => exportCsv()}
            disabled={loading}
            className="rounded-xl border border-brand-blue/30 bg-transparent px-4 py-2 text-sm font-medium text-brand-blue disabled:opacity-60"
          >
            Exportar CSV
          </button>
        </div>

        <div className="text-[color:var(--color-text)]/70 text-sm">
          {total != null ? (
            <>
              Total: <span className="font-medium text-[color:var(--color-text)]">{total}</span>
            </>
          ) : (
            '—'
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-black/10 bg-black/5 p-4">
        <div>
          <label className="text-[color:var(--color-text)]/60 block text-xs">
            Filtros guardados
          </label>
          <select
            value={selectedSaved}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedSaved(v);
              if (v) applySaved(v);
            }}
            className="mt-1 w-56 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {saved.map((f) => (
              <option
                key={f.name}
                value={f.name}
              >
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[color:var(--color-text)]/60 block text-xs">Guardar como</label>
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Ej: Clientes ES"
            className="mt-1 w-56 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={() => saveCurrent()}
          className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={!saveName.trim()}
        >
          Guardar
        </button>

        <button
          onClick={() => selectedSaved && deleteSaved(selectedSaved)}
          className="rounded-xl border border-black/20 bg-transparent px-4 py-2 text-sm font-medium disabled:opacity-60"
          disabled={!selectedSaved}
        >
          Eliminar
        </button>

        <div className="h-8 w-px bg-black/10" />

        <div>
          <label className="text-[color:var(--color-text)]/60 block text-xs">Segmentos (DB)</label>
          <select
            value={selectedSegment}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedSegment(v);
              if (v) applySegment(v);
            }}
            className="mt-1 w-56 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {segments.map((s) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[color:var(--color-text)]/60 block text-xs">
            Guardar segmento
          </label>
          <input
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="Ej: Customers EN"
            className="mt-1 w-56 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={() => void saveAsSegment()}
          className="rounded-xl border border-brand-blue/30 bg-transparent px-4 py-2 text-sm font-medium text-brand-blue disabled:opacity-60"
          disabled={!segmentName.trim() || loading}
        >
          Crear
        </button>
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-[color:var(--color-text)]/60 text-left text-xs uppercase tracking-wide">
              <th className="px-3">Cliente</th>
              <th className="px-3">Contacto</th>
              <th className="px-3">País</th>
              <th className="px-3">Idioma</th>
              <th className="px-3">Creado</th>
              <th className="px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr
                key={c.id}
                className="rounded-xl bg-black/5"
              >
                <td className="p-3 align-top">
                  <div className="font-medium text-[color:var(--color-text)]">{c.name || '—'}</div>
                  <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                    {c.email || ''}
                  </div>
                </td>
                <td className="p-3 align-top">{c.phone || '—'}</td>
                <td className="p-3 align-top">{c.country || '—'}</td>
                <td className="p-3 align-top">{c.language || '—'}</td>
                <td className="text-[color:var(--color-text)]/60 p-3 align-top text-xs">
                  {c.created_at}
                </td>
                <td className="p-3 text-right align-top">
                  <Link
                    href={`/admin/customers/${encodeURIComponent(c.id)}`}
                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm font-medium hover:bg-white"
                  >
                    Ver 360
                  </Link>
                </td>
              </tr>
            ))}

            {!items.length && (
              <tr>
                <td
                  colSpan={6}
                  className="text-[color:var(--color-text)]/60 px-3 py-6 text-center text-sm"
                >
                  {loading ? 'Cargando…' : 'No hay customers para este filtro.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages && pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>
          <div className="text-[color:var(--color-text)]/60 text-xs">
            Página {page} de {pages}
          </div>
          <button
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
      </div>
    </section>
  );
}
