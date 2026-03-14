'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';

type Lead = {
  id: string;
  email: string | null;
  whatsapp: string | null;
  source: string | null;
  language: string | null;
  customer_id?: string | null;
  stage: string;
  tags: string[];
  notes: string | null;
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
  items: Lead[];
  page: number;
  limit: number;
  total: number | null;
  requestId?: string;
  error?: string;
};

type SavedLeadFilter = {
  name: string;
  stage?: string;
  source?: string;
  tags?: string;
  q?: string;
};

const LS_KEY = 'kce_admin_lead_filters_v1';

function readSaved(): SavedLeadFilter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => (typeof x === 'object' && x ? (x as SavedLeadFilter) : null))
      .filter(Boolean) as SavedLeadFilter[];
  } catch (_e) {
    return [];
  }
}

function writeSaved(filters: SavedLeadFilter[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(filters.slice(0, 25)));
  } catch (_e) {
    // noop
  }
}

const STAGES = ['new', 'qualified', 'proposal', 'won', 'lost'] as const;

export function AdminLeadsClient() {
  const [stage, setStage] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const [saved, setSaved] = useState<SavedLeadFilter[]>([]);
  const [selectedSaved, setSelectedSaved] = useState<string>('');
  const [saveName, setSaveName] = useState('');

  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [segmentName, setSegmentName] = useState('');

  const [items, setItems] = useState<Lead[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const pages = useMemo(() => {
    if (total == null) return null;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  const visibleReadyToConvert = useMemo(
    () => items.filter((l) => !!l.email && !l.customer_id && l.stage !== 'won').length,
    [items],
  );
  const visibleMissingEmail = useMemo(() => items.filter((l) => !l.email).length, [items]);
  const visibleWon = useMemo(() => items.filter((l) => l.stage === 'won').length, [items]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      if (stage) qs.set('stage', stage);
      if (source.trim()) qs.set('source', source.trim());
      if (tags.trim()) qs.set('tags', tags.trim());
      if (q.trim()) qs.set('q', q.trim());
      qs.set('page', String(page));
      qs.set('limit', String(limit));

      const resp = await adminFetch(`/api/admin/leads?${qs.toString()}`, { cache: 'no-store' });
      const json = (await resp.json().catch(() => null)) as ApiResp | null;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando leads');
      setItems(json?.items || []);
      setTotal(json?.total ?? null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function updateStage(id: string, newStage: string) {
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error');
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function loadSegments() {
    try {
      const resp = await adminFetch('/api/admin/segments?entity_type=leads', { cache: 'no-store' });
      const json = (await resp.json().catch(() => null)) as {
        items?: Segment[];
        error?: string;
      } | null;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando segmentos');
      setSegments(json?.items || []);
    } catch (_e) {
      // non-blocking
    }
  }

  function applySegment(id: string) {
    const seg = segments.find((x) => x.id === id);
    if (!seg) return;
    const f = seg.filter || {};
    setStage(typeof f.stage === 'string' ? f.stage : '');
    setSource(typeof f.source === 'string' ? f.source : '');
    if (Array.isArray(f.tags))
      setTags((f.tags as unknown[]).filter((x) => typeof x === 'string').join(','));
    else setTags(typeof f.tags === 'string' ? f.tags : '');
    setQ(typeof f.q === 'string' ? f.q : '');
    setPage(1);
  }

  async function saveAsSegment() {
    const name = segmentName.trim();
    if (!name) return;

    const stageV = stage.trim();
    const sourceV = source.trim();
    const tagsArr = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);
    const qV = q.trim();

    try {
      const payload = {
        name,
        entity_type: 'leads',
        filter: {
          ...(stageV ? { stage: stageV } : {}),
          ...(sourceV ? { source: sourceV } : {}),
          ...(tagsArr.length ? { tags: tagsArr } : {}),
          ...(qV ? { q: qV } : {}),
        },
      };

      const resp = await adminFetch('/api/admin/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = (await resp.json().catch(() => null)) as any;
      if (!resp.ok) throw new Error(json?.error || 'Error guardando segmento');

      setSegmentName('');
      await loadSegments();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  async function convertLead(id: string) {
    setLoading(true);
    setErr(null);
    setActionMsg(null);
    try {
      const resp = await adminFetch(`/api/admin/leads/${encodeURIComponent(id)}/convert`, {
        method: 'POST',
      });
      const json = (await resp.json().catch(() => null)) as
        | { error?: string; customerId?: string | null }
        | null;
      if (!resp.ok) throw new Error(json?.error || 'Error convirtiendo lead');
      setActionMsg(
        `Lead convertido a customer${json?.customerId ? ` · customer ${String(json.customerId).slice(0, 8)}` : ''}`,
      );
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function createDealFromLead(lead: Lead) {
    setLoading(true);
    setErr(null);
    setActionMsg(null);
    try {
      const resp = await adminFetch('/api/admin/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          title: lead.email ? `Lead · ${lead.email}` : 'Lead follow-up',
          stage: lead.stage === 'qualified' || lead.stage === 'proposal' ? lead.stage : 'new',
          source: lead.source || 'admin-leads',
          notes: [
            lead.notes?.trim() || '',
            lead.tags.length ? `Tags: ${lead.tags.join(', ')}` : '',
            lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : '',
          ]
            .filter(Boolean)
            .join(' · ')
            .slice(0, 4000),
        }),
      });
      const json = (await resp.json().catch(() => null)) as
        | { error?: string; dealId?: string | null }
        | null;
      if (!resp.ok) throw new Error(json?.error || 'Error creando deal');
      setActionMsg(
        `Deal creado${json?.dealId ? ` · deal ${String(json.dealId).slice(0, 8)}` : ''}. Revisa /admin/deals para continuar.`,
      );
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, source, tags, q, page]);

  useEffect(() => {
    void loadSegments();
  }, []);

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  function applySaved(name: string) {
    const f = saved.find((x) => x.name === name);
    if (!f) return;
    setStage(f.stage || '');
    setSource(f.source || '');
    setTags(f.tags || '');
    setQ(f.q || '');
    setPage(1);
  }

  function saveCurrent() {
    const name = saveName.trim();
    if (!name) return;

    const stageV = stage.trim();
    const sourceV = source.trim();
    const tagsV = tags.trim();
    const qV = q.trim();

    const next: SavedLeadFilter = {
      name,
      ...(stageV ? { stage: stageV } : {}),
      ...(sourceV ? { source: sourceV } : {}),
      ...(tagsV ? { tags: tagsV } : {}),
      ...(qV ? { q: qV } : {}),
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
    if (stage) qs.set('stage', stage);
    if (source.trim()) qs.set('source', source.trim());
    if (tags.trim()) qs.set('tags', tags.trim());
    if (q.trim()) qs.set('q', q.trim());
    const url = `/api/admin/leads/export?${qs.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-soft">
      {/* 1. HEADER */}
      <div className="mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <h1 className="font-heading text-2xl text-brand-blue">Directorio de Leads</h1>
        <div className="text-sm font-medium text-[color:var(--color-text)]/60">
          Total: {total != null ? <span className="text-brand-blue font-bold">{total}</span> : '—'}
        </div>
      </div>

      {/* 2. FILTROS PRINCIPALES */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[color:var(--color-text)]/60 block text-xs font-bold uppercase tracking-widest mb-1">Buscar</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email o WhatsApp..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue transition-colors"
          />
        </div>
        <div>
          <label className="text-[color:var(--color-text)]/60 block text-xs font-bold uppercase tracking-widest mb-1">Etapa</label>
          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue transition-colors"
          >
            <option value="">Todas</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[color:var(--color-text)]/60 block text-xs font-bold uppercase tracking-widest mb-1">Fuente</label>
          <input
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            placeholder="Ej: web, chat..."
            className="w-full sm:w-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue transition-colors"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => {
              setPage(1);
              void load();
            }}
            disabled={loading}
            className="rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue/90 disabled:opacity-60 shadow-sm"
          >
            Buscar
          </button>
          <button
            onClick={exportCsv}
            disabled={loading}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[var(--color-surface-2)] disabled:opacity-60"
          >
            CSV
          </button>
          <button
            onClick={async () => {
              setBriefLoading(true);
              setAiBrief(null);
              try {
                const res = await fetch('/api/admin/leads/brief');
                const d = await res.json();
                if (d.ok) setAiBrief(d.brief);
              } catch (_e) {
                // ignore
              } finally {
                setBriefLoading(false);
              }
            }}
            disabled={briefLoading}
            className="rounded-xl bg-brand-yellow/10 border border-brand-yellow/30 px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-yellow/20 disabled:opacity-60"
          >
            {briefLoading ? '⏳ Analizando...' : '🤖 Brief IA'}
          </button>
        </div>
      </div>

      {/* MENSAJES DE ESTADO */}
      {aiBrief && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-800">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Análisis Gemini del Pipeline</div>
          {aiBrief}
        </div>
      )}
      {actionMsg && <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 font-medium">{actionMsg}</div>}
      {err && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 font-medium">{err}</div>}

      {/* 3. MÉTRICAS RÁPIDAS */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 shadow-sm">
          <div className="text-[color:var(--color-text)]/50 text-xs font-bold uppercase tracking-widest">Leads Visibles</div>
          <div className="mt-2 text-3xl font-heading text-brand-blue">{items.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
          <div className="text-emerald-700/70 text-xs font-bold uppercase tracking-widest">Listos para Convertir</div>
          <div className="mt-2 text-3xl font-heading text-emerald-600">{visibleReadyToConvert}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-sm">
          <div className="text-amber-700/70 text-xs font-bold uppercase tracking-widest">Atención Requerida</div>
          <div className="mt-2 text-sm font-medium text-amber-700/90">{visibleMissingEmail} sin email · {visibleWon} ganados</div>
        </div>
      </div>

      {/* 4. HERRAMIENTAS DE SEGMENTACIÓN (Guardar Filtros) */}
      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
        <div>
          <label className="text-[color:var(--color-text)]/60 block text-[10px] font-bold uppercase tracking-widest mb-1">Vistas Guardadas</label>
          <select
            value={selectedSaved}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedSaved(v);
              if (v) applySaved(v);
            }}
            className="w-48 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none"
          >
            <option value="">—</option>
            {saved.map((f) => (
              <option key={f.name} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[color:var(--color-text)]/60 block text-[10px] font-bold uppercase tracking-widest mb-1">Guardar Vista Actual</label>
          <div className="flex gap-2">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ej: Leads FR calificados"
              className="w-48 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none"
            />
            <button onClick={() => saveCurrent()} disabled={!saveName.trim()} className="rounded-xl bg-brand-blue/10 text-brand-blue px-4 py-2 text-sm font-bold disabled:opacity-50">Guardar</button>
            <button onClick={() => selectedSaved && deleteSaved(selectedSaved)} disabled={!selectedSaved} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-red-500 disabled:opacity-50">Eliminar</button>
          </div>
        </div>
        <div className="hidden h-10 w-px bg-[var(--color-border)] md:block" />
        <div>
          <label className="text-[color:var(--color-text)]/60 block text-[10px] font-bold uppercase tracking-widest mb-1">Segmentos Globales (BD)</label>
          <select
            value={selectedSegment}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedSegment(v);
              if (v) applySegment(v);
            }}
            className="w-48 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none"
          >
            <option value="">—</option>
            {segments.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. LA TABLA DE LEADS */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-[var(--color-surface-2)]">
            <tr className="text-[color:var(--color-text)]/50 text-xs font-bold uppercase tracking-widest">
              <th className="px-6 py-4 font-semibold">Contacto</th>
              <th className="px-6 py-4 font-semibold">Fuente / Idioma</th>
              <th className="px-6 py-4 font-semibold">Etapa</th>
              <th className="px-6 py-4 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                <td className="px-6 py-4 align-top">
                  <div className="font-medium text-brand-blue">{l.email || 'Sin email'}</div>
                  <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">{l.whatsapp || 'Sin WhatsApp'}</div>
                  {l.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {l.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="rounded-full bg-[var(--color-border)] px-2.5 py-0.5 text-[10px] uppercase font-semibold text-[color:var(--color-text)]/70">{tag}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 align-top text-[color:var(--color-text)]/70">
                  <div className="font-medium">{l.source || '—'}</div>
                  <div className="text-xs uppercase mt-1">{l.language || '—'}</div>
                </td>
                <td className="px-6 py-4 align-top">
                  <span className="rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-1 text-xs font-semibold text-brand-blue uppercase tracking-wider">
                    {l.stage}
                  </span>
                  <div className="mt-2 text-[color:var(--color-text)]/40 text-[10px] uppercase">
                    Creado: {new Date(l.created_at).toLocaleDateString('es-CO')}
                  </div>
                </td>
                <td className="px-6 py-4 text-right align-top">
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                    <select
                      value={l.stage}
                      disabled={loading}
                      onChange={(e) => void updateStage(l.id, e.target.value)}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium outline-none focus:border-brand-blue cursor-pointer"
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <button
                      onClick={() => void convertLead(l.id)}
                      disabled={loading || !l.email || l.stage === 'won' || Boolean(l.customer_id)}
                      className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-xs font-semibold text-[color:var(--color-text)] transition hover:bg-[var(--color-surface-2)] disabled:opacity-40"
                    >
                      Convertir
                    </button>

                    <button
                      onClick={() => void createDealFromLead(l)}
                      disabled={loading}
                      className="rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-brand-yellow transition hover:bg-brand-dark/90 disabled:opacity-50"
                    >
                      Crear Deal
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[color:var(--color-text)]/50 text-sm font-medium">
                  {loading ? 'Cargando leads...' : 'No se encontraron leads con estos filtros.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 6. PAGINACIÓN */}
      {pages && pages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
          <button
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--color-surface-2)] disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>
          <div className="text-[color:var(--color-text)]/50 text-xs font-bold uppercase tracking-widest">
            Página {page} de {pages}
          </div>
          <button
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--color-surface-2)] disabled:opacity-50"
            disabled={page >= pages || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </section>
  );
}