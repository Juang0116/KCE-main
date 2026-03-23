'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Users, Search, Bot, Download, 
  Sparkles, ShieldCheck, Terminal, Clock,
  Globe, Mail, Briefcase, UserCheck, RefreshCw, 
  AlertCircle, Filter, ChevronRight, Hash, Zap,
  Activity, Database, Layout, Trash2, Save,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AdminCard } from '@/components/admin/AdminCard';

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

type SavedLeadFilter = {
  name: string;
  stage?: string;
  source?: string;
  tags?: string;
  q?: string;
};

const LS_KEY = 'kce_admin_lead_filters_v1';
const STAGES = ['new', 'qualified', 'proposal', 'won', 'lost'] as const;

// --- PERSISTENCIA DE FILTROS ---
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
  localStorage.setItem(LS_KEY, JSON.stringify(filters.slice(0, 25)));
}

// --- BADGE PREMIUM ---
function StageBadge({ stage }: { stage: string }) {
  const v = (stage || '').toLowerCase();
  const base = "inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm";
  
  switch(v) {
    case 'new': return <span className={`${base} border-brand-yellow/20 bg-brand-yellow/5 text-brand-terra`}>Nuevo</span>;
    case 'qualified': return <span className={`${base} border-brand-blue/20 bg-brand-blue/5 text-brand-blue`}>Calificado</span>;
    case 'proposal': return <span className={`${base} border-amber-500/20 bg-amber-500/5 text-amber-600`}>Propuesta</span>;
    case 'won': return <span className={`${base} border-green-500/20 bg-green-500/5 text-green-600`}>Ganado</span>;
    case 'lost': return <span className={`${base} border-red-500/20 bg-red-500/5 text-red-600`}>Perdido</span>;
    default: return <span className={`${base} border-brand-dark/10 bg-surface-2 text-muted`}>{stage}</span>;
  }
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
  const [loading, setLoading] = useState(true);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const pages = useMemo(() => total == null ? 1 : Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const visibleReadyToConvert = useMemo(() => items.filter((l) => !!l.email && !l.customer_id && l.stage !== 'won').length, [items]);
  const visibleMissingEmail = useMemo(() => items.filter((l) => !l.email).length, [items]);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
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
  useEffect(() => { setSaved(readSaved()); }, []);

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
    { label: 'Leads Visibles', value: String(total ?? items.length), note: 'Bajo el radar actual.' },
    { label: 'Cierre Potencial', value: String(visibleReadyToConvert), note: 'Prospectos convertibles.' },
    { label: 'Señal Débil', value: String(visibleMissingEmail), note: 'Sin contacto verificado.' },
    { label: 'Clusters', value: String(new Set(items.flatMap(l => l.tags)).size), note: 'Segmentos detectados.' }
  ], [total, items, visibleReadyToConvert, visibleMissingEmail]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Users className="h-3.5 w-3.5" /> Acquisition & Nurturing Lane
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
            Directorio de <span className="text-brand-yellow italic font-light">Leads</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Gestión táctica de prospectos capturados vía canales digitales. Califica la intención de viaje y escala las señales de interés hacia el Pipeline comercial.
          </p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => window.open(`/api/admin/leads/export?${new URLSearchParams({ stage, source, q }).toString()}`)}
            className="h-12 rounded-full border-brand-dark/10 shadow-sm font-bold uppercase tracking-widest text-[10px] px-8 hover:bg-surface-2 transition-all bg-surface text-muted"
          >
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </header>

      {/* 02. ESTRATEGIA OPERATIVA */}
      <AdminOperatorWorkbench
        eyebrow="Lead Management Logic"
        title="Monitor de Tráfico Cualificado"
        description="Transforma prospectos en Deals de alta conversión o impúlsalos a Clientes cuando la confianza sea absoluta. Usa la síntesis de IA para detectar tendencias de grupo."
        actions={[
          { href: '/admin/deals/board', label: 'Ver Tablero Kanban', tone: 'primary' },
          { href: '/admin/customers', label: 'Maestro Clientes' }
        ]}
        signals={leadsSignals}
      />

      {/* FEEDBACK DE ACCIONES */}
      {(err || actionMsg) && (
        <div className="flex flex-col gap-4 animate-in slide-in-from-top-2">
          {err && <div className="rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-5 text-sm text-red-700 dark:text-red-400 flex items-center gap-4 shadow-sm font-bold">
            <AlertCircle className="h-6 w-6 opacity-60"/> {err}
          </div>}
          {actionMsg && <div className="rounded-[var(--radius-2xl)] border border-green-500/20 bg-green-50 dark:bg-green-950/10 p-5 text-sm text-green-700 dark:text-green-400 flex items-center gap-4 shadow-sm font-bold">
            <ShieldCheck className="h-6 w-6 opacity-60"/> {actionMsg}
          </div>}
        </div>
      )}

      {/* 03. LA BÓVEDA DE LEADS */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative flex flex-col">
        
        {/* Filtros de Inteligencia */}
        <div className="p-8 bg-surface-2/30 border-b border-brand-dark/5 dark:border-white/5">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full xl:flex-1">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Identidad / Nodo</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input 
                    value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} 
                    placeholder="Email o WhatsApp..." 
                    className="w-full h-12 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30" 
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Etapa de Señal</label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40" />
                  <select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }} className="w-full h-12 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm font-bold text-main outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner">
                    <option value="">Todas las Etapas</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Origen (UTM_Source)</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input 
                    value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} 
                    placeholder="ej: quiz, ads, organic" 
                    className="w-full h-12 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30" 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3">
                <Layout className="h-4 w-4 text-muted opacity-40" />
                <select value={selectedSaved} onChange={(e) => { 
                    setSelectedSaved(e.target.value); 
                    const f = saved.find(x => x.name === e.target.value);
                    if (f) { setStage(f.stage || ''); setSource(f.source || ''); setQ(f.q || ''); setPage(1); }
                  }} 
                  className="h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface px-4 text-xs font-bold text-brand-blue outline-none min-w-[150px] shadow-sm appearance-none cursor-pointer hover:bg-surface-2 transition-colors"
                >
                  <option value="">Presets...</option>
                  {saved.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
                </select>
                <div className="flex h-12 items-center bg-surface border border-brand-dark/10 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                  <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Vista..." className="w-24 px-4 text-xs outline-none bg-transparent text-main" />
                  <button 
                    onClick={() => {
                      const name = saveName.trim(); if (!name) return;
                      const next: SavedLeadFilter = { name, stage, source, q };
                      const updated = [next, ...saved.filter(x => x.name !== name)];
                      setSaved(updated); setSelectedSaved(name); writeSaved(updated); setSaveName('');
                    }} 
                    disabled={!saveName.trim()} 
                    className="px-4 h-full text-brand-blue hover:bg-brand-blue hover:text-white border-l border-brand-dark/5 transition-all disabled:opacity-20"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button 
                onClick={async () => {
                  setBriefLoading(true); setAiBrief(null);
                  try {
                    const res = await fetch('/api/admin/leads/brief'); const d = await res.json();
                    if (d.ok) setAiBrief(d.brief);
                  } catch { setErr('Fallo al generar Intelligence Brief'); } finally { setBriefLoading(false); }
                }} 
                disabled={briefLoading} 
                className="h-12 px-6 rounded-xl bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white shadow-pop transition-all active:scale-95 flex items-center gap-3"
              >
                <Bot className={`h-5 w-5 ${briefLoading ? 'animate-spin' : ''}`} /> 
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{briefLoading ? 'Analizando...' : 'AI Synthesis'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* AI Brief Section (In-page terminal) */}
        {aiBrief && (
          <div className="bg-brand-dark p-10 border-b border-white/5 relative overflow-hidden group animate-in slide-in-from-top-4 duration-500">
            <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
              <Sparkles className="h-64 w-64 text-brand-blue" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-brand-blue/20 flex items-center justify-center">
                      <Terminal className="h-5 w-5 text-brand-blue" />
                   </div>
                   <div>
                      <h3 className="font-heading text-2xl text-white tracking-tight">Intelligence Synthesis</h3>
                      <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">Lead Cohort Analysis mmxxvi</p>
                   </div>
                </div>
                <button onClick={() => setAiBrief(null)} className="h-10 px-5 rounded-full border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all">Cerrar Análisis</button>
              </div>
              <div className="text-base font-light leading-relaxed text-white/80 max-w-5xl whitespace-pre-wrap font-mono selection:bg-brand-blue/30 border-l-2 border-brand-blue/20 pl-8">
                {aiBrief}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Leads (La Tabla) */}
        <div className="overflow-x-auto custom-scrollbar px-2 pb-6">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Entidad Prospecto</th>
                <th className="px-8 py-5">Contexto & Origen</th>
                <th className="px-8 py-5">Estatus & Antigüedad</th>
                <th className="px-8 py-5 text-right">Mando Táctico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {loading && items.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-40 text-center animate-pulse text-[11px] font-bold uppercase tracking-[0.5em] text-muted bg-surface">Consultando Bóveda de Adquisición...</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-40 text-center bg-surface">
                    <Filter className="mx-auto h-16 w-16 text-brand-blue opacity-10 mb-6" />
                    <p className="text-xl font-heading text-main tracking-tight opacity-30">Silencio en el Canal</p>
                    <p className="text-sm font-light text-muted mt-2 italic">No se han detectado prospectos bajo la instrumentación actual.</p>
                  </td>
                </tr>
              ) : (
                items.map((l) => (
                  <tr key={l.id} className="group transition-colors hover:bg-surface-2/50 cursor-default bg-surface">
                    
                    {/* Identidad */}
                    <td className="px-8 py-8 align-top">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 border border-brand-blue/5 flex items-center justify-center text-brand-blue font-bold text-sm shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                          {l.email ? l.email.charAt(0).toUpperCase() : <Users className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-heading text-xl text-main group-hover:text-brand-blue transition-colors leading-none tracking-tight">
                            {l.email || 'Contacto Anónimo'}
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-[10px] font-mono text-muted opacity-60 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-brand-yellow" /> {l.whatsapp || 'NO_WA'}</span>
                            <span className="opacity-30">/</span>
                            <span className="flex items-center gap-1.5"><Hash className="h-3 w-3" /> {l.id.slice(0,8)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contexto */}
                    <td className="px-8 py-8 align-top">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                           <span className="inline-flex items-center gap-2 rounded-xl bg-surface-2 border border-brand-dark/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-main shadow-inner">
                              <Globe className="h-3.5 w-3.5 text-brand-blue opacity-40" /> {l.source || 'Direct_Entry'}
                           </span>
                           {l.language && <span className="text-[10px] font-bold text-brand-blue uppercase">{l.language}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {l.tags.length > 0 ? l.tags.slice(0,5).map(tag => (
                              <span key={tag} className="text-[8px] font-bold uppercase tracking-widest text-muted border border-brand-dark/10 px-2 py-0.5 rounded-md group-hover:border-brand-blue/30 transition-colors">
                                {tag}
                              </span>
                           )) : <span className="text-[10px] text-muted opacity-20 italic">No segment tags</span>}
                        </div>
                      </div>
                    </td>

                    {/* Estatus */}
                    <td className="px-8 py-8 align-top">
                       <div className="flex flex-col gap-3">
                          <StageBadge stage={l.stage} />
                          <div className="flex items-center gap-2 text-[10px] text-muted opacity-60 font-mono tracking-tighter">
                             <Clock className="h-3.5 w-3.5 opacity-40" />
                             Cerrado: {new Date(l.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                       </div>
                    </td>

                    {/* Mando Táctico */}
                    <td className="px-8 py-8 align-top text-right">
                       <div className="flex flex-col items-end gap-3">
                          <select 
                            value={l.stage} disabled={loading} onChange={(e) => void updateStage(l.id, e.target.value)} 
                            className="h-9 px-4 text-[9px] font-bold uppercase tracking-widest bg-surface-2 border border-brand-dark/10 rounded-xl text-muted outline-none cursor-pointer hover:bg-surface transition-all shadow-sm"
                          >
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          
                          <div className="flex gap-2">
                            <button onClick={() => void createDealFromLead(l)} disabled={loading} title="Inyectar en Pipeline" className="h-11 px-5 rounded-xl bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white transition-all shadow-pop active:scale-95 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                               <Briefcase className="h-4 w-4" /> Pipeline
                            </button>
                            <button onClick={() => void convertLead(l.id)} disabled={loading || !l.email || l.stage === 'won' || Boolean(l.customer_id)} title="Convertir a Cliente Verificado" className="h-11 w-11 rounded-xl border border-brand-dark/10 bg-surface text-muted hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all shadow-sm flex items-center justify-center active:scale-95 disabled:opacity-20">
                               <UserCheck className="h-5 w-5" />
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
        
        {/* Paginación Estratégica */}
        {pages > 1 && (
          <footer className="p-8 flex items-center justify-between border-t border-brand-dark/5 dark:border-white/5 bg-surface-2/30 gap-6">
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-full h-12 px-10 border-brand-dark/10 text-[10px] font-bold uppercase tracking-widest hover:bg-surface transition-all shadow-sm">
              Anterior
            </Button>
            
            <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-60">
              Nodo de Adquisición <span className="text-main font-bold">{page}</span> de {pages}
            </div>

            <Button variant="outline" disabled={page >= pages || loading} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-full h-12 px-10 border-brand-dark/10 text-[10px] font-bold uppercase tracking-widest hover:bg-surface transition-all shadow-sm">
              Siguiente
            </Button>
          </footer>
        )}
      </section>

      {/* FOOTER TÉCNICO */}
      <footer className="pt-16 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 opacity-40 hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4 text-brand-blue" /> Data Acquisition Node v4.4
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Sparkles className="h-4 w-4 text-brand-yellow" /> P84 Conversion Protocol Active
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Activity className="h-4 w-4 text-brand-blue" /> Market-Signal Monitoring
        </div>
      </footer>

    </div>
  );
}