'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Users, Search, Bot, Download, 
  Tags, Sparkles, ShieldCheck, Terminal, Clock,
  Globe, Mail, Briefcase, UserCheck, RefreshCw, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO DEL NODO DE ADQUISICIÓN ---
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
const STAGES = ['new', 'qualified', 'proposal', 'won', 'lost'] as const;

// --- PERSISTENCIA DE FILTROS (LOCAL STORAGE) ---
function readSaved(): SavedLeadFilter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeSaved(filters: SavedLeadFilter[]) {
  if (typeof window === 'undefined') return;
  // Limitamos a 25 filtros para no saturar el storage del navegador
  localStorage.setItem(LS_KEY, JSON.stringify(filters.slice(0, 25)));
}

// --- HELPERS VISUALES ---
function badgeStage(stage: string) {
  const v = (stage || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (v === 'new') return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/50`;
  if (v === 'qualified') return `${base} border-sky-500/20 bg-sky-500/5 text-sky-600`;
  if (v === 'proposal') return `${base} border-amber-500/20 bg-amber-500/5 text-amber-600`;
  if (v === 'won') return `${base} border-emerald-500/20 bg-emerald-500/5 text-emerald-600`;
  if (v === 'lost') return `${base} border-rose-500/20 bg-rose-500/5 text-rose-600`;
  return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/40`;
}

export function AdminLeadsClient() {
  const [stage, setStage] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const [saved, setSaved] = useState<SavedLeadFilter[]>([]);
  const [selectedSaved, setSelectedSaved] = useState<string>('');
  const [saveName, setSaveName] = useState('');

  const [items, setItems] = useState<Lead[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // UX Pro: Control de peticiones concurrentes (Race Conditions)
  const reqIdRef = useRef(0);

  const pages = useMemo(() => total == null ? null : Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const visibleReadyToConvert = useMemo(() => items.filter((l) => !!l.email && !l.customer_id && l.stage !== 'won').length, [items]);
  const visibleMissingEmail = useMemo(() => items.filter((l) => !l.email).length, [items]);

  const load = useCallback(async () => {
    setLoading(true); 
    setErr(null);
    const myReqId = ++reqIdRef.current;

    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (stage) qs.set('stage', stage);
      if (source.trim()) qs.set('source', source.trim());
      if (q.trim()) qs.set('q', q.trim());

      const resp = await adminFetch(`/api/admin/leads?${qs.toString()}`, { cache: 'no-store' });
      const json = await resp.json().catch(() => ({}));

      if (myReqId !== reqIdRef.current) return;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando leads');

      setItems(json?.items || []);
      setTotal(json?.total ?? null);
    } catch (e: unknown) { 
      if (myReqId !== reqIdRef.current) return;
      setErr(e instanceof Error ? e.message : 'Falla de conexión'); 
    } finally { 
      if (myReqId === reqIdRef.current) setLoading(false); 
    }
  }, [stage, source, q, page, limit]);

  useEffect(() => { void load(); }, [load]);

  // Carga inicial de filtros guardados
  useEffect(() => { setSaved(readSaved()); }, []);

  // --- ACCIONES TÁCTICAS ---
  async function updateStage(id: string, newStage: string) {
    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: newStage }),
      });
      if (!resp.ok) throw new Error('Error al actualizar etapa');
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error al mover stage'); } 
    finally { setLoading(false); }
  }

  async function convertLead(id: string) {
    setLoading(true); setErr(null); setActionMsg(null);
    try {
      const resp = await adminFetch(`/api/admin/leads/${encodeURIComponent(id)}/convert`, { method: 'POST' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Error convirtiendo lead');
      setActionMsg(`Lead convertido a cliente con éxito.`);
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Falla en conversión'); } 
    finally { setLoading(false); }
  }

  async function createDealFromLead(lead: Lead) {
    setLoading(true); setErr(null); setActionMsg(null);
    try {
      const resp = await adminFetch('/api/admin/deals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id, 
          title: lead.email ? `Deal: ${lead.email}` : 'Lead Follow-up',
          stage: lead.stage === 'qualified' || lead.stage === 'proposal' ? lead.stage : 'new',
          source: lead.source || 'admin-leads',
          notes: [ 
            lead.notes?.trim() || '', 
            lead.tags.length ? `Tags: ${lead.tags.join(', ')}` : '', 
            lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : '' 
          ].filter(Boolean).join(' · ').slice(0, 4000),
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Error creando deal');
      setActionMsg(`Oportunidad de venta inyectada en el Pipeline.`);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error de creación'); } 
    finally { setLoading(false); }
  }

  const leadsSignals = useMemo(() => [
    { label: 'Leads Visibles', value: String(total ?? items.length), note: 'Prospectos bajo el filtro actual.' },
    { label: 'Cierre Potencial', value: String(visibleReadyToConvert), note: 'Prospectos con email convertibles.' },
    { label: 'Señal Débil', value: String(visibleMissingEmail), note: 'Sin correo registrado.' },
  ], [total, items.length, visibleReadyToConvert, visibleMissingEmail]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA OPERATIVA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Users className="h-3.5 w-3.5" /> Acquisition Lane: /leads-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
            Centro de <span className="text-brand-yellow italic font-light">Leads</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Semillero de KCE. Gestiona prospectos pre-compra capturados vía canales digitales antes de su escalado comercial.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH TÁCTICO */}
      <AdminOperatorWorkbench
        eyebrow="Lead Nurturing Strategy"
        title="Monitor de Tráfico Cualificado"
        description="Transforma prospectos en Deals o impúlsalos a Clientes. Usa el AI Brief para detectar tendencias de conversión en milisegundos."
        actions={[
          { href: '/admin/deals', label: 'Bandeja de Deals', tone: 'primary' },
          { href: '/admin/customers', label: 'Directorio Clientes' }
        ]}
        signals={leadsSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE FILTROS */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        
        <div className="p-8 pb-10 border-b border-[var(--color-border)]">
          <div className="flex flex-col xl:flex-row gap-6 xl:items-end justify-between">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 w-full xl:w-4/5">
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Búsqueda Inteligente</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email, WhatsApp, Notas..." className="w-full h-14 pl-12 rounded-2xl border border-[var(--color-border)] bg-white text-sm outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Etapa CRM</label>
                <select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }} className="w-full h-14 px-5 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer">
                  <option value="">Todas las Etapas</option>
                  {STAGES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Origen (Source)</label>
                <input value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} placeholder="ej: quiz, web..." className="w-full h-14 px-5 rounded-2xl border border-[var(--color-border)] bg-white text-sm outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all font-bold text-brand-blue" />
              </div>

            </div>

            <div className="flex items-center gap-3">
              <Button onClick={async () => {
                setBriefLoading(true); setAiBrief(null);
                try {
                  const res = await fetch('/api/admin/leads/brief');
                  const d = await res.json();
                  if (d.ok) setAiBrief(d.brief);
                } catch { setErr('Fallo al generar AI Brief'); } 
                finally { setBriefLoading(false); }
              }} disabled={briefLoading} variant="outline" className="h-14 rounded-2xl px-8 border-brand-yellow/30 bg-brand-yellow/5 text-brand-dark font-bold uppercase tracking-widest text-[10px]">
                <Bot className={`mr-2 h-4 w-4 ${briefLoading ? 'animate-pulse text-brand-blue' : ''}`} /> AI Brief
              </Button>
              <Button onClick={() => window.open(`/api/admin/leads/export?${new URLSearchParams({ stage, source, q }).toString()}`)} variant="ghost" className="h-14 rounded-2xl px-6 uppercase text-[10px] tracking-widest font-bold hover:bg-brand-blue/5">
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </div>
          </div>

          {aiBrief && (
            <div className="mt-8 rounded-[2.5rem] border border-brand-blue/20 bg-brand-blue/[0.02] p-10 animate-in zoom-in-95 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Sparkles className="h-64 w-64 text-brand-blue" /></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-brand-blue animate-pulse" />
                    <h3 className="font-heading text-xl text-brand-blue uppercase tracking-tight">Cohort Analysis & Brief</h3>
                  </div>
                  <button onClick={() => setAiBrief(null)} className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/40 hover:text-brand-blue">Cerrar</button>
                </div>
                <div className="text-sm font-light leading-relaxed text-brand-dark/80 max-w-none italic prose-sm prose-p:mb-4">{aiBrief}</div>
              </div>
            </div>
          )}

          {/* PRESETS DE SEGMENTACIÓN */}
          <div className="mt-8 flex flex-wrap items-center gap-4 p-5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10">
            <div className="flex items-center gap-2 text-emerald-700 shrink-0">
              <Terminal className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Presets Locales</span>
            </div>
            <div className="flex items-center gap-3">
              <select value={selectedSaved} onChange={(e) => { 
                setSelectedSaved(e.target.value); 
                const f = saved.find(x => x.name === e.target.value);
                if (f) { 
                  setStage(f.stage || ''); 
                  setSource(f.source || ''); 
                  setQ(f.q || ''); 
                  setPage(1); 
                }
              }} className="h-9 rounded-xl border border-emerald-500/20 bg-white px-4 text-[10px] font-bold uppercase text-emerald-800 outline-none cursor-pointer">
                <option value="">Cargar Vista...</option>
                {saved.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>
              <div className="flex items-center bg-white border border-emerald-500/20 rounded-xl overflow-hidden h-9 shadow-sm">
                <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Nombrar vista..." className="px-4 text-[10px] outline-none w-32 font-light" />
                <button 
                  onClick={() => {
                    const name = saveName.trim(); if (!name) return;
                    const next: SavedLeadFilter = { name, stage, source, q };
                    const updated = [next, ...saved.filter(x => x.name !== name)];
                    setSaved(updated); 
                    setSelectedSaved(name); 
                    writeSaved(updated); 
                    setSaveName('');
                  }} 
                  disabled={!saveName.trim()} 
                  className="px-4 text-[9px] font-bold uppercase text-emerald-700 hover:bg-emerald-50 h-full border-l border-emerald-500/20 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FEEDBACK DE ACCIONES */}
        {(err || actionMsg) && (
          <div className="mx-8 mt-6">
            {err && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-700 flex items-center gap-3 animate-in fade-in"><AlertCircle className="h-5 w-5 opacity-40"/> {err}</div>}
            {actionMsg && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-sm text-emerald-700 flex items-center gap-3 animate-in fade-in"><ShieldCheck className="h-5 w-5 opacity-40"/> {actionMsg}</div>}
          </div>
        )}

        {/* TABLA DE LEADS */}
        <div className="overflow-x-auto px-6 py-8">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-8 py-6">Entidad / Contacto</th>
                  <th className="px-8 py-6 text-center">Cualificación</th>
                  <th className="px-8 py-6 text-center">Estado Operativo</th>
                  <th className="px-8 py-6 text-right">Escalado Táctico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {loading && items.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-24 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-brand-blue/20">Consultando la Bóveda de Leads...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-32 text-center text-[var(--color-text)]/20 italic">No hay prospectos bajo este criterio en el nodo.</td></tr>
                ) : (
                  items.map((l) => (
                    <tr key={l.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-8 py-6 align-top">
                        <div className="font-heading text-xl text-brand-blue flex items-center gap-2 group-hover:text-brand-yellow transition-colors">
                          <Mail className="h-4 w-4 opacity-20" /> {l.email || 'Anónimo'}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-[var(--color-text)]/40">
                          <span className="italic">{l.whatsapp || 'Sin WhatsApp'}</span>
                          <span className="opacity-30">|</span>
                          <span className="uppercase tracking-tighter">ID: {l.id.slice(0, 8)}</span>
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/30 bg-[var(--color-surface-2)] px-2.5 py-1 rounded-md border border-[var(--color-border)] shadow-inner">
                           <Globe className="h-3 w-3" /> {l.source || 'Directo'} 
                           {l.language && <span className="border-l border-[var(--color-border)] pl-2 ml-1 text-brand-blue/60">{l.language}</span>}
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top text-center">
                        <div className="flex flex-wrap justify-center gap-1.5 max-w-[280px] mx-auto">
                          {l.tags.length > 0 ? l.tags.slice(0, 5).map(tag => (
                            <span key={tag} className="rounded-lg bg-brand-blue/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-blue/60 border border-brand-blue/10">
                              {tag}
                            </span>
                          )) : <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/20">— Void —</span>}
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className={badgeStage(l.stage)}>{l.stage}</span>
                          <div className="text-[9px] font-mono text-[var(--color-text)]/30 uppercase flex items-center gap-1">
                             <Clock className="h-3 w-3" /> {new Date(l.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top">
                        <div className="flex flex-col items-end gap-3">
                          <select value={l.stage} disabled={loading} onChange={(e) => void updateStage(l.id, e.target.value)} className="h-10 w-full max-w-[160px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-[9px] font-bold uppercase tracking-widest text-brand-blue/60 outline-none focus:border-brand-blue appearance-none cursor-pointer text-center shadow-inner">
                            {STAGES.map(s => <option key={s} value={s}>MOVER A {s.toUpperCase()}</option>)}
                          </select>
                          <div className="flex gap-2 w-full max-w-[220px] justify-end">
                            <button onClick={() => void createDealFromLead(l)} disabled={loading} className="flex-1 h-9 rounded-xl bg-brand-dark px-3 text-[9px] font-bold uppercase text-brand-yellow transition hover:scale-105 shadow-lg flex items-center justify-center gap-2">
                              <Briefcase className="h-3 w-3" /> Deal
                            </button>
                            <button onClick={() => void convertLead(l.id)} disabled={loading || !l.email || l.stage === 'won' || Boolean(l.customer_id)} className="flex-1 h-9 rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-3 text-[9px] font-bold uppercase text-brand-blue transition hover:bg-brand-blue/10 disabled:opacity-30 flex items-center justify-center gap-2">
                              <UserCheck className="h-3 w-3" /> Customer
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
        </div>

        {/* PAGINACIÓN ESTRATÉGICA */}
        {pages && pages > 1 && (
          <footer className="mx-8 mb-12 flex items-center justify-between border-t border-[var(--color-border)] pt-8">
            <button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-8 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-brand-blue/5">
              ← Anterior
            </button>
            <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/40">Página {page} de {pages}</div>
            <button disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-8 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-brand-blue/5">
              Siguiente →
            </button>
          </footer>
        )}
      </section>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="mt-20 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Core Acquisition Unit
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Intelligence unit active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <RefreshCw className="h-3.5 w-3.5" /> Synchronized Registry
        </div>
      </footer>
    </div>
  );
}