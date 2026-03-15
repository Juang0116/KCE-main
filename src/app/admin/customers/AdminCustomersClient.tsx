'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search, Globe, Languages, Users, Save, Download, Trash2, FolderGit2 } from 'lucide-react';

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
        note: 'Registros representados en esta vista.',
      },
      {
        label: 'With country',
        value: String(items.filter((item) => Boolean(item.country)).length),
        note: 'Clientes filtrados que tienen país definido.',
      },
      {
        label: 'With language',
        value: String(items.filter((item) => Boolean(item.language)).length),
        note: 'Clientes filtrados con idioma detectado.',
      },
      {
        label: 'DB segments',
        value: String(segments.length),
        note: 'Segmentos globales guardados en base de datos.',
      },
    ],
    [items, segments.length, total],
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Directorio de Clientes</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Central de datos, historial y segmentación de viajeros KCE.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Customer Intelligence"
        title="Usa los datos para mover acción real"
        description="Agrupa clientes por país o idioma para lanzar campañas ultra-dirigidas, o abre el perfil 360 para ver el ciclo de vida completo de un viajero."
        actions={[
          { href: '/admin/deals', label: 'Deals', tone: 'primary' },
          { href: '/admin/bookings', label: 'Bookings' },
          { href: '/admin/segments', label: 'Segments' },
        ]}
        signals={customerSignals}
      />

      {err && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Filtros Principales */}
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5 mb-8">
          <div className="xl:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Buscar Cliente</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Email, nombre o teléfono..." className="w-full h-12 pl-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue transition-colors text-sm" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">País (Código)</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
              <input value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} placeholder="Ej: CO, ES, FR" className="w-full h-12 pl-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue transition-colors text-sm uppercase" maxLength={2} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Idioma</label>
            <div className="relative">
              <Languages className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
              <input value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} placeholder="Ej: es, en" className="w-full h-12 pl-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue transition-colors text-sm lowercase" maxLength={2} />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={exportCsv} disabled={loading || !items.length} className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm font-bold uppercase tracking-widest hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50">
              <Download className="h-4 w-4"/> CSV
            </button>
          </div>
        </div>

        {/* Herramientas de Segmentación */}
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-blue/15 bg-brand-blue/5 p-4 md:p-5">
          <div className="flex items-center gap-2 text-brand-blue shrink-0">
            <FolderGit2 className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Segmentos</span>
          </div>
          
          <div className="h-8 w-px bg-brand-blue/20 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <select value={selectedSaved} onChange={(e) => { const v = e.target.value; setSelectedSaved(v); if (v) applySaved(v); }} className="h-10 rounded-xl border border-brand-blue/20 bg-white/60 px-3 text-sm outline-none w-40">
              <option value="">Vistas Locales...</option>
              {saved.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
            <div className="flex items-center bg-white/60 border border-brand-blue/20 rounded-xl overflow-hidden h-10">
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Guardar vista..." className="bg-transparent px-3 text-sm outline-none w-32" />
              <button onClick={() => saveCurrent()} disabled={!saveName.trim()} className="px-3 text-[10px] font-bold uppercase text-brand-blue hover:bg-brand-blue/10 disabled:opacity-30 h-full border-l border-brand-blue/20 transition-colors"><Save className="h-4 w-4"/></button>
            </div>
            <button onClick={() => selectedSaved && deleteSaved(selectedSaved)} disabled={!selectedSaved} className="h-10 w-10 flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-50 text-rose-600 disabled:opacity-30 hover:bg-rose-100 transition-colors"><Trash2 className="h-4 w-4"/></button>
          </div>

          <div className="h-8 w-px bg-brand-blue/20 hidden lg:block"></div>

          <div className="flex items-center gap-2">
            <select value={selectedSegment} onChange={(e) => { const v = e.target.value; setSelectedSegment(v); if (v) applySegment(v); }} className="h-10 rounded-xl border border-brand-blue/20 bg-white/60 px-3 text-sm outline-none w-40">
              <option value="">Base de Datos...</option>
              {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex items-center bg-white/60 border border-brand-blue/20 rounded-xl overflow-hidden h-10">
              <input value={segmentName} onChange={(e) => setSegmentName(e.target.value)} placeholder="Crear global..." className="bg-transparent px-3 text-sm outline-none w-32" />
              <button onClick={() => void saveAsSegment()} disabled={!segmentName.trim() || loading} className="px-3 text-[10px] font-bold uppercase text-brand-blue hover:bg-brand-blue/10 disabled:opacity-30 h-full border-l border-brand-blue/20 transition-colors">Crear</button>
            </div>
          </div>
        </div>

        {/* Tabla de Clientes */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5">Contacto</th>
                <th className="px-6 py-5 text-center">Demografía</th>
                <th className="px-6 py-5">Fecha Alta</th>
                <th className="px-6 py-5 text-right">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text)]/40 text-sm">Buscando en la base de datos...</td></tr>
              ) : items.length > 0 ? (
                items.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-6 py-5 align-top">
                      <div className="font-heading text-lg text-brand-blue">{c.name || 'Sin Nombre'}</div>
                      <div className="mt-1 text-[10px] font-mono text-[var(--color-text)]/30">ID: {c.id.slice(0,8)}</div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="font-medium text-[var(--color-text)]">{c.email || '—'}</div>
                      <div className="mt-1 text-xs text-[var(--color-text)]/60">{c.phone || 'Sin WhatsApp'}</div>
                    </td>
                    <td className="px-6 py-5 align-top text-center">
                      <div className="flex justify-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] border border-[var(--color-border)]">
                          <Globe className="h-3 w-3 mr-1 opacity-50"/> {c.country || 'N/A'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] border border-[var(--color-border)]">
                          <Languages className="h-3 w-3 mr-1 opacity-50"/> {c.language || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-xs text-[var(--color-text)]/60">
                      {new Date(c.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                      <Link href={`/admin/customers/${encodeURIComponent(c.id)}`} className="inline-flex items-center justify-center rounded-xl bg-brand-dark px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-sm">
                        Abrir CRM 360
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-[var(--color-text)]/40">
                    <Users className="mx-auto h-10 w-10 opacity-20 mb-3"/>
                    No hay clientes que coincidan con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pages && pages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
            <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface-2)]">
              ← Anterior
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
              Página {page} de {pages}
            </div>
            <button disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface-2)]">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}