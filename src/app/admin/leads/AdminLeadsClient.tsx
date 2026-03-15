'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Users, Search, Filter, Bot, Download, ArrowRight, Tags, Target, Activity } from 'lucide-react';
import Link from 'next/link';

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

function badgeStage(stage: string) {
  const v = (stage || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest';
  if (v === 'new') return `${base} border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
  if (v === 'qualified') return `${base} border border-sky-500/20 bg-sky-500/10 text-sky-700`;
  if (v === 'proposal') return `${base} border border-amber-500/20 bg-amber-500/10 text-amber-700`;
  if (v === 'won') return `${base} border border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (v === 'lost') return `${base} border border-rose-500/20 bg-rose-500/10 text-rose-700`;
  return `${base} border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
}

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

  const visibleReadyToConvert = useMemo(() => items.filter((l) => !!l.email && !l.customer_id && l.stage !== 'won').length, [items]);
  const visibleMissingEmail = useMemo(() => items.filter((l) => !l.email).length, [items]);
  const visibleWon = useMemo(() => items.filter((l) => l.stage === 'won').length, [items]);

  async function load() {
    setLoading(true); setErr(null);
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
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error'); } finally { setLoading(false); }
  }

  async function updateStage(id: string, newStage: string) {
    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: newStage }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error');
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error'); } finally { setLoading(false); }
  }

  async function loadSegments() {
    try {
      const resp = await adminFetch('/api/admin/segments?entity_type=leads', { cache: 'no-store' });
      const json = (await resp.json().catch(() => null)) as { items?: Segment[]; error?: string; } | null;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando segmentos');
      setSegments(json?.items || []);
    } catch (_e) {}
  }

  function applySegment(id: string) {
    const seg = segments.find((x) => x.id === id);
    if (!seg) return;
    const f = seg.filter || {};
    setStage(typeof f.stage === 'string' ? f.stage : '');
    setSource(typeof f.source === 'string' ? f.source : '');
    if (Array.isArray(f.tags)) setTags((f.tags as unknown[]).filter((x) => typeof x === 'string').join(','));
    else setTags(typeof f.tags === 'string' ? f.tags : '');
    setQ(typeof f.q === 'string' ? f.q : '');
    setPage(1);
  }

  async function saveAsSegment() {
    const name = segmentName.trim(); if (!name) return;
    const stageV = stage.trim(); const sourceV = source.trim(); const qV = q.trim();
    const tagsArr = tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 20);

    try {
      const payload = {
        name, entity_type: 'leads',
        filter: { ...(stageV ? { stage: stageV } : {}), ...(sourceV ? { source: sourceV } : {}), ...(tagsArr.length ? { tags: tagsArr } : {}), ...(qV ? { q: qV } : {}), },
      };
      const resp = await adminFetch('/api/admin/segments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), });
      const json = (await resp.json().catch(() => null)) as any;
      if (!resp.ok) throw new Error(json?.error || 'Error guardando segmento');
      setSegmentName(''); await loadSegments();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error'); }
  }

  async function convertLead(id: string) {
    setLoading(true); setErr(null); setActionMsg(null);
    try {
      const resp = await adminFetch(`/api/admin/leads/${encodeURIComponent(id)}/convert`, { method: 'POST' });
      const json = (await resp.json().catch(() => null)) as { error?: string; customerId?: string | null } | null;
      if (!resp.ok) throw new Error(json?.error || 'Error convirtiendo lead');
      setActionMsg(`Lead convertido a customer${json?.customerId ? ` · ID: ${String(json.customerId).slice(0, 8)}` : ''}`);
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error'); } finally { setLoading(false); }
  }

  async function createDealFromLead(lead: Lead) {
    setLoading(true); setErr(null); setActionMsg(null);
    try {
      const resp = await adminFetch('/api/admin/deals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id, title: lead.email ? `Lead · ${lead.email}` : 'Lead follow-up',
          stage: lead.stage === 'qualified' || lead.stage === 'proposal' ? lead.stage : 'new',
          source: lead.source || 'admin-leads',
          notes: [ lead.notes?.trim() || '', lead.tags.length ? `Tags: ${lead.tags.join(', ')}` : '', lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : '', ].filter(Boolean).join(' · ').slice(0, 4000),
        }),
      });
      const json = (await resp.json().catch(() => null)) as { error?: string; dealId?: string | null } | null;
      if (!resp.ok) throw new Error(json?.error || 'Error creando deal');
      setActionMsg(`Deal creado${json?.dealId ? ` · ID: ${String(json.dealId).slice(0, 8)}` : ''}. Ve a la Bandeja de Deals.`);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error'); } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [stage, source, tags, q, page]);
  useEffect(() => { void loadSegments(); }, []);
  useEffect(() => { setSaved(readSaved()); }, []);

  function applySaved(name: string) {
    const f = saved.find((x) => x.name === name);
    if (!f) return;
    setStage(f.stage || ''); setSource(f.source || ''); setTags(f.tags || ''); setQ(f.q || ''); setPage(1);
  }

  function saveCurrent() {
    const name = saveName.trim(); if (!name) return;
    const next: SavedLeadFilter = { name, ...(stage.trim() ? { stage: stage.trim() } : {}), ...(source.trim() ? { source: source.trim() } : {}), ...(tags.trim() ? { tags: tags.trim() } : {}), ...(q.trim() ? { q: q.trim() } : {}) };
    const updated = [next, ...saved.filter((x) => x.name !== name)];
    setSaved(updated); setSelectedSaved(name); writeSaved(updated);
  }

  function deleteSaved(name: string) {
    const updated = saved.filter((x) => x.name !== name);
    setSaved(updated); if (selectedSaved === name) setSelectedSaved(''); writeSaved(updated);
  }

  function exportCsv() {
    const qs = new URLSearchParams();
    if (stage) qs.set('stage', stage); if (source.trim()) qs.set('source', source.trim()); if (tags.trim()) qs.set('tags', tags.trim()); if (q.trim()) qs.set('q', q.trim());
    window.open(`/api/admin/leads/export?${qs.toString()}`, '_blank', 'noopener,noreferrer');
  }

  const leadsSignals = useMemo(() => [
    { label: 'Leads Visibles', value: String(total ?? items.length), note: 'Contactos generados antes de la compra.' },
    { label: 'Listos para Convertir', value: String(visibleReadyToConvert), note: 'Tienen email y no son clientes aún.' },
    { label: 'Atención Requerida', value: String(visibleMissingEmail), note: 'Leads anónimos o sin correo registrado.' },
  ], [items.length, total, visibleReadyToConvert, visibleMissingEmail]);

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera Ejecutiva */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Centro de Leads</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Base de datos de prospectos pre-compra, capturados vía quiz o newsletter.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Lead Nurturing"
        title="El Semillero de Ventas"
        description="Convierte los prospectos más calientes en Deals o impúlsalos a Clientes si ya tienen perfil creado. Usa el botón de AI Brief para que Gemini analice la calidad de esta vista."
        actions={[
          { href: '/admin/deals', label: 'Bandeja de Deals', tone: 'primary' },
          { href: '/admin/customers', label: 'Directorio de Clientes' }
        ]}
        signals={leadsSignals}
      />

      {/* Acciones e Inteligencia */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 w-full xl:w-3/4">
            <label className="text-sm md:col-span-2">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Buscar Lead</div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email, WhatsApp, Notas..." className="w-full h-12 pl-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue transition-colors text-sm" />
              </div>
            </label>
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Etapa</div>
              <select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }} className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none appearance-none cursor-pointer text-sm">
                <option value="">Todas</option>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Fuente (Source)</div>
              <input value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} placeholder="ej: web, quiz..." className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue transition-colors text-sm" />
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={async () => {
              setBriefLoading(true); setAiBrief(null);
              try {
                const res = await fetch('/api/admin/leads/brief');
                const d = await res.json();
                if (d.ok) setAiBrief(d.brief);
              } catch {} finally { setBriefLoading(false); }
            }} disabled={briefLoading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-yellow/10 border border-brand-yellow/30 px-6 text-[10px] font-bold uppercase tracking-widest text-brand-dark transition hover:bg-brand-yellow/20 disabled:opacity-50">
              <Bot className={`h-4 w-4 ${briefLoading ? 'animate-pulse' : ''}`} /> AI Brief
            </button>
            <button onClick={exportCsv} disabled={loading || items.length === 0} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        </div>

        {/* AI Brief Result */}
        {aiBrief && (
          <div className="mb-8 rounded-3xl border border-brand-blue/30 bg-brand-blue/5 p-6 animate-fade-in">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-3">
              <Bot className="h-4 w-4"/> Análisis Gemini 1.5 Pro
            </div>
            <div className="text-sm font-light leading-relaxed text-[var(--color-text)]/80 prose-sm prose-p:mb-2 max-w-none">
              {aiBrief}
            </div>
            <button onClick={() => setAiBrief(null)} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors">Descartar Análisis</button>
          </div>
        )}

        {/* Segmentación Rápida */}
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 md:p-5">
          <div className="flex items-center gap-2 text-emerald-700 shrink-0">
            <Filter className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Segmentos & Vistas</span>
          </div>
          
          <div className="h-8 w-px bg-emerald-500/20 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <select value={selectedSaved} onChange={(e) => { const v = e.target.value; setSelectedSaved(v); if (v) applySaved(v); }} className="h-10 rounded-xl border border-emerald-500/20 bg-white/60 px-3 text-sm outline-none w-40 text-emerald-900">
              <option value="">Locales...</option>
              {saved.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
            <div className="flex items-center bg-white/60 border border-emerald-500/20 rounded-xl overflow-hidden h-10">
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Guardar vista..." className="bg-transparent px-3 text-sm outline-none w-32" />
              <button onClick={() => saveCurrent()} disabled={!saveName.trim()} className="px-3 text-[10px] font-bold uppercase text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-30 h-full border-l border-emerald-500/20 transition-colors">Guardar</button>
            </div>
          </div>
        </div>

        {err && <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-700">{err}</div>}
        {actionMsg && <div className="mb-6 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-sm font-medium text-brand-blue">{actionMsg}</div>}

        {/* Tabla */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Contacto / Origen</th>
                <th className="px-6 py-5 text-center">Etiqueta (Tags)</th>
                <th className="px-6 py-5 text-center">Etapa CRM</th>
                <th className="px-6 py-5 text-right">Convertir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading && items.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-sm font-medium text-[var(--color-text)]/40">Buscando leads...</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <Users className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    <div className="text-sm font-medium text-[var(--color-text)]/40">No hay leads que coincidan con estos filtros.</div>
                  </td>
                </tr>
              ) : (
                items.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-6 py-5 align-top">
                      <div className="font-heading text-lg text-brand-blue">{l.email || 'Sin Email'}</div>
                      <div className="text-xs text-[var(--color-text)]/60 font-mono mt-1">{l.whatsapp || 'Sin Teléfono'}</div>
                      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[var(--color-text)]/40">
                        <Activity className="h-3 w-3" /> {l.source || 'Directo'} 
                        {l.language && <span className="border-l border-[var(--color-border)] pl-2 ml-1">{l.language}</span>}
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top text-center">
                      {l.tags.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {l.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="rounded-lg bg-[var(--color-surface-2)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/70 border border-[var(--color-border)] flex items-center gap-1">
                              <Tags className="h-2 w-2 opacity-50"/> {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-text)]/30 italic">—</span>
                      )}
                    </td>

                    <td className="px-6 py-5 align-top text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={badgeStage(l.stage)}>{l.stage}</span>
                        <div className="text-[10px] font-mono text-[var(--color-text)]/40">Alta: {new Date(l.created_at).toLocaleDateString('es-ES')}</div>
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col items-end gap-2">
                        <select
                          value={l.stage}
                          disabled={loading}
                          onChange={(e) => void updateStage(l.id, e.target.value)}
                          className="h-9 w-full max-w-[140px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-brand-blue cursor-pointer transition-colors"
                        >
                          {STAGES.map(s => <option key={s} value={s}>→ Mover a {s}</option>)}
                        </select>
                        
                        <div className="flex gap-2 w-full max-w-[200px] justify-end mt-2">
                          <button onClick={() => void createDealFromLead(l)} disabled={loading} className="flex-1 flex justify-center items-center h-8 rounded-lg bg-brand-dark px-3 text-[9px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-sm disabled:opacity-50">
                            A Deal
                          </button>
                          <button onClick={() => void convertLead(l.id)} disabled={loading || !l.email || l.stage === 'won' || Boolean(l.customer_id)} className="flex-1 flex justify-center items-center h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-30">
                            A Customer
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pages && pages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
            <button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              ← Anterior
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
              Página {page} de {pages}
            </div>
            <button disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}