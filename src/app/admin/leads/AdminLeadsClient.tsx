'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Users, Search, Bot, Download, 
  Sparkles, ShieldCheck, Terminal, Clock,
  Globe, Mail, Briefcase, UserCheck, RefreshCw, AlertCircle, Filter, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AdminCard, AdminCardHeader, AdminCardTitle } from '@/components/admin/AdminCard';

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

// --- BADGE PREMIUM (Sin bordes duros) ---
function StageBadge({ stage }: { stage: string }) {
  const v = (stage || '').toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest";
  
  switch(v) {
    case 'new': return <span className={`${base} bg-brand-yellow/10 text-brand-terra`}>Nuevo</span>;
    case 'qualified': return <span className={`${base} bg-brand-blue/10 text-brand-blue`}>Calificado</span>;
    case 'proposal': return <span className={`${base} bg-amber-500/10 text-amber-600`}>Propuesta</span>;
    case 'won': return <span className={`${base} bg-[var(--color-success)]/10 text-[var(--color-success)]`}>Ganado</span>;
    case 'lost': return <span className={`${base} bg-[var(--color-error)]/10 text-[var(--color-error)]`}>Perdido</span>;
    default: return <span className={`${base} bg-[var(--color-surface-2)] text-[var(--color-text-muted)]`}>{stage}</span>;
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
  const [loading, setLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const pages = useMemo(() => total == null ? null : Math.max(1, Math.ceil(total / limit)), [total, limit]);
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
    <div className="space-y-8 pb-32 w-full max-w-[var(--container-max)] mx-auto animate-fade-in">
      
      {/* 01. CABECERA PREMIUM */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
            <Users className="h-3.5 w-3.5" /> Acquisition Lane
          </div>
          <h1 className="font-heading text-4xl text-[var(--color-text)] tracking-tight">
            Directorio de <span className="text-brand-terra">Leads</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)] font-light max-w-2xl">
            Gestiona prospectos pre-compra capturados vía canales digitales antes de su escalado comercial.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.open(`/api/admin/leads/export?${new URLSearchParams({ stage, source, q }).toString()}`)}
            className="btn btn-outline text-xs bg-[var(--color-surface)] backdrop-blur-sm shadow-soft"
          >
            <Download className="mr-2 h-4 w-4" /> CSV
          </button>
        </div>
      </header>

      {/* 02. WORKBENCH */}
      <AdminOperatorWorkbench
        eyebrow="Lead Nurturing Strategy"
        title="Monitor de Tráfico Cualificado"
        description="Transforma prospectos en Deals o impúlsalos a Clientes. Usa el AI Brief para detectar tendencias."
        actions={[
          { href: '/admin/deals', label: 'Bandeja de Deals', tone: 'primary' },
          { href: '/admin/customers', label: 'Directorio Clientes' }
        ]}
        signals={leadsSignals}
      />

      {/* FEEDBACK DE ACCIONES */}
      {(err || actionMsg) && (
        <div className="flex flex-col gap-3">
          {err && <div className="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-4 text-sm text-[var(--color-error)] flex items-center gap-3 animate-fade-in"><AlertCircle className="h-5 w-5"/> {err}</div>}
          {actionMsg && <div className="rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-4 text-sm text-[var(--color-success)] flex items-center gap-3 animate-fade-in"><ShieldCheck className="h-5 w-5"/> {actionMsg}</div>}
        </div>
      )}

      {/* 03. LA BOVEDA DE LEADS (Glassmorphism List) */}
      <AdminCard noPadding className="overflow-hidden">
        
        {/* Filtros Inteligentes (Header de la tarjeta) */}
        <div className="p-5 sm:p-6 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/30 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          
          {/* Inputs de filtrado */}
          <div className="flex flex-col sm:flex-row flex-1 gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <input 
                value={q} onChange={(e) => setQ(e.target.value)} 
                placeholder="Buscar Email o WhatsApp..." 
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all" 
              />
            </div>
            
            <select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }} className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium outline-none cursor-pointer flex-1 sm:max-w-[180px]">
              <option value="">Todas las Etapas</option>
              {STAGES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>

            <input 
              value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} 
              placeholder="Origen (ej: quiz)" 
              className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none flex-1 sm:max-w-[150px]" 
            />
          </div>

          {/* Presets Locales y Botón IA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 border-t xl:border-t-0 pt-4 xl:pt-0 border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <select value={selectedSaved} onChange={(e) => { 
                  setSelectedSaved(e.target.value); 
                  const f = saved.find(x => x.name === e.target.value);
                  if (f) { setStage(f.stage || ''); setSource(f.source || ''); setQ(f.q || ''); setPage(1); }
                }} 
                className="h-10 rounded-l-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-muted)] cursor-pointer outline-none border-r-0"
              >
                <option value="">Presets...</option>
                {saved.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>
              <div className="flex h-10 items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-r-xl overflow-hidden">
                <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Nombrar..." className="w-24 px-3 text-xs outline-none bg-transparent" />
                <button 
                  onClick={() => {
                    const name = saveName.trim(); if (!name) return;
                    const next: SavedLeadFilter = { name, stage, source, q };
                    const updated = [next, ...saved.filter(x => x.name !== name)];
                    setSaved(updated); setSelectedSaved(name); writeSaved(updated); setSaveName('');
                  }} 
                  disabled={!saveName.trim()} 
                  className="px-3 h-full text-xs font-medium text-brand-blue hover:bg-brand-blue/5 border-l border-[var(--color-border)] transition-colors disabled:opacity-30"
                >
                  Guardar
                </button>
              </div>
            </div>

            <button 
              onClick={async () => {
                setBriefLoading(true); setAiBrief(null);
                try {
                  const res = await fetch('/api/admin/leads/brief'); const d = await res.json();
                  if (d.ok) setAiBrief(d.brief);
                } catch { setErr('Fallo al generar AI Brief'); } finally { setBriefLoading(false); }
              }} 
              disabled={briefLoading} 
              className="h-10 px-4 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-brand-yellow/20 to-brand-terra/10 border border-brand-yellow/20 text-brand-terra text-xs font-bold uppercase hover:opacity-80 transition-opacity whitespace-nowrap"
            >
              <Bot className={`h-4 w-4 ${briefLoading ? 'animate-pulse' : ''}`} /> {briefLoading ? 'Generando...' : 'AI Brief'}
            </button>
          </div>
        </div>

        {/* AI Brief Modal (In-page) */}
        {aiBrief && (
          <div className="bg-brand-blue/[0.02] border-b border-[var(--color-border)] p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Sparkles className="h-48 w-48 text-brand-blue" /></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg font-semibold text-brand-blue flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse" /> Análisis de Cohorte (AI)</h3>
                <button onClick={() => setAiBrief(null)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline">Cerrar</button>
              </div>
              <div className="text-sm font-body leading-relaxed text-[var(--color-text-muted)] max-w-4xl whitespace-pre-wrap">{aiBrief}</div>
            </div>
          </div>
        )}

        {/* Lista Continua (Seamless List) */}
        <div className="p-2 sm:p-4 min-h-[400px]">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)] opacity-50">
              <RefreshCw className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm font-medium tracking-widest uppercase">Consultando Bóveda...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)] opacity-50">
              <Filter className="h-10 w-10 mb-4 opacity-30" />
              <p className="text-sm">No se encontraron leads bajo estos filtros.</p>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {items.map((l) => (
                <div key={l.id} className="group flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]/80 transition-colors rounded-xl -mx-2">
                  
                  {/* Columna Izquierda: Identidad */}
                  <div className="flex items-start gap-4 xl:w-1/3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-heading font-bold shadow-soft">
                      {l.email ? l.email.charAt(0).toUpperCase() : <Users className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="font-heading font-semibold text-[var(--color-text)] text-base group-hover:text-brand-blue transition-colors truncate max-w-[200px] sm:max-w-xs">
                        {l.email || 'Contacto Anónimo'}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-2">
                        {l.whatsapp ? <span>{l.whatsapp}</span> : <span className="opacity-50">Sin WA</span>}
                        <span className="opacity-30">•</span>
                        <span className="font-mono text-[10px] uppercase opacity-60">ID: {l.id.slice(0,6)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Columna Centro: Contexto */}
                  <div className="xl:w-1/3 flex flex-col gap-2 xl:px-4">
                    <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-md shadow-sm">
                        <Globe className="h-3 w-3 text-brand-terra" /> {l.source || 'Directo'}
                      </span>
                      {l.language && <span className="uppercase text-brand-blue/70 font-bold">{l.language}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {l.tags.length > 0 ? l.tags.slice(0,4).map(tag => (
                        <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                          {tag}
                        </span>
                      )) : <span className="text-[10px] text-[var(--color-text)]/20 italic">—</span>}
                    </div>
                  </div>

                  {/* Columna Derecha: Estado y Acciones */}
                  <div className="xl:w-1/3 flex flex-col xl:items-end justify-between gap-3">
                    <div className="flex items-center justify-between xl:justify-end gap-4 w-full">
                      <span className="text-xs text-[var(--color-text-muted)] font-mono flex items-center gap-1.5">
                        <Clock className="w-3 h-3 opacity-50"/>
                        {new Date(l.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </span>
                      <StageBadge stage={l.stage} />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full xl:justify-end">
                      <select 
                        value={l.stage} disabled={loading} onChange={(e) => void updateStage(l.id, e.target.value)} 
                        className="h-8 px-2 text-[10px] font-bold uppercase bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] outline-none cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      
                      <div className="flex gap-2">
                        <button onClick={() => void createDealFromLead(l)} disabled={loading} title="Mover a Deals" className="h-8 w-8 flex items-center justify-center rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-brand-terra hover:bg-brand-terra hover:text-white transition-colors shadow-sm">
                          <Briefcase className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => void convertLead(l.id)} disabled={loading || !l.email || l.stage === 'won' || Boolean(l.customer_id)} title="Convertir a Cliente" className="h-8 w-8 flex items-center justify-center rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-brand-blue hover:bg-brand-blue hover:text-white transition-colors shadow-sm disabled:opacity-30 disabled:hover:bg-[var(--color-surface-2)] disabled:hover:text-brand-blue">
                          <UserCheck className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Paginación Premium Integrada */}
        {pages && pages > 1 && (
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[var(--color-text-muted)]">
              Página <strong className="text-[var(--color-text)]">{page}</strong> de {pages}
            </span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-8 px-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 transition-colors">
                Anterior
              </button>
              <button disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)} className="h-8 px-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  );
}