// src/app/admin/leads/AdminLeadsClient.tsx
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
  } catch {
    return [];
  }
}

function writeSaved(filters: SavedLeadFilter[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(filters.slice(0, 25)));
  } catch {
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
    } catch {
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
    <section className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">Stage</label>
            <select
              value={stage}
              onChange={(e) => {
                setStage(e.target.value);
                setPage(1);
              }}
              className="mt-1 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {STAGES.map((s) => (
                <option
                  key={s}
                  value={s}
                >
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="email o whatsapp"
              className="mt-1 w-64 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">Fuente</label>
            <input
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
              placeholder="web, chat, ads…"
              className="mt-1 w-40 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">Tags</label>
            <input
              value={tags}
              onChange={(e) => {
                setTags(e.target.value);
                setPage(1);
              }}
              placeholder="food,history"
              className="mt-1 w-40 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
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

          <button
            onClick={async () => {
              setBriefLoading(true);
              setAiBrief(null);
              try {
                const res = await fetch('/api/admin/leads/brief');
                const d = await res.json();
                if (d.ok) setAiBrief(d.brief);
              } catch { /* ignore */ }
              finally { setBriefLoading(false); }
            }}
            disabled={briefLoading}
            className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 disabled:opacity-60"
          >
            {briefLoading ? '⏳ Analizando...' : '🤖 Brief IA'}
          </button>
        </div>

        {aiBrief && (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">Análisis Gemini del Pipeline</div>
            {aiBrief}
          </div>
        )}

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

      {actionMsg ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionMsg}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
          <div className="text-[color:var(--color-text)]/60 text-xs uppercase tracking-wide">Visibles</div>
          <div className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">{items.length}</div>
          <p className="text-[color:var(--color-text)]/60 mt-1 text-xs">Leads cargados en la vista actual.</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4">
          <div className="text-emerald-800/70 text-xs uppercase tracking-wide">Listos para convertir</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-900">{visibleReadyToConvert}</div>
          <p className="mt-1 text-xs text-emerald-800/80">Con email y sin customer asociado.</p>
        </div>

        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4">
          <div className="text-amber-800/70 text-xs uppercase tracking-wide">Revisión rápida</div>
          <div className="mt-2 text-sm font-medium text-amber-900">{visibleMissingEmail} sin email · {visibleWon} en won</div>
          <p className="mt-1 text-xs text-amber-800/80">Prioriza los leads con señal clara antes de crear deals.</p>
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
            placeholder="Ej: Leads FR + food"
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
            placeholder="Ej: Leads FR + food"
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
              <th className="px-3">Contacto</th>
              <th className="px-3">Fuente</th>
              <th className="px-3">Idioma</th>
              <th className="px-3">Stage</th>
              <th className="px-3">Creado</th>
              <th className="px-3 text-right">Acción rápida</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr
                key={l.id}
                className="rounded-xl bg-black/5"
              >
                <td className="p-3 align-top">
                  <div className="font-medium text-[color:var(--color-text)]">{l.email || '—'}</div>
                  <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                    {l.whatsapp || ''}
                  </div>
                  {l.tags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {l.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[10px] text-[color:var(--color-text)]/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td className="p-3 align-top">{l.source || '—'}</td>
                <td className="p-3 align-top">{l.language || '—'}</td>
                <td className="p-3 align-top">
                  <span className="rounded-lg border border-black/10 bg-white/60 px-2 py-1 text-xs">
                    {l.stage}
                  </span>
                </td>
                <td className="text-[color:var(--color-text)]/60 p-3 align-top text-xs">
                  {new Date(l.created_at).toLocaleString('es-CO')}
                </td>
                <td className="p-3 text-right align-top">
                  <div className="flex flex-wrap justify-end gap-2">
                    <select
                      value={l.stage}
                      disabled={loading}
                      onChange={(e) => void updateStage(l.id, e.target.value)}
                      className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
                    >
                      {STAGES.map((s) => (
                        <option
                          key={s}
                          value={s}
                        >
                          {s}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => void convertLead(l.id)}
                      disabled={loading || !l.email || l.stage === 'won' || Boolean(l.customer_id)}
                      title={
                        !l.email
                          ? 'Requiere email'
                          : l.customer_id
                            ? 'Ya convertido'
                            : l.stage === 'won'
                              ? 'Ya está en won'
                              : 'Convertir a customer'
                      }
                      className="rounded-xl border border-black/20 bg-transparent px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      Convertir
                    </button>

                    <button
                      onClick={() => void createDealFromLead(l)}
                      disabled={loading}
                      className="rounded-xl border border-brand-blue/25 bg-brand-blue/5 px-3 py-2 text-sm font-medium text-brand-blue disabled:opacity-50"
                    >
                      Crear deal
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!items.length && (
              <tr>
                <td
                  colSpan={6}
                  className="text-[color:var(--color-text)]/60 px-3 py-6 text-center text-sm"
                >
                  {loading ? 'Cargando…' : 'No hay leads para este filtro.'}
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
    </section>
  );
}
